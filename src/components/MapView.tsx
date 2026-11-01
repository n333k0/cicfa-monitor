import { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView as DeckMapView, LinearInterpolator } from '@deck.gl/core';
import { ScatterplotLayer, ArcLayer, GeoJsonLayer, TextLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';

import { INSTITUTIONS } from '../data/institutions';
import { AGENTS } from '../data/agents';
import { VECTORS } from '../data/vectors';
import coastline from '../data/coastline.json';
import borders from '../data/borders.json';
import { engine } from '../sim/engine';
import { slerp } from '../sim/geo';
import { useEngine, useFrame } from '../sim/useEngine';
import type { AttackEvent } from '../sim/types';

// FLAT view: pure thin-line minimal map on black (no basemap tiles / fills / labels).
const transition = new LinearInterpolator(['longitude', 'latitude', 'zoom']);

function graticule() {
  const feats: GeoJSON.Feature[] = [];
  for (let lon = -180; lon <= 180; lon += 20) feats.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[lon, -84], [lon, 84]] } });
  for (let lat = -80; lat <= 80; lat += 20) feats.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] } });
  return { type: 'FeatureCollection', features: feats } as GeoJSON.FeatureCollection;
}
const GRATICULE = graticule();
function envelope(p: number) { if (p < 0.08) return p / 0.08; if (p <= 1) return 1; return Math.max(0, 1 - (p - 1) / 0.25); }

export default function MapView() {
  const snap = useEngine();
  useFrame();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vs, setVs] = useState<any>({ longitude: 10, latitude: 28, zoom: 1.55, pitch: 0, bearing: 0 });
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const t = engine.consumeFlyTarget();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (t) setVs((v: any) => ({ ...v, longitude: t.lon, latitude: t.lat, zoom: t.zoom, transitionDuration: 1200, transitionInterpolator: transition }));
  }, [snap.selectedInstitution, snap.version]);

  const now = engine.clock;
  const active = engine.getActive().filter((e) => engine.passesFilter(e));
  const hits = snap.hits;
  const sel = snap.selectedInstitution;
  const insts = INSTITUTIONS.filter((d) => snap.filters.regions.has(d.region));
  const domes = insts.filter((d) => (hits[d.id] ?? 0) > 0);

  const layers = [
    new GeoJsonLayer({ id: 'graticule', data: GRATICULE, stroked: true, filled: false, getLineColor: [120, 130, 150, 18], lineWidthUnits: 'pixels', getLineWidth: 0.5 }),
    new GeoJsonLayer({ id: 'borders', data: borders as unknown as GeoJSON.FeatureCollection, stroked: true, filled: false, getLineColor: [120, 130, 148, 60], lineWidthUnits: 'pixels', getLineWidth: 0.5 }),
    new GeoJsonLayer({ id: 'coast', data: coastline as unknown as GeoJSON.FeatureCollection, stroked: true, filled: false, getLineColor: [205, 214, 228, 120], lineWidthUnits: 'pixels', getLineWidth: 0.75 }),
    // ring-domes (flat analogue of the globe's hemisphere domes)
    new ScatterplotLayer({
      id: 'domes', data: domes, stroked: true, filled: true, radiusUnits: 'meters',
      lineWidthUnits: 'pixels', getLineWidth: 1, radiusMinPixels: 3, radiusMaxPixels: 90,
      getPosition: (d: typeof domes[number]) => [d.lon, d.lat],
      getRadius: (d: typeof domes[number]) => 40000 + Math.sqrt(hits[d.id] ?? 0) * 150000 + d.prominence * 12000,
      getFillColor: (d: typeof domes[number]) => (d.id === sel ? [255, 190, 110, 40] : [235, 110, 30, 26]),
      getLineColor: (d: typeof domes[number]) => (d.id === sel ? [255, 210, 140, 230] : [235, 120, 40, 150]),
      updateTriggers: { getRadius: [now], getFillColor: [sel], getLineColor: [sel] },
    }),
    new ScatterplotLayer({
      id: 'nodes', data: insts, pickable: true, radiusUnits: 'pixels',
      getPosition: (d: typeof insts[number]) => [d.lon, d.lat],
      getRadius: (d: typeof insts[number]) => (d.id === sel ? 4 : 1 + Math.min(3, (hits[d.id] ?? 0) * 0.15)),
      getFillColor: (d: typeof insts[number]) => (d.id === sel ? [255, 220, 150, 255] : [160, 170, 190, 150]),
      onClick: (i: PickingInfo) => { if (i.object) engine.selectInstitution((i.object as { id: string }).id); return true; },
      onHover: (i: PickingInfo) => setHover(i.object ? { x: i.x, y: i.y, text: `${(i.object as { name: string }).name}` } : null),
      updateTriggers: { getRadius: [now, sel], getFillColor: [sel] },
    }),
    new ArcLayer({
      id: 'arcs', data: active, greatCircle: true, widthUnits: 'pixels',
      getSourcePosition: (e: AttackEvent) => [e.sourceLon, e.sourceLat],
      getTargetPosition: (e: AttackEvent) => [e.targetLon, e.targetLat],
      getSourceColor: (e: AttackEvent) => { const c = VECTORS[e.vector].color; return [c[0], c[1], c[2], 18 + envelope((now - e.startedAt) / e.durationMs) * 70]; },
      getTargetColor: (e: AttackEvent) => { const c = VECTORS[e.vector].color; return [c[0], c[1], c[2], 55 + envelope((now - e.startedAt) / e.durationMs) * 180]; },
      getWidth: (e: AttackEvent) => 0.5 + e.severity * 0.4, getHeight: 0.3,
      updateTriggers: { getSourceColor: [now], getTargetColor: [now] },
    }),
    new ScatterplotLayer({
      id: 'packets', data: active.map((e) => { const p = Math.min(1, (now - e.startedAt) / e.durationMs); const [lon, lat] = slerp(e.sourceLon, e.sourceLat, e.targetLon, e.targetLat, p); return { lon, lat, e }; }),
      radiusUnits: 'pixels',
      getPosition: (p: { lon: number; lat: number }) => [p.lon, p.lat],
      getRadius: (p: { e: AttackEvent }) => 1.4 + p.e.severity * 0.6,
      getFillColor: (p: { e: AttackEvent }) => { const c = VECTORS[p.e.vector].color; return [c[0], c[1], c[2], 255]; },
      updateTriggers: { getPosition: [now], getFillColor: [now] },
    }),
    // operation origins (the Cyber Weapons Lab on the map)
    new ScatterplotLayer({
      id: 'ops', data: AGENTS.filter((a) => a.status !== 'offline'), pickable: true,
      radiusUnits: 'pixels', stroked: true, lineWidthUnits: 'pixels',
      getPosition: (a: typeof AGENTS[number]) => [a.originLon, a.originLat],
      getRadius: (a: typeof AGENTS[number]) => (snap.selectedAgent === a.id ? 6 : 3.5),
      getFillColor: (a: typeof AGENTS[number]) => [a.color[0], a.color[1], a.color[2], 235],
      getLineColor: [255, 255, 255, 130], getLineWidth: 0.6,
      onClick: (i: PickingInfo) => { if (i.object) engine.selectAgent((i.object as { id: string }).id); return true; },
      updateTriggers: { getRadius: [snap.selectedAgent] },
    }),
    new TextLayer({
      id: 'op-labels', data: AGENTS.filter((a) => a.status !== 'offline'),
      getPosition: (a: typeof AGENTS[number]) => [a.originLon, a.originLat],
      getText: (a: typeof AGENTS[number]) => a.handle,
      getSize: 9, sizeUnits: 'pixels', getColor: [235, 120, 40, 210],
      fontFamily: 'JetBrains Mono, monospace', getTextAnchor: 'start', getAlignmentBaseline: 'center',
      getPixelOffset: [7, 0], characterSet: 'auto',
    }),
  ];

  return (
    <div className="map-root">
      <DeckGL
        views={new DeckMapView({ repeat: true })}
        viewState={vs}
        onViewStateChange={(p: { viewState: unknown }) => setVs(p.viewState)}
        controller
        layers={layers}
      />
      {hover && <div className="map-tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>{hover.text}</div>}
      <div className="map-grain" />
      <div className="map-vignette" />
      <div className="map-scanlines" />
    </div>
  );
}
