import { useEffect, useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView as DeckMapView, FlyToInterpolator, WebMercatorViewport } from '@deck.gl/core';
import { ScatterplotLayer, ArcLayer, GeoJsonLayer, TextLayer, LineLayer, BitmapLayer, IconLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import type { PickingInfo } from '@deck.gl/core';


import { INSTITUTIONS } from '../data/institutions';
import { AGENTS } from '../data/agents';
import { VECTORS, VECTOR_LIST } from '../data/vectors';
const GLYPHS = VECTOR_LIST.map((v) => v.glyph).join('');
import coastline from '../data/coastline.json';
import borders from '../data/borders.json';
import { V2, MAP_FONT, INK } from '../theme';
import { PICK_RADIUS, IS_PHONE } from '../sim/touch';
import { engine } from '../sim/engine';
import { slerp } from '../sim/geo';
import { useEngine, useFrame } from '../sim/useEngine';
import { cityLayer, type CityLabel } from './cityLayer';
import MapHud from './MapHud';
import { camsInView, camStamp, type Cam } from '../sim/recon';
import { nearest } from '../sim/intel';
import { INSTITUTION_INDEX } from '../data/institutions';
import { AGENT_INDEX } from '../data/agents';
import type { AttackEvent } from '../sim/types';

// FLAT view: pure thin-line minimal map on black (no basemap tiles / fills / labels).
const transition = new FlyToInterpolator({ speed: 1.6 });
const VIEWS = new DeckMapView({ repeat: true });
// packets are hard-edged pixels: one 8×8 white square, tinted per event, sampled nearest (no smoothing)
const SQ_ATLAS = (() => { const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, 8, 8); return c.toDataURL(); })();
const SQ_MAP = { sq: { x: 0, y: 0, width: 8, height: 8, mask: true } };
const TRAIL: [number, number, number][] = [[0, 7, 255], [0.022, 5, 150], [0.044, 3, 70]];   // [lag, px, alpha]
type Pkt = { lon: number; lat: number; e: AttackEvent; s: number; a: number };
// cap the drawing buffer at 1.5× on retina screens (2× = 4× the pixels for thin lines that barely change)
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
const getCursor = ({ isDragging, isHovering }: { isDragging: boolean; isHovering: boolean }) => (isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab');

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
  const [vs, setVs] = useState<any>(() => (window.innerWidth <= 900
    // phones: the whole world across the screen, the Americas + Atlantic in view
    ? { longitude: -42, latitude: -12, zoom: Math.max(0, Math.log2((window.innerWidth * 1.15) / 512)), pitch: 0, bearing: 0 }
    : { longitude: -16, latitude: -6, zoom: Math.max(1, Math.log2((window.innerWidth * 0.64) / 512)), pitch: 0, bearing: 0 }));
  const [hover, setHover] = useState<{ x: number; y: number; text: string; hint: string } | null>(null);
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
  // god's-eye controls: REAL overhead imagery + oblique tilt (always OPTICAL)
  const [sat, setSat] = useState(false);
  const [tilt, setTilt] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toggleTilt = () => setVs((v: any) => ({ ...v, pitch: v.pitch > 0 ? 0 : 50, transitionDuration: 400 }));
  useEffect(() => { setTilt(vs.pitch > 0); }, [vs.pitch]);
  // let the v2 icon rail mirror / drive SAT + TILT
  useEffect(() => { window.dispatchEvent(new CustomEvent('cicfa:mapstate', { detail: { sat, tilt } })); }, [sat, tilt]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (e.key === 's' || e.key === 'S') setSat((v) => !v);
      else if (e.key === 't' || e.key === 'T') toggleTilt();
    };
    window.addEventListener('keydown', onKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CICFA_sat = (on?: boolean) => setSat((v) => (on === undefined ? !v : !!on));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CICFA_tilt = () => toggleTilt();
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = engine.consumeFlyTarget();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (t) setVs((v: any) => {
      let { lon, lat } = t;
      if (IS_PHONE) {
        // shift the camera so the target sits ~22% of the screen above centre, clear of the bottom sheet
        const W = window.innerWidth, H = window.innerHeight;
        const vp = new WebMercatorViewport({ width: W, height: H, longitude: lon, latitude: lat, zoom: t.zoom });
        [lon, lat] = vp.unproject([W / 2, H / 2 + H * 0.22]);
      }
      return { ...v, longitude: lon, latitude: lat, zoom: t.zoom, transitionDuration: 'auto', transitionInterpolator: transition };
    });
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
  // the 2,700 institution points only change when the region filter changes (not on every data tick)
  const regionKey = [...snap.filters.regions].sort().join();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const insts = useMemo(() => INSTITUTIONS.filter((d) => snap.filters.regions.has(d.region)), [regionKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const domes = useMemo(() => insts.filter((d) => (hits[d.id] ?? 0) > 0), [insts, snap.version]);
  // label declutter is the costliest step: refresh it ~1×/s for new hits, immediately on camera/selection change
  const labelEpoch = Math.floor(snap.version / 6);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ops = useMemo(() => AGENTS.filter((a) => a.status !== 'offline'), [snap.version]);
  // labels: only what is on screen. zoom ≥ 4.6 names every institution, ≥ 3.2 only those under attack.
  const zq = Math.round(vs.zoom * 4) / 4;
  const qstep = (360 / (512 * 2 ** zq)) * 40;                 // re-place labels every ~40px of panning
  const lonq = Math.round(vs.longitude / qstep) * qstep, latq = Math.round(vs.latitude / qstep) * qstep;
  const labels = useMemo(() => {
    if (zq < 3.2) return sel ? insts.filter((d) => d.id === sel).map((d) => ({ ...d, dy: 0, flip: false })) : [];
    const W = window.innerWidth, H = window.innerHeight;
    const vp = new WebMercatorViewport({ width: W, height: H, longitude: lonq, latitude: latq, zoom: zq });
    const all = zq >= 4.6;
    const prio = (d: typeof insts[number]) => (d.id === sel ? 1e9 : (hits[d.id] ?? 0) * 10 + d.prominence);
    const cand = insts.filter((d) => all || (hits[d.id] ?? 0) > 0 || d.id === sel).sort((a, b) => prio(b) - prio(a));
    // screen-space declutter: greedy placement, skip any label whose box overlaps one already placed
    // close to a city, crowded names are stacked (nudged up/down) instead of hidden
    const tries = zq >= 9 ? [0, 13, -13, 26, -26, 39, -39, 52, -52, 65, -65] : [0];
    const placed: [number, number, number, number][] = [];
    const out: (typeof insts[number] & { dy: number; flip: boolean })[] = [];
    // names that would run off the right edge (or under the right column) are written to the LEFT of the dot
    const rightLimit = W > 900 ? W - 400 : W - 8;
    for (const d of cand) {
      const dl = ((d.lon - lonq + 540) % 360) - 180;          // nearest world copy
      const [x, y] = vp.project([lonq + dl, d.lat]);
      if (x < -20 || x > W + 20 || y < -10 || y > H + 10) continue;
      const w = d.name.length * 6.8;
      const flip = x + 8 + w > rightLimit && x - 8 - w > 0;
      for (const dy of tries) {
        const box: [number, number, number, number] = flip ? [x - 8 - w, y + dy - 7, x - 3, y + dy + 7] : [x + 3, y + dy - 7, x + 8 + w, y + dy + 7];
        if (placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
        placed.push(box); out.push({ ...d, dy, flip });
        break;
      }
      if (out.length >= 300) break;
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zq, lonq, latq, insts, labelEpoch, sel]);

  // link analysis for the selected target: who hit it (op origins) + its physical neighbours
  const selInst = sel ? INSTITUTION_INDEX[sel] : null;
  const neigh = useMemo(() => (selInst ? nearest(selInst, 6) : []), [selInst]);
  const aggressorLinks = useMemo(() => {
    if (!selInst) return [];
    const ids = [...new Set(engine.historyFor(selInst.id).map((e) => e.agentId))];
    return ids.map((id) => AGENT_INDEX[id]).filter(Boolean).map((a) => ({ a, from: [a.originLon, a.originLat] as [number, number], to: [selInst.lon, selInst.lat] as [number, number] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selInst, snap.version]);

  const packets: Pkt[] = [];
  for (const e of active) {
    const p = Math.min(1, (now - e.startedAt) / e.durationMs);
    for (const [lag, sz, a] of TRAIL) {
      if (p - lag < 0) continue;
      const [lon, lat] = slerp(e.sourceLon, e.sourceLat, e.targetLon, e.targetLat, p - lag);
      packets.push({ lon, lat, e, s: sz + e.severity * 0.4, a });
    }
  }
  const worldFade = Math.max(0, Math.min(1, (10 - vs.zoom) / 2.5));   // crude world outlines give way to real streets
  // city tiles: rebuild the layer only when its zoom bucket / opacity step / satellite flag changes
  const cityZ = Math.round(vs.zoom * 8) / 8;
  const [cityLabels, setCityLabels] = useState<CityLabel[]>([]);
  const city = useMemo(() => cityLayer(cityZ, sat, setCityLabels), [cityZ, sat]);
  const cityOpacity = Math.min(1, Math.max(0, (vs.zoom - 4) / 1.5));
  const zb = Math.floor(vs.zoom * 2) / 2;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shownCity = useMemo(() => (vs.zoom < 4 ? [] : cityLabels.filter((l) => zb >= l.minZoom)), [cityLabels, zb]);
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
    city,
    new TextLayer({
      id: 'city-places', data: shownCity.filter((l) => l.kind === 'place'), opacity: cityOpacity,
      getPosition: (l: CityLabel) => l.pos, getText: (l: CityLabel) => l.text,
      getSize: (l: CityLabel) => (l.cls === 'city' ? 11 : 10), sizeUnits: 'pixels',
      getColor: (l: CityLabel) => (l.cls === 'city' || l.cls === 'town' ? [235, 238, 245, 210] : [170, 178, 196, 160]),
      fontFamily: MAP_FONT, characterSet: 'auto', getTextAnchor: 'middle', getAlignmentBaseline: 'center',
    }),
    new TextLayer({
      id: 'city-streets', data: shownCity.filter((l) => l.kind === 'street'), opacity: cityOpacity,
      getPosition: (l: CityLabel) => l.pos, getText: (l: CityLabel) => l.text, getAngle: (l: CityLabel) => l.angle,
      getSize: 9, sizeUnits: 'pixels', getColor: [150, 158, 178, 150],
      fontFamily: MAP_FONT, characterSet: 'auto', getTextAnchor: 'middle', getAlignmentBaseline: 'center',
    }),
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
      onHover: (i: PickingInfo) => setHover(i.object ? { x: i.x, y: i.y, text: `▸ ${(i.object as { name: string }).name}`, hint: 'CLICK · OPEN TARGET PROFILE' } : null),
      updateTriggers: { getRadius: [snap.version, sel], getFillColor: [sel] },
    }),
    // institution name labels — appear as you zoom in (targeted + selected only, to avoid clutter)
    new TextLayer({
      id: 'inst-labels',
      data: labels, pickable: true,
      onClick: (i: PickingInfo) => { if (i.object) engine.selectInstitution((i.object as { id: string }).id); return true; },
      onHover: (i: PickingInfo) => setHover(i.object ? { x: i.x, y: i.y, text: `▸ ${(i.object as { name: string }).name}`, hint: 'CLICK · OPEN TARGET PROFILE' } : null),
      getPosition: (d: typeof insts[number]) => [d.lon, d.lat],
      getText: (d: typeof insts[number]) => d.name.toUpperCase(),
      getSize: 11, sizeUnits: 'pixels',
      getColor: (d: typeof insts[number]) => (d.id === sel ? [255, 220, 150, 255] : (hits[d.id] ?? 0) > 0 ? [235, 238, 245, 225] : [160, 168, 184, 150]),
      fontFamily: MAP_FONT, getTextAnchor: (d: { flip: boolean }) => (d.flip ? 'end' : 'start'), getAlignmentBaseline: 'center',
      getPixelOffset: (d: { dy: number; flip: boolean }) => [d.flip ? -6 : 6, d.dy], characterSet: 'auto',
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
      getSourceColor: (d: { a: { color: number[] } }) => (V2 ? [...INK, 60] as [number, number, number, number] : [d.a.color[0], d.a.color[1], d.a.color[2], 60]),
      getTargetColor: [230, 0, 38, 200], getWidth: 1.1,
    }),
    new ArcLayer({
      id: 'arcs', data: active, greatCircle: true, widthUnits: 'pixels',
      getSourcePosition: (e: AttackEvent) => [e.sourceLon, e.sourceLat],
      getTargetPosition: (e: AttackEvent) => [e.targetLon, e.targetLat],
      getSourceColor: (e: AttackEvent) => { const c = V2 ? INK : VECTORS[e.vector].color; return [c[0], c[1], c[2], (V2 ? 0.45 : 1) * (18 + envelope((now - e.startedAt) / e.durationMs) * 70)]; },
      getTargetColor: (e: AttackEvent) => { const c = V2 ? INK : VECTORS[e.vector].color; return [c[0], c[1], c[2], (V2 ? 0.5 : 1) * (55 + envelope((now - e.startedAt) / e.durationMs) * 180)]; },
      getWidth: (e: AttackEvent) => (V2 ? 0.4 + e.severity * 0.25 : 0.5 + e.severity * 0.4), getHeight: 0.3,
      updateTriggers: { getSourceColor: [now], getTargetColor: [now] },
    }),
    // packets: a pixel head + 2-pixel fading trail, with the event-type glyph riding beside the head
    new IconLayer({
      id: 'packets', data: packets, iconAtlas: SQ_ATLAS, iconMapping: SQ_MAP, getIcon: () => 'sq',
      sizeUnits: 'pixels', getSize: (d: Pkt) => d.s, billboard: true,
      textureParameters: { minFilter: 'nearest', magFilter: 'nearest' },
      getPosition: (d: Pkt) => [d.lon, d.lat],
      getColor: (d: Pkt) => { const c = V2 ? INK : VECTORS[d.e.vector].color; return [c[0], c[1], c[2], d.a]; },
      updateTriggers: { getPosition: [now], getColor: [now], getSize: [now] },
    }),
    new TextLayer({
      id: 'packet-glyphs', data: packets.filter((d) => d.a === 255),
      getPosition: (d: Pkt) => [d.lon, d.lat], getText: (d: Pkt) => VECTORS[d.e.vector].glyph,
      getSize: 13, sizeUnits: 'pixels', getPixelOffset: [10, -1],
      // glyph lifted toward white so it survives the map's grey grade and reads at a glance
      getColor: (d: Pkt) => { const c = V2 ? INK : VECTORS[d.e.vector].color; return [(c[0] + 510) / 3, (c[1] + 510) / 3, (c[2] + 510) / 3, 255]; },
      fontFamily: MAP_FONT, characterSet: GLYPHS, getTextAnchor: 'start', getAlignmentBaseline: 'center',
      updateTriggers: { getPosition: [now] },
    }),
    // operation origins (the Cyber Weapons Lab on the map)
    new ScatterplotLayer({
      id: 'ops', data: ops, pickable: true,
      radiusUnits: 'pixels', stroked: true, lineWidthUnits: 'pixels',
      getPosition: (a: typeof AGENTS[number]) => [a.originLon, a.originLat],
      getRadius: (a: typeof AGENTS[number]) => (snap.selectedAgent === a.id ? 6 : 3.5),
      getFillColor: (a: typeof AGENTS[number]) => (V2 ? [...INK, 235] as [number, number, number, number] : [a.color[0], a.color[1], a.color[2], 235]),
      getLineColor: [255, 255, 255, 130], getLineWidth: 0.6,
      onClick: (i: PickingInfo) => { if (i.object) engine.selectAgent((i.object as { id: string }).id); return true; },
      onHover: (i: PickingInfo) => setHover(i.object ? { x: i.x, y: i.y, text: `▸ ${(i.object as { handle: string }).handle}`, hint: 'CLICK · SELECT OPERATION' } : null),
      updateTriggers: { getRadius: [snap.selectedAgent] },
    }),
    new TextLayer({
      id: 'op-labels', data: ops,
      getPosition: (a: typeof AGENTS[number]) => [a.originLon, a.originLat],
      getText: (a: typeof AGENTS[number]) => a.handle,
      getSize: 11, sizeUnits: 'pixels', getColor: V2 ? [...INK, 230] as [number, number, number, number] : [230, 0, 38, 230],
      fontFamily: MAP_FONT, getTextAnchor: 'start', getAlignmentBaseline: 'center',
      getPixelOffset: [7, 0], characterSet: 'auto',
    }),
    // PUBLIC traffic cameras (official catalogs) — cyan pins; hover shows the live feed
    new ScatterplotLayer({
      id: 'cams', data: cams, pickable: true, radiusUnits: 'pixels',
      stroked: true, filled: true, lineWidthUnits: 'pixels', getLineWidth: 1,
      getPosition: (c: Cam) => [c.lon, c.lat], getRadius: 3, radiusMinPixels: 2.2, radiusMaxPixels: 5,
      getFillColor: [120, 205, 225, 225], getLineColor: [10, 20, 26, 220],
      onHover: (i: PickingInfo) => setCamHover(i.object ? { x: i.x, y: i.y, cam: i.object as Cam } : null),
      onClick: (i: PickingInfo) => { if (i.object) setCamHover((h) => (h?.cam.id === (i.object as Cam).id ? null : { x: i.x, y: i.y, cam: i.object as Cam })); return true; },
    }),
    new TextLayer({
      id: 'cam-glyphs', data: vs.zoom >= 11 ? cams : [],
      getPosition: (c: Cam) => [c.lon, c.lat], getText: () => '▣',
      getSize: 12, sizeUnits: 'pixels', getColor: [120, 205, 225, 180],
      fontFamily: MAP_FONT, getTextAnchor: 'middle', getAlignmentBaseline: 'center', characterSet: 'auto',
    }),
  ];

  return (
    <div className="map-root">
      <DeckGL
        views={VIEWS}
        useDevicePixels={DPR}
        viewState={vs}
        onViewStateChange={(p: { viewState: unknown }) => setVs(p.viewState)}
        controller
        pickingRadius={PICK_RADIUS}
        layers={layers}
        getCursor={getCursor}
      />
      <MapHud lon={vs.longitude} lat={vs.latitude} zoom={vs.zoom}
        sat={sat} onSat={() => setSat((v) => !v)} tilt={tilt} onTilt={toggleTilt} />
      {hover && <div className="map-tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>{hover.text}<span className="tt-hint">{hover.hint}</span></div>}
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
