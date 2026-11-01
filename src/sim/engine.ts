import { AGENTS, AGENT_INDEX } from '../data/agents';
import { INSTITUTIONS, INSTITUTION_INDEX } from '../data/institutions';
import { VECTORS } from '../data/vectors';
import { haversineKm } from './geo';
import type {
  Agent, AttackEvent, Institution, Outcome, Region, VectorId, ViewMode,
} from './types';

// ─── RNG + helpers ────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[(Math.random() * arr.length) | 0]; }
function weightedVector(vectors: VectorId[]): VectorId {
  const weights = vectors.map((v) => VECTORS[v].weight);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let k = 0; k < vectors.length; k++) { r -= weights[k]; if (r <= 0) return vectors[k]; }
  return vectors[vectors.length - 1];
}
function targetFor(): Institution {
  // prominence-weighted target selection, biased toward unlucky nodes
  let best: Institution = INSTITUTIONS[0];
  let bestScore = -Infinity;
  for (let k = 0; k < 6; k++) {
    const cand = pick(INSTITUTIONS);
    const score = cand.prominence * (0.5 + Math.random());
    if (score > bestScore) { bestScore = score; best = cand; }
  }
  return best;
}

export interface Stats {
  total: number;
  active: number;
  perMin: number;
  byVector: Record<VectorId, number>;
  byOutcome: Record<Outcome, number>;
  bytesExfil: number;
  topTargets: { id: string; name: string; hits: number }[];
}

export interface Filters {
  vectors: Set<VectorId>;
  regions: Set<Region>;
  agentSolo: string | null;
}

export interface Snapshot {
  version: number;
  running: boolean;
  speed: number;
  clock: number;
  agents: Agent[];
  log: AttackEvent[];
  stats: Stats;
  selectedInstitution: string | null;
  selectedAgent: string | null;
  filters: Filters;
  hits: Record<string, number>;
  viewMode: ViewMode;
  panelMode: 'float' | 'boxed';
  ontologyEarth: boolean;
}

const ALL_VECTORS = Object.keys(VECTORS) as VectorId[];
const ALL_REGIONS: Region[] = ['NA', 'SA', 'EU', 'ME', 'AF', 'AS', 'OC'];

class Engine {
  running = true;
  speed = 1;
  clock = Date.now();
  seq = 0;

  active: AttackEvent[] = [];
  log: AttackEvent[] = [];
  hits: Record<string, number> = {};
  private agentHits: Record<string, number> = {};

  private agents = AGENTS.map((a) => ({ ...a }));
  private lastSpawn: Record<string, number> = {};
  private recentTimestamps: number[] = [];

  selectedInstitution: string | null = null;
  selectedAgent: string | null = null;
  viewMode: ViewMode = 'ontology';
  panelMode: 'float' | 'boxed' = 'float';
  ontologyEarth = false; // in ontology view: false = abstract network graph, true = geographic earth
  flyTarget: { lon: number; lat: number; zoom: number; at: number } | null = null;

  filters: Filters = {
    vectors: new Set(ALL_VECTORS),
    regions: new Set(ALL_REGIONS),
    agentSolo: null,
  };

  private frameSubs = new Set<() => void>();
  private changeSubs = new Set<() => void>();
  private _snap: Snapshot | null = null;
  private version = 0;
  private raf = 0;
  private lastT = 0;
  private statsAccum = 0;

  constructor() {
    for (const a of this.agents) { this.lastSpawn[a.id] = 0; this.agentHits[a.id] = 0; }
    // seed a little history so the board isn't empty on first paint
    for (let k = 0; k < 24; k++) this.spawn(undefined, true);
  }

  // ── subscriptions ───────────────────────────────────────────────
  subscribe = (fn: () => void) => { this.changeSubs.add(fn); return () => { this.changeSubs.delete(fn); }; };
  subscribeFrame = (fn: () => void) => { this.frameSubs.add(fn); return () => { this.frameSubs.delete(fn); }; };
  private notifyChange() { this.version++; this._snap = null; for (const f of this.changeSubs) f(); }
  private notifyFrame() { for (const f of this.frameSubs) f(); }

  getSnapshot = (): Snapshot => {
    if (this._snap) return this._snap;
    this._snap = {
      version: this.version,
      running: this.running,
      speed: this.speed,
      clock: this.clock,
      agents: this.agents,
      log: this.log,
      stats: this.computeStats(),
      selectedInstitution: this.selectedInstitution,
      selectedAgent: this.selectedAgent,
      filters: this.filters,
      hits: this.hits,
      viewMode: this.viewMode,
      panelMode: this.panelMode,
      ontologyEarth: this.ontologyEarth,
    };
    return this._snap;
  };

  getActive = () => this.active;
  getAgents = () => this.agents;

  private computeStats(): Stats {
    const byVector = Object.fromEntries(ALL_VECTORS.map((v) => [v, 0])) as Record<VectorId, number>;
    const byOutcome: Record<Outcome, number> = { breach: 0, blocked: 0, contained: 0, exposed: 0 };
    let bytes = 0;
    for (const e of this.log) {
      byVector[e.vector]++;
      if (e.outcome) byOutcome[e.outcome]++;
      if (e.vector === 'exfiltration') bytes += e.payloadBytes;
    }
    const topTargets = Object.entries(this.hits)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([id, hits]) => ({ id, name: INSTITUTION_INDEX[id]?.name ?? id, hits }));
    const now = this.clock;
    this.recentTimestamps = this.recentTimestamps.filter((t) => now - t < 60_000);
    return {
      total: this.seq,
      active: this.active.length,
      perMin: this.recentTimestamps.length,
      byVector, byOutcome, bytesExfil: bytes, topTargets,
    };
  }

  // ── event creation ──────────────────────────────────────────────
  /** Spawn an event. Public so external connectors (webhook/mcp/manual) can inject. */
  spawn(agentId?: string, seedHistory = false): AttackEvent | null {
    const liveAgents = this.agents.filter((a) => a.status === 'live' || a.status === 'degraded');
    const agent = agentId ? AGENT_INDEX[agentId] && this.agents.find((a) => a.id === agentId)
      : pick(liveAgents.length ? liveAgents : this.agents);
    if (!agent) return null;
    const vector = weightedVector(agent.vectors);
    const target = targetFor();
    const vdef = VECTORS[vector];
    const distKm = haversineKm(agent.originLon, agent.originLat, target.lon, target.lat);
    const severity = Math.min(5, Math.max(1,
      Math.round((vdef.weight > 6 ? 2 : 3) + Math.random() * 2 + (vector === 'ransomware' ? 2 : 0))));
    const durationMs = 2200 + distKm * 0.9 + Math.random() * 1500;
    const startedAt = seedHistory ? this.clock - Math.random() * 40_000 : this.clock;
    const payloadBytes = vector === 'exfiltration'
      ? Math.round((0.5 + Math.random() * 40) * 1e6)
      : Math.round(Math.random() * 2e5);

    const e: AttackEvent = {
      id: `evt-${(this.seq).toString(36)}-${(Math.random() * 1e6 | 0).toString(36)}`,
      seq: this.seq++,
      vector, agentId: agent.id,
      sourceLon: agent.originLon, sourceLat: agent.originLat,
      targetId: target.id, targetLon: target.lon, targetLat: target.lat,
      severity, startedAt, durationMs,
      phase: 'inflight', outcome: null,
      line: `${pick(vdef.verbs)} ${target.name} · ${target.city}`,
      payloadBytes,
    };

    this.recentTimestamps.push(startedAt);
    this.hits[target.id] = (this.hits[target.id] ?? 0) + 1;
    this.agentHits[agent.id] = (this.agentHits[agent.id] ?? 0) + 1;

    if (seedHistory) {
      // resolve immediately into log for initial backfill
      this.resolve(e, true);
    } else {
      this.active.push(e);
    }
    return e;
  }

  private resolve(e: AttackEvent, silent = false) {
    const roll = Math.random();
    let outcome: Outcome;
    const vuln = 0.35 + e.severity * 0.06;
    if (roll < vuln * 0.45) outcome = 'breach';
    else if (roll < vuln) outcome = e.vector === 'exfiltration' ? 'exposed' : 'contained';
    else outcome = 'blocked';
    e.outcome = outcome;
    e.phase = 'resolved';
    this.log.unshift(e);
    if (this.log.length > 400) this.log.length = 400;
    if (!silent) this.notifyChange();
  }

  // ── main loop ───────────────────────────────────────────────────
  start() {
    if (this.raf) return;
    this.lastT = performance.now();
    const loop = (t: number) => {
      const dtReal = Math.min(100, t - this.lastT);
      this.lastT = t;
      if (this.running) this.tick(dtReal * this.speed);
      this.notifyFrame();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }

  private tick(dt: number) {
    this.clock += dt;
    let changed = false;

    // spawn per-agent by cadence
    for (const a of this.agents) {
      if (a.cadence <= 0 || a.status === 'offline' || a.status === 'idle') continue;
      const interval = 60_000 / a.cadence;
      if (this.clock - (this.lastSpawn[a.id] || 0) >= interval) {
        this.lastSpawn[a.id] = this.clock;
        if (Math.random() < (a.status === 'degraded' ? 0.6 : 1)) { this.spawn(a.id); changed = true; }
      }
    }

    // advance phases / resolve
    for (let k = this.active.length - 1; k >= 0; k--) {
      const e = this.active[k];
      const age = this.clock - e.startedAt;
      const prog = age / e.durationMs;
      if (prog >= 1 && e.phase !== 'impact') { e.phase = 'impact'; }
      if (age >= e.durationMs + 1100) {
        this.active.splice(k, 1);
        this.resolve(e, true);
        changed = true;
      }
    }

    // stats heartbeat ~4Hz so counters/feed update without 60fps churn
    this.statsAccum += dt;
    if (changed || this.statsAccum > 250) { this.statsAccum = 0; this.notifyChange(); }
  }

  // ── controls ────────────────────────────────────────────────────
  setRunning(v: boolean) { this.running = v; this.notifyChange(); }
  toggleRunning() { this.setRunning(!this.running); }
  setSpeed(v: number) { this.speed = v; this.notifyChange(); }
  selectInstitution(id: string | null) {
    this.selectedInstitution = id; this.selectedAgent = null;
    if (id) { const x = INSTITUTION_INDEX[id]; if (x) this.flyTarget = { lon: x.lon, lat: x.lat, zoom: this.viewMode === 'globe' ? 2.6 : 4.2, at: performance.now() }; }
    this.notifyChange();
  }
  setViewMode(m: ViewMode) { this.viewMode = m; this.selectedInstitution = null; this.notifyChange(); }
  toggleOntologyEarth() { this.ontologyEarth = !this.ontologyEarth; this.notifyChange(); }
  setPanelMode(m: 'float' | 'boxed') { this.panelMode = m; this.notifyChange(); }
  togglePanelMode() { this.setPanelMode(this.panelMode === 'float' ? 'boxed' : 'float'); }
  consumeFlyTarget() { const t = this.flyTarget; this.flyTarget = null; return t; }
  selectAgent(id: string | null) { this.selectedAgent = id; this.selectedInstitution = null; this.notifyChange(); }

  toggleVector(v: VectorId) {
    const s = new Set(this.filters.vectors);
    s.has(v) ? s.delete(v) : s.add(v);
    this.filters = { ...this.filters, vectors: s };
    this.notifyChange();
  }
  toggleRegion(r: Region) {
    const s = new Set(this.filters.regions);
    s.has(r) ? s.delete(r) : s.add(r);
    this.filters = { ...this.filters, regions: s };
    this.notifyChange();
  }
  soloAgent(id: string | null) {
    this.filters = { ...this.filters, agentSolo: this.filters.agentSolo === id ? null : id };
    this.notifyChange();
  }
  setAgentStatus(id: string, status: Agent['status']) {
    const a = this.agents.find((x) => x.id === id); if (!a) return;
    a.status = status;
    if ((status === 'live' || status === 'degraded') && a.cadence === 0) a.cadence = 10;
    this.notifyChange();
  }
  agentHitCount(id: string) { return this.agentHits[id] ?? 0; }

  /** manual trigger — "fire" an agent once (used by HUD button + external connectors) */
  fire(agentId: string) { const e = this.spawn(agentId); if (e) this.notifyChange(); return e; }

  passesFilter(e: AttackEvent): boolean {
    if (!this.filters.vectors.has(e.vector)) return false;
    const reg = INSTITUTION_INDEX[e.targetId]?.region;
    if (reg && !this.filters.regions.has(reg)) return false;
    if (this.filters.agentSolo && e.agentId !== this.filters.agentSolo) return false;
    return true;
  }
}

export const engine = new Engine();
export { ALL_VECTORS, ALL_REGIONS };
