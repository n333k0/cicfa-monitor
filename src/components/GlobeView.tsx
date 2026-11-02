import { useEffect, useMemo, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { _GlobeView as GlobeView, COORDINATE_SYSTEM, LinearInterpolator } from '@deck.gl/core';
import { ScatterplotLayer, GeoJsonLayer, SolidPolygonLayer, PathLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { SphereGeometry } from '@luma.gl/engine';
import type { PickingInfo } from '@deck.gl/core';

import { INSTITUTIONS } from '../data/institutions';
import { VECTORS } from '../data/vectors';
import coastline from '../data/coastline.json';
import borders from '../data/borders.json';
import landcells from '../data/landcells.json';
import countryLabels from '../data/countrylabels.json';
import { engine } from '../sim/engine';
import { slerp } from '../sim/geo';
import { useEngine, useFrame } from '../sim/useEngine';
import type { AttackEvent } from '../sim/types';
import { V2, INK } from '../theme';
import { PICK_RADIUS } from '../sim/touch';

// GLOBE — the piece's red planet (redone 2026-11-02 after the artist's notes): dark oxblood
// ocean, crimson land with bright coasts, an atmosphere rim, readable white labels
// (countries + the cities where institutions cluster), zoomed out over the Atlantic.
// Land comes pre-cut into 8° cells (scripts/build-globe-data.mjs) so filled polygons follow
// the curve instead of slicing through the sphere.

const EARTH_R = 6.3e6;                              // ocean sphere sits just under deck's 6.371e6 surface
const transition = new LinearInterpolator(['longitude', 'latitude', 'zoom']);
const VIEW = new GlobeView({ resolution: 10 });
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
const R = Math.PI / 180;

function graticule() {
  const feats: GeoJSON.Feature[] = [];
  for (let lon = -180; lon < 180; lon += 20) {
    const c: [number, number][] = [];
    for (let lat = -80; lat <= 80; lat += 4) c.push([lon, lat]);
    feats.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: c } });
  }
  for (let lat = -60; lat <= 60; lat += 20) {
    const c: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 4) c.push([lon, lat]);
    feats.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: c } });
  }
  return { type: 'FeatureCollection', features: feats } as GeoJSON.FeatureCollection;
}
const GRATICULE = graticule();
const LAND = landcells as unknown as [number, number][][];
const sphereMesh = new SphereGeometry({ radius: EARTH_R, nlat: 48, nlong: 96 });
const domeMesh = new SphereGeometry({ radius: 1, nlat: 10, nlong: 18 });

// cities where the institutions cluster (1.5° cells), named after their most common city
const ALIAS: Record<string, string> = {
  'MANHATTAN': 'NEW YORK', 'NEW YORK CITY': 'NEW YORK', 'BROOKLYN': 'NEW YORK', 'CITY OF WESTMINSTER': 'LONDON',
  'LONDON BOROUGH OF SOUTHWARK': 'LONDON', 'LONDON BOROUGH OF CAMDEN': 'LONDON', 'BEZIRK MITTE': 'BERLIN', 'MITTE': 'BERLIN',
  'INNERE STADT': 'VIENNA', 'ALTSTADT-NORD': 'COLOGNE', 'ALTSTADT-SÜD': 'COLOGNE', 'LUDWIGSVORSTADT-ISARVORSTADT': 'MUNICH', 'ALTSTADT': 'MUNICH', 'CITY OF EDINBURGH': 'EDINBURGH', 'GLASGOW CITY': 'GLASGOW', 'CIUDAD AUTÓNOMA DE BUENOS AIRES': 'BUENOS AIRES',
};
type CityLabel = { name: string; lon: number; lat: number; n: number };
const CITIES: CityLabel[] = (() => {
  const cells = new Map<string, { lon: number; lat: number; n: number; names: Map<string, number> }>();
  for (const d of INSTITUTIONS) {
    const k = `${Math.round(d.lon / 1.5)}:${Math.round(d.lat / 1.5)}`;
    const c = cells.get(k) ?? { lon: 0, lat: 0, n: 0, names: new Map() };
    c.lon += d.lon; c.lat += d.lat; c.n++;
    const nm = d.city.toUpperCase(); const a = ALIAS[nm] ?? nm;
    if (!/^(TEXAS|CALIFORNIA|NEW YORK STATE|WASHINGTON|MASSACHUSETTS)$/.test(a)) c.names.set(a, (c.names.get(a) ?? 0) + 1);
    cells.set(k, c);
  }
  return [...cells.values()].filter((c) => c.n >= 4 && c.names.size)
    .map((c) => ({ name: [...c.names].sort((a, b) => b[1] - a[1])[0][0], lon: c.lon / c.n, lat: c.lat / c.n, n: c.n }))
    .sort((a, b) => b.n - a.n).slice(0, 60);
})();
const COUNTRIES = (countryLabels as { n: string; x: number; y: number; r: number }[]).filter((c) => c.r <= 4);

/** 0..1 visibility of a point on the near face of the globe (fades out toward the horizon). */
function facing(lon: number, lat: number, cLon: number, cLat: number) {
  const cos = Math.sin(lat * R) * Math.sin(cLat * R) + Math.cos(lat * R) * Math.cos(cLat * R) * Math.cos((lon - cLon) * R);
  const ang = Math.acos(Math.max(-1, Math.min(1, cos))) / R;
  return Math.max(0, Math.min(1, (78 - ang) / 16));
}
// great-circle path for an attack, lifted into an arc (cached per event)
const arcCache = new Map<string, [number, number, number][]>();
function arcPath(e: AttackEvent) {
  let p = arcCache.get(e.id);
  if (p) return p;
  const d = Math.acos(Math.max(-1, Math.min(1, Math.sin(e.sourceLat * R) * Math.sin(e.targetLat * R) + Math.cos(e.sourceLat * R) * Math.cos(e.targetLat * R) * Math.cos((e.targetLon - e.sourceLon) * R))));
  const h = Math.min(1.1e6, 0.14 * d * 6.371e6);
  p = [];
  for (let i = 0; i <= 32; i++) { const t = i / 32; const [lon, lat] = slerp(e.sourceLon, e.sourceLat, e.targetLon, e.targetLat, t); p.push([lon, lat, Math.sin(Math.PI * t) * h]); }
  if (arcCache.size > 400) arcCache.clear();
  arcCache.set(e.id, p);
  return p;
}
function envelope(p: number) { if (p < 0.08) return p / 0.08; if (p <= 1) return 1; return Math.max(0, 1 - (p - 1) / 0.25); }

export default function Globe() {
  const snap = useEngine();
  useFrame();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vs, setVs] = useState<any>({ longitude: -32, latitude: 12, zoom: window.innerWidth <= 900 ? 1.0 : 1.7, pitch: 0, bearing: 0, minZoom: 0.6, maxZoom: 5 });
  const [hover, setHover] = useState<{ x: number; y: number; text: string; hint: string } | null>(null);
  const interacting = useRef(false);
  const pauseUntil = useRef(0);

  // fly to selection (closer, but still a globe)
  useEffect(() => {
    const t = engine.consumeFlyTarget();
    if (t) {
      pauseUntil.current = performance.now() + 6000;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setVs((v: any) => ({ ...v, longitude: t.lon, latitude: t.lat, zoom: 2.5, transitionDuration: 1400, transitionInterpolator: transition }));
    }
  }, [snap.selectedInstitution, snap.version]);

  // slow drift west→east when idle
  useEffect(() => {
    const id = window.setInterval(() => {
      if (interacting.current || performance.now() < pauseUntil.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setVs((v: any) => {
        const rest = { ...v }; delete rest.transitionDuration; delete rest.transitionInterpolator;
        let lon = (rest.longitude ?? 0) + 0.05; if (lon > 180) lon -= 360;
        return { ...rest, longitude: lon };
      });
    }, 50);
    return () => clearInterval(id);
  }, []);

  const now = engine.clock;
  const active = engine.getActive().filter((e) => engine.passesFilter(e));
  const hits = snap.hits;
  const sel = snap.selectedInstitution;
  const regionKey = [...snap.filters.regions].sort().join();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const insts = useMemo(() => INSTITUTIONS.filter((d) => snap.filters.regions.has(d.region)), [regionKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const domes = useMemo(() => insts.filter((d) => (hits[d.id] ?? 0) > 0), [insts, snap.version]);
  const zq = Math.round(vs.zoom * 4) / 4;
  const selInst = sel ? insts.find((d) => d.id === sel) : undefined;

  // static base: ocean, land, graticule, coast, borders (built once)
  const base = useMemo(() => [
    new SimpleMeshLayer({
      id: 'ocean', data: [0], mesh: sphereMesh, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      getPosition: [0, 0, 0], getColor: [44, 8, 18], getOrientation: [0, 0, 0],
      material: { ambient: 0.55, diffuse: 0.6, shininess: 24, specularColor: [90, 30, 40] },
    }),
    new SolidPolygonLayer({
      id: 'land', data: LAND, getPolygon: (d: [number, number][]) => d,
      getFillColor: [128, 16, 36, 255], extruded: false,
      // paint land without writing depth, so dots / labels / arcs at ground level aren't hidden under it
      parameters: { depthWriteEnabled: false },
    }),
    new GeoJsonLayer({ id: 'graticule', data: GRATICULE, stroked: true, filled: false, getLineColor: [255, 90, 110, 34], lineWidthUnits: 'pixels', getLineWidth: 0.5 }),
    new GeoJsonLayer({ id: 'borders', data: borders as unknown as GeoJSON.FeatureCollection, stroked: true, filled: false, getLineColor: [255, 150, 160, 70], lineWidthUnits: 'pixels', getLineWidth: 0.5 }),
    new GeoJsonLayer({ id: 'coast', data: coastline as unknown as GeoJSON.FeatureCollection, stroked: true, filled: false, getLineColor: [255, 60, 84, 230], lineWidthUnits: 'pixels', getLineWidth: 0.9 }),
  ], []);

  // labels are DOM text (crisp, same type as the HUD), projected onto the globe and faded toward the horizon.
  // (deck.gl's TextLayer doesn't draw in GlobeView here, so the screen position comes from the view's viewport.)
  const W = window.innerWidth, H = window.innerHeight;
  const vp = VIEW.makeViewport({ width: W, height: H, viewState: vs });
  const nCities = zq >= 2.4 ? 60 : zq >= 1.9 ? 34 : 22, maxRank = zq >= 2.4 ? 4 : zq >= 1.9 ? 3 : 2;
  const place = (lon: number, lat: number) => {
    const f = facing(lon, lat, vs.longitude, vs.latitude);
    if (f <= 0 || !vp) return null;
    const [x, y] = vp.project([lon, lat, 0]);
    return x < -80 || x > W + 80 || y < -20 || y > H + 20 ? null : { x, y, f };
  };
  // greedy screen-space declutter: selection > biggest clusters > countries; skip anything overlapping
  type Lbl = { key: string; kind: 'sel' | 'city' | 'country'; text: string; n?: number; x: number; y: number; f: number };
  const placed: [number, number, number, number][] = [];
  const shown: Lbl[] = [];
  const tryPlace = (l: Lbl, w: number, box: [number, number, number, number]) => {
    if (placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) return;
    placed.push(box); shown.push(l); void w;
  };
  if (selInst) { const q = place(selInst.lon, selInst.lat); if (q) { const w = selInst.name.length * 7.6 + 16; tryPlace({ key: 'sel', kind: 'sel', text: selInst.name, ...q }, w, [q.x + 6, q.y - 30, q.x + 10 + w, q.y - 12]); } }
  for (const c of CITIES.slice(0, nCities)) {
    const q = place(c.lon, c.lat); if (!q) continue;
    const text = c.name, w = (text.length + String(c.n).length + 1) * 7.4 + 10;
    tryPlace({ key: 'k' + c.name + c.lon, kind: 'city', text, n: c.n, ...q }, w, [q.x - 5, q.y - 8, q.x + w, q.y + 8]);
  }
  for (const c of COUNTRIES) {
    if (c.r > maxRank) continue;
    const q = place(c.x, c.y); if (!q) continue;
    const w = c.n.length * 7.6;
    tryPlace({ key: 'c' + c.n, kind: 'country', text: c.n, ...q }, w, [q.x - w / 2, q.y - 6, q.x + w / 2, q.y + 6]);
  }
  // only draw the part of each arc on the visible face (otherwise back-side arcs ring the globe)
  // (screen test against the globe's rim, because the visible horizon shrinks as the camera comes closer)
  const rim = (512 * 2 ** vs.zoom) / (2 * Math.PI), cx = W / 2, cy = H / 2;
  const onFace = (pt: [number, number, number]) => {
    if (facing(pt[0], pt[1], vs.longitude, vs.latitude) <= 0.25 || !vp) return false;
    const [x, y] = vp.project(pt);
    return Math.hypot(x - cx, y - cy) <= rim * 1.04;
  };
  const arcs: { e: AttackEvent; path: [number, number, number][] }[] = [];
  for (const e of active) {
    let seg: [number, number, number][] = [];
    for (const pt of arcPath(e)) {
      if (onFace(pt)) seg.push(pt);
      else { if (seg.length > 1) arcs.push({ e, path: seg }); seg = []; }
    }
    if (seg.length > 1) arcs.push({ e, path: seg });
  }
  // packets: pixel head + 2-pixel fading trail along the lifted arc, with the event-type glyph (DOM, like the labels)
  const pkts: { key: string; e: AttackEvent; x: number; y: number; s: number; a: number; head: boolean; color: string }[] = [];
  for (const e of active) {
    const p = Math.min(1, (now - e.startedAt) / e.durationMs), path = arcPath(e), i = Math.round(p * (path.length - 1));
    const c = V2 ? INK : VECTORS[e.vector].color, color = `rgb(${c[0]},${c[1]},${c[2]})`;
    [[0, 6, 1], [1, 4, 0.6], [2, 3, 0.28]].forEach(([lag, sz, a]) => {
      const pt = path[i - lag]; if (!pt || !onFace(pt) || !vp) return;
      const [x, y] = vp.project(pt);
      pkts.push({ key: `${e.id}-${lag}`, e, x, y, s: Math.round(sz + e.severity * 0.4), a, head: lag === 0, color });
    });
  }
  const layers = [
    ...base,
    new SimpleMeshLayer({
      id: 'domes', data: domes, mesh: domeMesh, wireframe: true,
      getPosition: (d: typeof domes[number]) => [d.lon, d.lat, 0],
      getScale: (d: typeof domes[number]) => { const r = Math.min(420000, 70000 + Math.sqrt(hits[d.id] ?? 0) * 140000 + d.prominence * 12000); return [r, r, r]; },
      getColor: (d: typeof domes[number]) => (d.id === sel ? [255, 220, 150, 200] : [255, 236, 238, 46]),
      updateTriggers: { getScale: [snap.version], getColor: [sel] },
    }),
    new ScatterplotLayer({
      id: 'nodes', data: insts, pickable: true, radiusUnits: 'pixels', radiusMinPixels: 0.7,
      getPosition: (d: typeof insts[number]) => [d.lon, d.lat],
      getRadius: (d: typeof insts[number]) => (d.id === sel ? 3 : 0.9 + Math.min(1.4, (hits[d.id] ?? 0) * 0.07)),
      getFillColor: (d: typeof insts[number]) => (d.id === sel ? [255, 220, 150, 255] : [255, 240, 242, 235]),
      onClick: (i: PickingInfo) => { if (i.object) engine.selectInstitution((i.object as { id: string }).id); return true; },
      onHover: (i: PickingInfo) => setHover(i.object ? { x: i.x, y: i.y, text: `▸ ${(i.object as { name: string }).name}`, hint: 'CLICK · OPEN TARGET PROFILE' } : null),
      updateTriggers: { getRadius: [snap.version, sel], getFillColor: [sel] },
    }),
    // attack arcs: great-circle paths lifted off the surface (ArcLayer doesn't draw in GlobeView here)
    new PathLayer({
      id: 'arcs', data: arcs, widthUnits: 'pixels', capRounded: true, jointRounded: true,
      getPath: (a: { path: [number, number, number][] }) => a.path,
      getColor: ({ e }: { e: AttackEvent }) => { const c = V2 ? INK.map((x) => x - 60) : VECTORS[e.vector].color; return [Math.min(255, c[0] + 60), Math.min(255, c[1] + 60), Math.min(255, c[2] + 60), 70 + envelope((now - e.startedAt) / e.durationMs) * 170]; },
      getWidth: ({ e }: { e: AttackEvent }) => 0.8 + e.severity * 0.4,
      updateTriggers: { getColor: [now] },
    }),
  ];

  // atmosphere rim: a CSS glow sized to the globe's on-screen radius (deck: 512·2^z / 2π px)
  const rimPx = rim;

  return (
    <div className="map-root globe-root">
      <div className="globe-atmo" style={{ width: rimPx * 2, height: rimPx * 2 }} />
      <DeckGL
        views={VIEW}
        pickingRadius={PICK_RADIUS}
        viewState={vs}
        useDevicePixels={DPR}
        onViewStateChange={(p: { viewState: unknown }) => setVs(p.viewState)}
        onInteractionStateChange={(s: { isDragging?: boolean; isPanning?: boolean; isZooming?: boolean; isRotating?: boolean }) => {
          interacting.current = !!(s.isDragging || s.isPanning || s.isZooming || s.isRotating);
          if (interacting.current) pauseUntil.current = performance.now() + 4000;
        }}
        controller={{ dragRotate: true, inertia: true }}
        getCursor={({ isDragging, isHovering }: { isDragging: boolean; isHovering: boolean }) => (isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab')}
        layers={layers}
        onError={(e: Error, layer?: unknown) => console.error('deck', (layer as { id?: string })?.id, e?.message)}
      />
      <div className="globe-labels">
        {pkts.map((k) => (
          <span key={k.key} className={`gl-pkt ${k.head ? 'head' : ''}`} style={{ transform: `translate(${k.x}px, ${k.y}px)`, color: k.color, opacity: k.a }}>
            <i style={{ width: k.s, height: k.s }} />{k.head && <b>{VECTORS[k.e.vector].glyph}</b>}
          </span>
        ))}
        {shown.map((l) => l.kind === 'country'
          ? <span key={l.key} className="gl-country" style={{ transform: `translate(${l.x}px, ${l.y}px) translate(-50%, -50%)`, opacity: l.f * 0.85 }}>{l.text}</span>
          : l.kind === 'city'
            ? <span key={l.key} className="gl-city" style={{ transform: `translate(${l.x}px, ${l.y}px)`, opacity: l.f }}><i />{l.text} <b>{l.n}</b></span>
            : <span key={l.key} className="gl-sel" style={{ transform: `translate(${l.x}px, ${l.y}px)` }}>▸ {l.text}</span>)}
      </div>
      {hover && <div className="map-tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>{hover.text}<span className="tt-hint">{hover.hint}</span></div>}
      <div className="map-vignette" />
      <div className="map-scanlines" />
    </div>
  );
}
