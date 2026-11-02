import { useEffect, useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView as DeckMapView, FlyToInterpolator, WebMercatorViewport } from '@deck.gl/core';
import { ScatterplotLayer, ArcLayer, GeoJsonLayer, TextLayer, LineLayer, BitmapLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import type { PickingInfo } from '@deck.gl/core';


import { INSTITUTIONS } from '../data/institutions';
import { AGENTS } from '../data/agents';
import { VECTORS } from '../data/vectors';
import coastline from '../data/coastline.json';
import borders from '../data/borders.json';
import { engine } from '../sim/engine';
import { slerp } from '../sim/geo';
import { useEngine, useFrame } from '../sim/useEngine';
import { cityLayer } from './cityLayer';
import MapHud, { type Preset } from './MapHud';
import { camsInView, camStamp, type Cam } from '../sim/recon';
import { nearest } from '../sim/intel';
import { INSTITUTION_INDEX } from '../data/institutions';
import { AGENT_INDEX } from '../data/agents';
import type { AttackEvent } from '../sim/types';

// FLAT view: pure thin-line minimal map on black (no basemap tiles / fills / labels).
const transition = new FlyToInterpolator({ speed: 1.6 });

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
  // default framing (chosen by the artist, 2026-11-01): one world ≈ 64% of the screen width, centred on the
  // South Atlantic so Buenos Aires, Europe and Japan all sit in the open middle; wrapped copies show at the edges
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vs, setVs] = useState<any>(() => ({ longitude: -16, latitude: -6, zoom: Math.max(1, Math.log2((window.innerWidth * 0.64) / 512)), pitch: 0, bearing: 0 }));
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  // public traffic cameras in view (markers + feed card) — only where official catalogs exist
  const [cams, setCams] = useState<Cam[]>([]);
  const [camHover, setCamHover] = useState<{ x: number; y: number; cam: Cam } | null>(null);
  useEffect(() => {
    if (vs.zoom < 8) { setCams([]); return; }
    let alive = true;
    try {
      const vp = new WebMercatorViewport({ ...vs, width: window.innerWidth, height: window.innerHeight });
      const [w, s, e, n] = vp.getBounds();
      camsInView(s, w, n, e).then((c) => { if (alive) setCams(c); }).catch(() => {});
    } catch { /* viewport edge cases */ }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(vs.longitude * 20), Math.round(vs.latitude * 20), Math.round(vs.zoom)]);
  // god's-eye controls: REAL overhead imagery, oblique tilt, sensor visual preset
  const [sat, setSat] = useState(false);
  const [tilt, setTilt] = useState(false);
  const [preset, setPreset] = useState<Preset>('normal');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toggleTilt = () => setVs((v: any) => ({ ...v, pitch: v.pitch > 0 ? 0 : 50, transitionDuration: 400 }));
  useEffect(() => { setTilt(vs.pitch > 0); }, [vs.pitch]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (e.key === 's' || e.key === 'S') setSat((v) => !v);
      else if (e.key === 't' || e.key === 'T') toggleTilt();
      else if (e.key === 'v' || e.key === 'V') setPreset((p) => { const o: Preset[] = ['normal', 'crt', 'nvg', 'flir', 'noir']; return o[(o.indexOf(p) + 1) % o.length]; });
    };
    window.addEventListener('keydown', onKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CICFA_sat = (on?: boolean) => setSat((v) => (on === undefined ? !v : !!on));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CICFA_preset = (p: Preset) => setPreset(p);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = engine.consumeFlyTarget();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (t) setVs((v: any) => ({ ...v, longitude: t.lon, latitude: t.lat, zoom: t.zoom, transitionDuration: 'auto', transitionInterpolator: transition }));
  }, [snap.selectedInstitution, snap.version]);

  // console / exhibition hook: CICFA_view(lon, lat, zoom) moves the camera
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CICFA_view = (longitude: number, latitude: number, zoom: number) => setVs((v: any) => ({ ...v, longitude, latitude, zoom, transitionDuration: 0 }));
  }, []);

  const now = engine.clock;
  const active = engine.getActive().filter((e) => engine.passesFilter(e));
  const hits = snap.hits;
  const sel = snap.selectedInstitution;
  // memoised per data tick (~4Hz), not per animation frame — avoids re-uploading 2,700+ points every frame
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const insts = useMemo(() => INSTITUTIONS.filter((d) => snap.filters.regions.has(d.region)), [snap.version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const domes = useMemo(() => insts.filter((d) => (hits[d.id] ?? 0) > 0), [insts, hits]);
  // labels: only what is on screen. zoom ≥ 4.6 names every institution, ≥ 3.2 only those under attack.
  const zq = Math.round(vs.zoom * 4) / 4;
  const qstep = (360 / (512 * 2 ** zq)) * 40;                 // re-place labels every ~40px of panning
  const lonq = Math.round(vs.longitude / qstep) * qstep, latq = Math.round(vs.latitude / qstep) * qstep;
  const labels = useMemo(() => {
    if (zq < 3.2) return sel ? insts.filter((d) => d.id === sel).map((d) => ({ ...d, dy: 0 })) : [];
    const W = window.innerWidth, H = window.innerHeight;
    const vp = new WebMercatorViewport({ width: W, height: H, longitude: lonq, latitude: latq, zoom: zq });
    const all = zq >= 4.6;
    const prio = (d: typeof insts[number]) => (d.id === sel ? 1e9 : (hits[d.id] ?? 0) * 10 + d.prominence);
    const cand = insts.filter((d) => all || (hits[d.id] ?? 0) > 0 || d.id === sel).sort((a, b) => prio(b) - prio(a));
    // screen-space declutter: greedy placement, skip any label whose box overlaps one already placed
    // close to a city, crowded names are stacked (nudged up/down) instead of hidden
    const tries = zq >= 9 ? [0, 13, -13, 26, -26, 39, -39, 52, -52, 65, -65] : [0];
    const placed: [number, number, number, number][] = [];
    const out: (typeof insts[number] & { dy: number })[] = [];
    for (const d of cand) {
      const dl = ((d.lon - lonq + 540) % 360) - 180;          // nearest world copy
      const [x, y] = vp.project([lonq + dl, d.lat]);
      if (x < -20 || x > W + 20 || y < -10 || y > H + 10) continue;
      for (const dy of tries) {
        const box: [number, number, number, number] = [x + 3, y + dy - 7, x + 8 + d.name.length * 6.8, y + dy + 7];
        if (placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
        placed.push(box); out.push({ ...d, dy });
        break;
      }
      if (out.length >= 300) break;
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zq, lonq, latq, insts, hits, sel]);

  // link analysis for the selected target: who hit it (op origins) + its physical neighbours
  const selInst = sel ? INSTITUTION_INDEX[sel] : null;
  const neigh = useMemo(() => (selInst ? nearest(selInst, 6) : []), [selInst]);
  const aggressorLinks = useMemo(() => {
    if (!selInst) return [];
    const ids = [...new Set(engine.historyFor(selInst.id).map((e) => e.agentId))];
    return ids.map((id) => AGENT_INDEX[id]).filter(Boolean).map((a) => ({ a, from: [a.originLon, a.originLat] as [number, number], to: [selInst.lon, selInst.lat] as [number, number] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selInst, snap.version]);

  const worldFade = Math.max(0, Math.min(1, (10 - vs.zoom) / 2.5));   // crude world outlines give way to real streets
  const layers = [
    // REAL god's-eye overhead imagery (Esri World Imagery, no key) — desaturated + cool-tinted to sit under the monitor's lines
    sat ? new TileLayer({
      id: 'sat', data: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      minZoom: 0, maxZoom: 19, tileSize: 256,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderSubLayers: (props: any) => {
        const { boundingBox } = props.tile;
        return new BitmapLayer(props, {
          data: undefined, image: props.data,
          bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]],
          desaturate: 0.65, tintColor: [188, 200, 216], opacity: 0.92,
        });
      },
    }) : null,
    cityLayer(vs.zoom, sat),
    new GeoJsonLayer({ id: 'graticule', opacity: worldFade, visible: worldFade > 0, data: GRATICULE, stroked: true, filled: false, getLineColor: [120, 130, 150, 18], lineWidthUnits: 'pixels', getLineWidth: 0.5 }),
    new GeoJsonLayer({ id: 'borders', opacity: worldFade, visible: worldFade > 0, data: borders as unknown as GeoJSON.FeatureCollection, stroked: true, filled: false, getLineColor: [120, 130, 148, 60], lineWidthUnits: 'pixels', getLineWidth: 0.5 }),
    new GeoJsonLayer({ id: 'coast', opacity: worldFade, visible: worldFade > 0, data: coastline as unknown as GeoJSON.FeatureCollection, stroked: true, filled: false, getLineColor: [205, 214, 228, 120], lineWidthUnits: 'pixels', getLineWidth: 0.75 }),
    // ring-domes (flat analogue of the globe's hemisphere domes)
    // crimson strike-rings — thin fill, thicker stroke, less bulky
    new ScatterplotLayer({
      id: 'domes', data: domes, stroked: true, filled: false, radiusUnits: 'meters',
      lineWidthUnits: 'pixels', getLineWidth: 1.4, lineWidthMinPixels: 1, lineWidthMaxPixels: 2.5,
      radiusMinPixels: 2, radiusMaxPixels: 60,
      getPosition: (d: typeof domes[number]) => [d.lon, d.lat],
      getRadius: (d: typeof domes[number]) => 36000 + Math.sqrt(hits[d.id] ?? 0) * 125000 + d.prominence * 9000,
      getLineColor: (d: typeof domes[number]) => (d.id === sel ? [255, 120, 120, 240] : [230, 0, 38, 125]),
      updateTriggers: { getRadius: [snap.version], getLineColor: [sel] },
    }),
    new ScatterplotLayer({
      id: 'nodes', data: insts, pickable: true, radiusUnits: 'pixels', radiusMinPixels: 0.6, radiusScale: vs.zoom >= 9 ? 2.4 : vs.zoom >= 6 ? 1.6 : 1,
      getPosition: (d: typeof insts[number]) => [d.lon, d.lat],
      getRadius: (d: typeof insts[number]) => (d.id === sel ? 2.2 : 0.7 + Math.min(1.2, (hits[d.id] ?? 0) * 0.06)),
      getFillColor: (d: typeof insts[number]) => (d.id === sel ? [255, 220, 150, 255] : [205, 212, 228, 235]),
      onClick: (i: PickingInfo) => { if (i.object) engine.selectInstitution((i.object as { id: string }).id); return true; },
      onHover: (i: PickingInfo) => setHover(i.object ? { x: i.x, y: i.y, text: `${(i.object as { name: string }).name}` } : null),
      updateTriggers: { getRadius: [snap.version, sel], getFillColor: [sel] },
    }),
    // institution name labels — appear as you zoom in (targeted + selected only, to avoid clutter)
    new TextLayer({
      id: 'inst-labels',
      data: labels,
      getPosition: (d: typeof insts[number]) => [d.lon, d.lat],
      getText: (d: typeof insts[number]) => d.name.toUpperCase(),
      getSize: 11, sizeUnits: 'pixels',
      getColor: (d: typeof insts[number]) => (d.id === sel ? [255, 220, 150, 255] : (hits[d.id] ?? 0) > 0 ? [235, 238, 245, 225] : [160, 168, 184, 150]),
      fontFamily: 'JetBrains Mono, monospace', getTextAnchor: 'start', getAlignmentBaseline: 'center',
      getPixelOffset: (d: { dy: number }) => [6, d.dy], characterSet: 'auto',
      updateTriggers: { getColor: [sel, snap.version] },
    }),
    new LineLayer({
      id: 'sel-neighbours', data: selInst ? neigh : [],
      getSourcePosition: () => [selInst!.lon, selInst!.lat], getTargetPosition: (n: { inst: { lon: number; lat: number } }) => [n.inst.lon, n.inst.lat],
      getColor: [235, 238, 245, 110], getWidth: 0.6, widthUnits: 'pixels',
      updateTriggers: { getSourcePosition: [sel] },
    }),
    new ArcLayer({
      id: 'sel-aggressors', data: aggressorLinks, greatCircle: true, widthUnits: 'pixels',
      getSourcePosition: (d: { from: [number, number] }) => d.from, getTargetPosition: (d: { to: [number, number] }) => d.to,
      getSourceColor: (d: { a: { color: number[] } }) => [d.a.color[0], d.a.color[1], d.a.color[2], 60],
      getTargetColor: [230, 0, 38, 200], getWidth: 1.1,
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
      getSize: 11, sizeUnits: 'pixels', getColor: [230, 0, 38, 230],
      fontFamily: 'JetBrains Mono, monospace', getTextAnchor: 'start', getAlignmentBaseline: 'center',
      getPixelOffset: [7, 0], characterSet: 'auto',
    }),
    // PUBLIC traffic cameras (official catalogs) — cyan pins; hover shows the live feed
    new ScatterplotLayer({
      id: 'cams', data: cams, pickable: true, radiusUnits: 'pixels',
      stroked: true, filled: true, lineWidthUnits: 'pixels', getLineWidth: 1,
      getPosition: (c: Cam) => [c.lon, c.lat], getRadius: 3, radiusMinPixels: 2.2, radiusMaxPixels: 5,
      getFillColor: [120, 205, 225, 225], getLineColor: [10, 20, 26, 220],
      onHover: (i: PickingInfo) => setCamHover(i.object ? { x: i.x, y: i.y, cam: i.object as Cam } : null),
    }),
    new TextLayer({
      id: 'cam-glyphs', data: vs.zoom >= 11 ? cams : [],
      getPosition: (c: Cam) => [c.lon, c.lat], getText: () => '▣',
      getSize: 12, sizeUnits: 'pixels', getColor: [120, 205, 225, 180],
      fontFamily: 'JetBrains Mono, monospace', getTextAnchor: 'middle', getAlignmentBaseline: 'center', characterSet: 'auto',
    }),
  ];

  return (
    <div className={`map-root preset-${preset}`}>
      <DeckGL
        views={new DeckMapView({ repeat: true })}
        viewState={vs}
        onViewStateChange={(p: { viewState: unknown }) => setVs(p.viewState)}
        controller
        layers={layers}
      />
      <MapHud lon={vs.longitude} lat={vs.latitude} zoom={vs.zoom} preset={preset} onPreset={setPreset}
        sat={sat} onSat={() => setSat((v) => !v)} tilt={tilt} onTilt={toggleTilt} />
      {hover && <div className="map-tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>{hover.text}</div>}
      {camHover && (
        <div className="cam-card" style={{ left: Math.min(camHover.x + 14, window.innerWidth - 260), top: Math.min(camHover.y + 14, window.innerHeight - 190) }}>
          <img src={`${camHover.cam.url}?t=${camStamp()}`} alt="" draggable={false} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="cam-card-cap"><span className="cc-name">{camHover.cam.name}</span><span className="cc-src">● LIVE · {camHover.cam.source}</span></div>
        </div>
      )}
      <div className="map-shade" />
      <div className="map-grain" />
      <div className="map-vignette" />
      <div className="map-scanlines" />
    </div>
  );
}
