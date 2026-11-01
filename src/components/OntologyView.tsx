import { useEffect, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { OrthographicView } from '@deck.gl/core';
import { ScatterplotLayer, LineLayer, TextLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';

import { INSTITUTIONS } from '../data/institutions';
import { AGENTS } from '../data/agents';
import { VECTORS } from '../data/vectors';
import { engine } from '../sim/engine';
import { useEngine } from '../sim/useEngine';

type RGB = [number, number, number];
type Kind = 'op' | 'region' | 'inst';
interface Node { id: string; kind: Kind; label: string; color: RGB; size: number; x: number; y: number; vx: number; vy: number }
interface Link { s: string; t: string; color: RGB }

const REGIONS: { id: string; label: string }[] = [
  { id: 'NA', label: 'N·AMERICA' }, { id: 'SA', label: 'LATAM' }, { id: 'EU', label: 'EUROPE' },
  { id: 'ME', label: 'MID·EAST' }, { id: 'AF', label: 'AFRICA' }, { id: 'AS', label: 'ASIA' }, { id: 'OC', label: 'OCEANIA' },
];
const REGION_POS: Record<string, [number, number]> = {};
REGIONS.forEach((r, i) => { const a = (i / REGIONS.length) * Math.PI * 2; REGION_POS[r.id] = [Math.cos(a) * 300, Math.sin(a) * 300]; });

export default function OntologyView() {
  const snap = useEngine();
  const nodesRef = useRef<Map<string, Node>>(new Map());
  const linksRef = useRef<Link[]>([]);
  const [, setTick] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vs, setVs] = useState<any>({ target: [0, 0, 0], zoom: 0.22, minZoom: -2, maxZoom: 4 });
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  // rebuild node/link set from current telemetry (~4Hz via snapshot version)
  useEffect(() => {
    const hits = snap.hits;
    const top = INSTITUTIONS.filter((d) => (hits[d.id] ?? 0) > 0)
      .sort((a, b) => (hits[b.id] ?? 0) - (hits[a.id] ?? 0)).slice(0, 48);
    const cur = nodesRef.current;
    const next = new Map<string, Node>();
    const ensure = (id: string, kind: Kind, label: string, color: RGB, size: number, seed: [number, number]) => {
      const ex = cur.get(id);
      if (ex) { ex.label = label; ex.color = color; ex.size = size; next.set(id, ex); }
      else next.set(id, { id, kind, label, color, size, x: seed[0] + (Math.random() - 0.5) * 40, y: seed[1] + (Math.random() - 0.5) * 40, vx: 0, vy: 0 });
    };
    AGENTS.forEach((a, i) => { const ang = (i / AGENTS.length) * Math.PI * 2; ensure('op:' + a.id, 'op', a.handle, a.color as RGB, 7, [Math.cos(ang) * 120, Math.sin(ang) * 120]); });
    REGIONS.forEach((r) => ensure('rg:' + r.id, 'region', r.label, [210, 216, 228], 5, REGION_POS[r.id]));
    top.forEach((d) => ensure(d.id, 'inst', d.name, [150, 160, 182], 2 + Math.min(6, Math.sqrt(hits[d.id] ?? 1)), REGION_POS[d.region] ?? [0, 0]));
    nodesRef.current = next;

    const links: Link[] = [];
    for (const d of top) if (next.has('rg:' + d.region)) links.push({ s: d.id, t: 'rg:' + d.region, color: [70, 76, 92] });
    const seen = new Set<string>();
    for (const e of snap.log) {
      if (next.has(e.targetId) && next.has('op:' + e.agentId)) {
        const k = e.targetId + '|' + e.agentId;
        if (!seen.has(k)) { seen.add(k); links.push({ s: e.targetId, t: 'op:' + e.agentId, color: VECTORS[e.vector].color }); }
      }
    }
    linksRef.current = links;
  }, [snap.version, snap.hits, snap.log]);

  // continuous force simulation
  useEffect(() => {
    let raf = 0;
    const step = () => {
      const nodes = [...nodesRef.current.values()];
      const n = nodes.length;
      for (let i = 0; i < n; i++) {
        const a = nodes[i]; let fx = 0, fy = 0;
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy + 0.01;
          const f = 1600 / d2; fx += (dx / Math.sqrt(d2)) * f; fy += (dy / Math.sqrt(d2)) * f;
        }
        fx += -a.x * 0.0025; fy += -a.y * 0.0025; // centering
        const mass = a.kind === 'inst' ? 1 : 2.4;  // hubs heavier
        a.vx = (a.vx + fx / mass) * 0.80; a.vy = (a.vy + fy / mass) * 0.80;
      }
      for (const l of linksRef.current) {
        const s = nodesRef.current.get(l.s), t = nodesRef.current.get(l.t);
        if (!s || !t) continue;
        const dx = t.x - s.x, dy = t.y - s.y; const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const f = (dist - 72) * 0.018; const ux = dx / dist, uy = dy / dist;
        const sm = s.kind === 'inst' ? 1 : 2.4, tm = t.kind === 'inst' ? 1 : 2.4;
        s.vx += ux * f / sm; s.vy += uy * f / sm; t.vx -= ux * f / tm; t.vy -= uy * f / tm;
      }
      for (const a of nodes) { const sp = Math.hypot(a.vx, a.vy); if (sp > 6) { a.vx *= 6 / sp; a.vy *= 6 / sp; } a.x += a.vx; a.y += a.vy; }
      setTick((t) => t + 1);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nodes = [...nodesRef.current.values()];
  const pos = nodesRef.current;
  const sel = snap.selectedInstitution;
  const selA = snap.selectedAgent;
  const linkData = linksRef.current.map((l) => { const s = pos.get(l.s), t = pos.get(l.t); return s && t ? { sp: [s.x, s.y] as [number, number], tp: [t.x, t.y] as [number, number], color: l.color } : null; }).filter(Boolean) as { sp: [number, number]; tp: [number, number]; color: RGB }[];

  const layers = [
    new LineLayer({
      id: 'onto-links', data: linkData,
      getSourcePosition: (d: { sp: [number, number] }) => d.sp, getTargetPosition: (d: { tp: [number, number] }) => d.tp,
      getColor: (d: { color: RGB }) => [d.color[0], d.color[1], d.color[2], 90], getWidth: 0.5,
    }),
    new ScatterplotLayer({
      id: 'onto-nodes', data: nodes, pickable: true, radiusUnits: 'pixels', stroked: true, lineWidthUnits: 'pixels',
      getPosition: (d: Node) => [d.x, d.y],
      getRadius: (d: Node) => ((d.id === sel || 'op:' + (selA ?? '') === d.id) ? d.size + 3 : d.size),
      getFillColor: (d: Node) => (d.kind === 'op' ? [d.color[0], d.color[1], d.color[2], 240] : d.kind === 'region' ? [230, 236, 245, 220] : (d.id === sel ? [255, 220, 150, 255] : [150, 160, 182, 170])),
      getLineColor: (d: Node) => (d.id === sel ? [255, 220, 150, 255] : [255, 255, 255, 40]),
      getLineWidth: 0.5,
      onClick: (i: PickingInfo) => { const o = i.object as Node | undefined; if (!o) return true; if (o.kind === 'inst') engine.selectInstitution(o.id); else if (o.kind === 'op') engine.selectAgent(o.id.slice(3)); return true; },
      onHover: (i: PickingInfo) => setHover(i.object ? { x: i.x, y: i.y, text: (i.object as Node).label } : null),
      updateTriggers: { getRadius: [sel, selA], getFillColor: [sel], getLineColor: [sel] },
    }),
    new TextLayer({
      id: 'onto-labels', data: nodes.filter((d) => d.kind !== 'inst' || d.size > 3.2),
      getPosition: (d: Node) => [d.x, d.y], getText: (d: Node) => d.label,
      getSize: (d: Node) => (d.kind === 'op' ? 11 : d.kind === 'region' ? 10 : 9), sizeUnits: 'pixels',
      getColor: (d: Node) => (d.kind === 'op' ? [d.color[0], d.color[1], d.color[2], 255] : d.kind === 'region' ? [235, 240, 248, 230] : [190, 198, 214, 200]),
      fontFamily: 'JetBrains Mono, monospace', getTextAnchor: 'start', getAlignmentBaseline: 'center', getPixelOffset: [8, 0], characterSet: 'auto',
    }),
  ];

  return (
    <div className="map-root">
      <DeckGL views={new OrthographicView({})} viewState={vs} onViewStateChange={(p: { viewState: unknown }) => setVs(p.viewState)} controller layers={layers} />
      {hover && <div className="map-tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>{hover.text}</div>}
      <div className="map-vignette" />
      <div className="map-scanlines" />
    </div>
  );
}
