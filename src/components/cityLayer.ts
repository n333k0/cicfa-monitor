// City detail for the MAP view: OpenFreeMap vector tiles (OpenMapTiles schema, free, no key),
// drawn in the monitor's own thin-line terminal style. Fades in as you zoom toward a city:
// roads by class, water, parks, (buildings very close), place + street names in JetBrains Mono.
import { MVTLayer } from '@deck.gl/geo-layers';
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';

const TILEJSON = 'https://tiles.openfreemap.org/planet';
const FONT = 'JetBrains Mono, monospace';

type RGBA = [number, number, number, number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Feat = { type: string; geometry: { type: string; coordinates: any }; properties: Record<string, any> };

const ROAD: Record<string, [RGBA, number]> = {
  motorway: [[225, 228, 238, 175], 1.3], trunk: [[215, 220, 232, 160], 1.2],
  primary: [[200, 206, 220, 135], 1.0], secondary: [[185, 192, 208, 110], 0.85],
  tertiary: [[170, 178, 194, 95], 0.75], minor: [[150, 158, 175, 78], 0.55],
  service: [[130, 138, 155, 55], 0.45], track: [[120, 128, 145, 40], 0.4],
  path: [[120, 128, 145, 38], 0.4], rail: [[150, 150, 160, 70], 0.5], transit: [[150, 150, 160, 70], 0.5],
};
const PLACE_MIN_ZOOM: Record<string, number> = {
  city: 5, town: 8, village: 11, suburb: 11, quarter: 12.5, neighbourhood: 13, hamlet: 13,
};
const URBAN = new Set(['residential', 'commercial', 'industrial', 'retail', 'neighbourhood', 'suburb', 'quarter']);
const name = (p: Record<string, unknown>) => String(p['name:latin'] ?? p.name ?? '').toUpperCase();

// Per-tile cache so we don't re-filter / re-upload tile geometry every animation frame.
const cache = new WeakMap<object, { key: number; geo: Feat[]; places: Feat[]; streets: { pos: [number, number]; text: string; angle: number }[] }>();

function prepare(content: Feat[], zb: number) {
  const hit = cache.get(content);
  if (hit && hit.key === zb) return hit;
  const geo: Feat[] = [], places: Feat[] = [], streets: { pos: [number, number]; text: string; angle: number }[] = [];
  for (const f of content) {
    const L = f.properties.layerName;
    if (L === 'place') {
      const min = PLACE_MIN_ZOOM[f.properties.class as string];
      if (min !== undefined && zb >= min && name(f.properties)) places.push(f);
    } else if (L === 'transportation_name') {
      if (zb < 14.5 || !f.properties.name) continue;
      const g = f.geometry;
      const line: number[][] = g.type === 'LineString' ? g.coordinates : g.type === 'MultiLineString' ? g.coordinates[0] : null;
      if (!line || line.length < 2) continue;
      const i = Math.floor((line.length - 1) / 2);
      const a = line[i], b = line[i + 1];
      // tile-local coords: y grows downward, like the screen
      let ang = (Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI;
      if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
      streets.push({ pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], text: name(f.properties), angle: ang });
    } else if (L === 'building') {
      if (zb >= 15) geo.push(f);
    } else if (L === 'boundary') {
      // countries + provinces (the coarse world borders fade out as you zoom in); skip maritime lines
      if (f.properties.admin_level <= 4 && !f.properties.maritime) geo.push(f);
    } else if (L === 'landuse') {
      // urban footprint as a faint tint — the city's shape, subtle
      if (URBAN.has(f.properties.class)) geo.push(f);
    } else {
      geo.push(f);
    }
  }
  const out = { key: zb, geo, places, streets };
  cache.set(content, out);
  return out;
}

const lineColor = (f: Feat): RGBA => {
  const L = f.properties.layerName;
  if (L === 'transportation') return (ROAD[f.properties.class] ?? ROAD.minor)[0];
  if (L === 'water') return [90, 120, 160, 120];
  if (L === 'waterway') return [90, 120, 160, 90];
  if (L === 'park') return [120, 150, 130, 55];
  if (L === 'building') return [140, 146, 160, 38];
  if (L === 'boundary') return f.properties.admin_level <= 2 ? [200, 206, 222, 120] : [150, 156, 172, 70];
  if (L === 'landuse') return [0, 0, 0, 0];
  return [140, 146, 160, 50];
};
const lineWidth = (f: Feat) => (f.properties.layerName === 'transportation' ? (ROAD[f.properties.class] ?? ROAD.minor)[1] : 0.5);
const fillColor = (f: Feat): RGBA => {
  const L = f.properties.layerName;
  if (L === 'water') return [6, 12, 24, 255];
  if (L === 'landuse') return [26, 22, 30, 150];   // urban tint (faint warm grey)
  if (L === 'park') return [14, 26, 20, 140];      // parks, faint green-black
  return [0, 0, 0, 0];
};
// over satellite imagery the opaque fills would hide it — keep only the thin lines + labels
const fillColorSat = (): RGBA => [0, 0, 0, 0];

/** zoom = current map zoom; satellite = overhead imagery is on (drop opaque fills). Returns null below city range. */
export function cityLayer(zoom: number, satellite = false) {
  if (zoom < 4) return null;
  const zb = Math.floor(zoom * 2) / 2;                       // zoom bucket (re-filter only every half step)
  const opacity = Math.min(1, (zoom - 4) / 1.5);
  return new MVTLayer({
    id: 'city', data: TILEJSON, binary: false, minZoom: 4, maxZoom: 14, opacity,
    loadOptions: { mvt: { layers: ['landuse', 'water', 'waterway', 'park', 'transportation', 'transportation_name', 'place', 'building', 'boundary'] } },
    updateTriggers: { renderSubLayers: [zb, satellite] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderSubLayers: (props: any) => {
      if (!props.data || !Array.isArray(props.data)) return null;
      const p = prepare(props.data as Feat[], zb);
      const base = { modelMatrix: props.modelMatrix, coordinateOrigin: props.coordinateOrigin, coordinateSystem: props.coordinateSystem, extensions: props.extensions };
      return [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new GeoJsonLayer({
          ...base, id: `${props.id}-geo`, data: p.geo,
          stroked: true, filled: true, pointType: 'circle', getPointRadius: 0,
          lineWidthUnits: 'pixels', getLineWidth: lineWidth, lineWidthMinPixels: 0.4,
          getLineColor: lineColor, getFillColor: satellite ? fillColorSat : fillColor,
        } as any),
        new TextLayer({
          ...base, id: `${props.id}-places`, data: p.places,
          getPosition: (f: Feat) => f.geometry.coordinates, getText: (f: Feat) => name(f.properties),
          getSize: (f: Feat) => (f.properties.class === 'city' ? 11 : 10), sizeUnits: 'pixels',
          getColor: (f: Feat) => (f.properties.class === 'city' || f.properties.class === 'town' ? [235, 238, 245, 210] : [170, 178, 196, 160]),
          fontFamily: FONT, characterSet: 'auto', getTextAnchor: 'middle', getAlignmentBaseline: 'center',
        }),
        new TextLayer({
          ...base, id: `${props.id}-streets`, data: p.streets,
          getPosition: (s: { pos: [number, number] }) => s.pos, getText: (s: { text: string }) => s.text,
          getAngle: (s: { angle: number }) => s.angle,
          getSize: 9, sizeUnits: 'pixels', getColor: [150, 158, 178, 150],
          fontFamily: FONT, characterSet: 'auto', getTextAnchor: 'middle', getAlignmentBaseline: 'center',
        }),
      ];
    },
  });
}
