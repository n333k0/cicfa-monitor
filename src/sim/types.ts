// ─── CICFA WORLD MONITOR · core domain types ──────────────────────────────
// An art installation about the aesthetics of surveillance and cyberwar.
// Everything below is SIMULATION: synthetic event streams rendered as theatre.

export type Region =
  | 'NA' // North America
  | 'SA' // South / Latin America
  | 'EU' // Europe
  | 'ME' // Middle East
  | 'AF' // Africa
  | 'AS' // Asia
  | 'OC'; // Oceania

export interface Institution {
  id: string;
  name: string;
  city: string;
  country: string;
  region: Region;
  lon: number;
  lat: number;
  /** curatorial weight — drives how often it is targeted & its node size */
  prominence: number; // 1..5
  kind: 'museum' | 'gallery' | 'biennial' | 'foundation' | 'collection' | 'institute' | 'artist-run' | 'fair' | 'project-space';
  tags?: string[];
  blurb?: string;
  scene?: string;
  source?: string;
}

export type ViewMode = 'flat' | 'globe' | 'arc' | 'ontology';

// ─── Attack taxonomy (aesthetic, not operational) ─────────────────────────
export type VectorId =
  | 'recon'
  | 'phishing'
  | 'spam'
  | 'intrusion'
  | 'exfiltration'
  | 'ransomware'
  | 'defacement'
  | 'ddos'
  | 'implant'
  | 'beacon';

export interface Vector {
  id: VectorId;
  label: string;
  glyph: string;
  color: [number, number, number];
  /** relative frequency weight */
  weight: number;
  verbs: string[];
}

export type EventPhase = 'inflight' | 'impact' | 'resolved';
export type Outcome = 'breach' | 'blocked' | 'contained' | 'exposed';

export interface AttackEvent {
  id: string;
  seq: number;
  vector: VectorId;
  agentId: string;
  sourceLon: number;
  sourceLat: number;
  targetId: string;
  targetLon: number;
  targetLat: number;
  severity: number; // 1..5
  startedAt: number; // ms epoch (sim clock)
  durationMs: number; // flight time
  phase: EventPhase;
  outcome: Outcome | null;
  line: string; // log line
  payloadBytes: number;
}

// ─── Agents ("Hermes" operators) ──────────────────────────────────────────
export type AgentStatus = 'live' | 'idle' | 'degraded' | 'offline';
export type AgentConnector = 'simulation' | 'webhook' | 'mcp' | 'manual';

export interface Agent {
  id: string;
  handle: string;
  codename: string;
  originLon: number;
  originLat: number;
  originLabel: string;
  status: AgentStatus;
  connector: AgentConnector;
  vectors: VectorId[];
  /** events emitted per minute when live (simulation cadence) */
  cadence: number;
  color: [number, number, number];
}
