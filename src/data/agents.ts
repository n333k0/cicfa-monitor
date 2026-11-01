import type { Agent } from '../sim/types';

// ─── CYBER WEAPONS LAB ────────────────────────────────────────────────────
// CICFA operations (DWG-CICFA-01). Each is a speculative-exploit instrument that
// stages an attack on the *symbolic architecture* of a cultural institution.
// `simulation` ops are driven by the local engine; webhook/mcp are live seams
// ready to be wired to real emitters (src/sim/connectors.ts). No real traffic.
export const AGENTS: Agent[] = [
  {
    id: 'boycottware', handle: 'BOYCOTTWARE™', codename: 'MARKET DEPRAVATION',
    originLon: 4.3517, originLat: 50.8503, originLabel: 'BRUSSELS RELAY',
    status: 'live', connector: 'simulation',
    vectors: ['ransomware', 'defacement', 'intrusion'], cadence: 10, color: [230, 0, 38],
  },
  {
    id: 'meta-ransom', handle: 'META_RANSOM', codename: 'HIJACK ENVIRONMENT',
    originLon: -0.1276, originLat: 51.5072, originLabel: 'LONDON NODE',
    status: 'live', connector: 'simulation',
    vectors: ['ransomware', 'intrusion', 'beacon'], cadence: 11, color: [255, 42, 42],
  },
  {
    id: 'mercado', handle: 'MERCADO_CENTRAL', codename: 'ART-AS-A-SERVICE',
    originLon: -58.3816, originLat: -34.6037, originLabel: 'BUENOS AIRES MESH',
    status: 'live', connector: 'simulation',
    vectors: ['exfiltration', 'recon', 'phishing'], cadence: 13, color: [255, 0, 102],
  },
  {
    id: 'code-pasta', handle: 'CODE_PASTA', codename: 'COPYPASTA',
    originLon: -46.6333, originLat: -23.5505, originLabel: 'SÃO PAULO FLOOD',
    status: 'live', connector: 'simulation',
    vectors: ['spam', 'defacement', 'phishing'], cadence: 15, color: [153, 153, 153],
  },
  {
    id: 'manifesto', handle: 'MANIFESTO.EXE', codename: 'WALL-TEXT OVERWRITE',
    originLon: 13.4050, originLat: 52.5200, originLabel: 'BERLIN CELL',
    status: 'live', connector: 'simulation',
    vectors: ['defacement', 'intrusion', 'recon'], cadence: 8, color: [255, 166, 189],
  },
  {
    id: 'provenance-worm', handle: 'PROVENANCE_WORM', codename: 'ARCHIVE SIPHON',
    originLon: 55.2708, originLat: 25.2048, originLabel: 'DUBAI DARK POOL',
    status: 'live', connector: 'simulation',
    vectors: ['exfiltration', 'implant', 'beacon'], cadence: 9, color: [255, 0, 102],
  },
  {
    id: 'null-curator', handle: 'NULL_CURATOR', codename: 'AUTHORITY DISSOLVE',
    originLon: 139.6917, originLat: 35.6895, originLabel: 'TOKYO WATCHPOST',
    status: 'live', connector: 'simulation',
    vectors: ['intrusion', 'recon', 'phishing'], cadence: 12, color: [230, 0, 38],
  },
  {
    id: 'dead-drop', handle: 'DEAD_DROP', codename: 'CONCEPTUAL IMPLANT',
    originLon: 103.8198, originLat: 1.3521, originLabel: 'SINGAPORE EDGE',
    status: 'degraded', connector: 'simulation',
    vectors: ['beacon', 'implant', 'recon'], cadence: 7, color: [120, 255, 170],
  },
  {
    id: 'ironic-ddos', handle: 'IRONIC_DDOS', codename: 'VOLUMETRIC IRONY',
    originLon: -122.3321, originLat: 47.6062, originLabel: 'SEATTLE FARM',
    status: 'idle', connector: 'webhook',
    vectors: ['ddos', 'spam'], cadence: 0, color: [255, 110, 90],
  },
  {
    id: 'cascade-07', handle: 'CASCADE_07', codename: 'CASCADE FAILURE',
    originLon: 37.6173, originLat: 55.7558, originLabel: 'MOSCOW DORMANT',
    status: 'offline', connector: 'mcp',
    vectors: ['recon', 'ddos', 'intrusion'], cadence: 0, color: [190, 130, 255],
  },
];

export const AGENT_INDEX: Record<string, Agent> = Object.fromEntries(
  AGENTS.map((a) => [a.id, a]),
);
