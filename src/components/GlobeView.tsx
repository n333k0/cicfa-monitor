import { useEffect, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { _GlobeView as GlobeView, COORDINATE_SYSTEM, LinearInterpolator } from '@deck.gl/core';
import { ScatterplotLayer, ArcLayer, GeoJsonLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { SphereGeometry } from '@luma.gl/engine';
import type { PickingInfo } from '@deck.gl/core';

import { INSTITUTIONS } from '../data/institutions';
import { VECTORS } from '../data/vectors';
import coastline from '../data/coastline.json';
import { engine } from '../sim/engine';
import { slerp } from '../sim/geo';
import { useEngine, useFrame } from '../sim/useEngine';
import type { AttackEvent } from '../sim/types';

const EARTH_R = 6.3e6;
const transition = new LinearInterpolator(['longitude', 'latitude', 'zoom']);

// graticule every 20°
function graticule() {
  const feats: GeoJSON.Feature[] = [];
  for (let lon = -180; lon <= 180; lon += 20) {
    const c: [number, number][] = [];
    for (let lat = -80; lat <= 80; lat += 4) c.push([lon, lat]);
    feats.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: c } });
  }
  for (let lat = -80; lat <= 80; lat += 20) {
    const c: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 4) c.push([lon, lat]);
    feats.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: c } });
  }
  return { type: 'FeatureCollection', features: feats } as GeoJSON.FeatureCollection;
}
const GRATICULE = graticule();
const sphereMesh = new SphereGeometry({ radius: EARTH_R, nlat: 36, nlong: 72 });
const domeMesh = new SphereGeometry({ radius: 1, nlat: 10, nlong: 18 });

function envelope(p: number) { if (p < 0.08) return p / 0.08; if (p <= 1) return 1; return Math.max(0, 1 - (p - 1) / 0.25); }

export default function Globe() {
  const snap = useEngine();
  useFrame();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vs, setVs] = useState<any>({ longitude: 8, latitude: 24, zoom: 2.05, pitch: 0, bearing: 0 });
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const interacting = useRef(false);
  const pauseUntil = useRef(0);

  // fly to selection
  useEffect(() => {
    const t = engine.consumeFlyTarget();
    if (t) {
      pauseUntil.current = performance.now() + 1800;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setVs((v: any) => ({ ...v, longitude: t.lon, latitude: t.lat, zoom: Math.max(t.zoom - 1.6, 0), transitionDuration: 1400, transitionInterpolator: transition }));
    }
  }, [snap.selectedInstitution, snap.version]);

  // gentle auto-rotation when idle
  useEffect(() => {
    const id = window.setInterval(() => {
      if (interacting.current || performance.now() < pauseUntil.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setVs((v: any) => {
        const rest = { ...v }; delete rest.transitionDuration; delete rest.transitionInterpolator;
        let lon = (rest.longitude ?? 0) + 0.06; if (lon > 180) lon -= 360;
        return { ...rest, longitude: lon };
      });
    }, 40);
    return () => clearInterval(id);
  }, []);

  const now = engine.clock;
  const active = engine.getActive().filter((e) => engine.passesFilter(e));
  const hits = snap.hits;
  const sel = snap.selectedInstitution;
  const insts = INSTITUTIONS.filter((d) => snap.filters.regions.has(d.region));
  const domes = insts.filter((d) => (hits[d.id] ?? 0) > 0);

  const layers = [
    // dark occluding earth
    new SimpleMeshLayer({
      id: 'earth', data: [0], mesh: sphereMesh,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      getPosition: [0, 0, 0], getColor: [7, 8, 12],
      getOrientation: [0, 0, 0],
    }),
    new GeoJsonLayer({
      id: 'graticule', data: GRATICULE, stroked: true, filled: false,
      getLineColor: [120, 130, 150, 28], lineWidthUnits: 'pixels', getLineWidth: 0.5,
    }),
    new GeoJsonLayer({
      id: 'coast', data: coastline as unknown as GeoJSON.FeatureCollection, stroked: true, filled: false,
      getLineColor: [200, 210, 224, 110], lineWidthUnits: 'pixels', getLineWidth: 0.7,
    }),
    // activity domes (full sphere on surface; inner half occluded by earth → reads as dome)
    new SimpleMeshLayer({
      id: 'domes', data: domes, mesh: domeMesh, wireframe: true,
      getPosition: (d: typeof domes[number]) => [d.lon, d.lat, 0],
      getScale: (d: typeof domes[number]) => { const r = Math.min(780000, 130000 + Math.sqrt(hits[d.id] ?? 0) * 250000 + d.prominence * 26000); return [r, r, r]; },
      getColor: (d: typeof domes[number]) => (d.id === sel ? [255, 200, 120, 220] : [235, 110, 30, 150]),
      updateTriggers: { getScale: [now], getColor: [sel] },
    }),
    // tiny institution dots
    new ScatterplotLayer({
      id: 'nodes', data: insts, pickable: true, radiusUnits: 'pixels',
      getPosition: (d: typeof insts[number]) => [d.lon, d.lat],
      getRadius: (d: typeof insts[number]) => (d.id === sel ? 4 : 1.1 + Math.min(3, (hits[d.id] ?? 0) * 0.15)),
      getFillColor: (d: typeof insts[number]) => (d.id === sel ? [255, 220, 150, 255] : [150, 160, 180, 150]),
      onClick: (i: PickingInfo) => { if (i.object) engine.selectInstitution((i.object as { id: string }).id); return true; },
      onHover: (i: PickingInfo) => setHover(i.object ? { x: i.x, y: i.y, text: `${(i.object as { name: string }).name}` } : null),
      updateTriggers: { getRadius: [now, sel], getFillColor: [sel] },
    }),
    // arcs
    new ArcLayer({
      id: 'arcs', data: active, greatCircle: true, widthUnits: 'pixels',
      getSourcePosition: (e: AttackEvent) => [e.sourceLon, e.sourceLat],
      getTargetPosition: (e: AttackEvent) => [e.targetLon, e.targetLat],
      getSourceColor: (e: AttackEvent) => { const c = VECTORS[e.vector].color; return [c[0], c[1], c[2], 20 + envelope((now - e.startedAt) / e.durationMs) * 70]; },
      getTargetColor: (e: AttackEvent) => { const c = VECTORS[e.vector].color; return [c[0], c[1], c[2], 60 + envelope((now - e.startedAt) / e.durationMs) * 170]; },
      getWidth: (e: AttackEvent) => 0.5 + e.severity * 0.4,
      getHeight: 0.4,
      updateTriggers: { getSourceColor: [now], getTargetColor: [now] },
    }),
    // packets
    new ScatterplotLayer({
      id: 'packets', data: active.map((e) => { const p = Math.min(1, (now - e.startedAt) / e.durationMs); const [lon, lat] = slerp(e.sourceLon, e.sourceLat, e.targetLon, e.targetLat, p); return { lon, lat, e }; }),
      radiusUnits: 'pixels',
      getPosition: (p: { lon: number; lat: number }) => [p.lon, p.lat],
      getRadius: (p: { e: AttackEvent }) => 1.4 + p.e.severity * 0.6,
      getFillColor: (p: { e: AttackEvent }) => { const c = VECTORS[p.e.vector].color; return [c[0], c[1], c[2], 255]; },
      updateTriggers: { getPosition: [now], getFillColor: [now] },
    }),
  ];

  return (
    <div className="map-root">
      <DeckGL
        views={new GlobeView({ resolution: 12 })}
        viewState={vs}
        onViewStateChange={(p: { viewState: unknown }) => setVs(p.viewState)}
        onInteractionStateChange={(s: { isDragging?: boolean; isPanning?: boolean; isZooming?: boolean; isRotating?: boolean }) => {
          interacting.current = !!(s.isDragging || s.isPanning || s.isZooming || s.isRotating);
          if (interacting.current) pauseUntil.current = performance.now() + 2500;
        }}
        controller={{ dragRotate: true, inertia: true }}
        layers={layers}
      />
      {hover && <div className="map-tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>{hover.text}</div>}
      <div className="map-grain" />
      <div className="map-vignette" />
      <div className="map-scanlines" />
    </div>
  );
}
