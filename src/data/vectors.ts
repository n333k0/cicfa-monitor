import type { Vector, VectorId } from '../sim/types';

// CICFA vector taxonomy — speculative exploits against the *symbolic architecture*
// of cultural institutions (ONBOARDING_V0.7). Palette biased to the Vault template:
// crimson / magenta / pink / white / grey on pure black, with a few muted signals.
export const VECTORS: Record<VectorId, Vector> = {
  recon: {
    id: 'recon', label: 'RECON', glyph: '◇',
    color: [200, 205, 215], weight: 9,
    verbs: ['power-flow mapping of', 'structural recon of', 'passive map of', 'asset enumeration of'],
  },
  phishing: {
    id: 'phishing', label: 'LURE', glyph: '✉',
    color: [255, 166, 189], weight: 8,
    verbs: ['pretext lure to', 'credential theatre at', 'spoofed invite to', 'spear-lure of'],
  },
  spam: {
    id: 'spam', label: 'PASTA', glyph: '≋',
    color: [153, 153, 153], weight: 6,
    verbs: ['code-pasta flood of', 'list flood of', 'channel saturation of', 'copypasta drop on'],
  },
  intrusion: {
    id: 'intrusion', label: 'BREACH', glyph: '⚿',
    color: [230, 0, 38], weight: 7,
    verbs: ['symbolic breach of', 'authority dissolve at', 'lateral move inside', 'foothold on'],
  },
  exfiltration: {
    id: 'exfiltration', label: 'EXFIL', glyph: '⬓',
    color: [255, 0, 102], weight: 6,
    verbs: ['provenance siphon from', 'donor-list pull from', 'archive exfil from', 'registry dump from'],
  },
  ransomware: {
    id: 'ransomware', label: 'RANSOM', glyph: '☢',
    color: [255, 42, 42], weight: 3,
    verbs: ['meta-ransom hijack of', 'page-lock of', 'countdown-to-nothing at', 'mirror-lock of'],
  },
  defacement: {
    id: 'defacement', label: 'MANIFEST', glyph: '✖',
    color: [255, 80, 160], weight: 4,
    verbs: ['manifesto injection on', 'curatorial overwrite of', 'wall-text hijack at', 'redaction of'],
  },
  ddos: {
    id: 'ddos', label: 'DDOS', glyph: '⟱',
    color: [255, 110, 90], weight: 5,
    verbs: ['ironic DDOS of', 'volumetric flood of', 'ticketing overload at', 'edge saturation of'],
  },
  implant: {
    id: 'implant', label: 'IMPLANT', glyph: '◉',
    color: [190, 130, 255], weight: 4,
    verbs: ['conceptual implant in', 'persistence staged at', 'exploit seeded at', 'backdoor concept in'],
  },
  beacon: {
    id: 'beacon', label: 'DEADDROP', glyph: '⌁',
    color: [120, 255, 170], weight: 5,
    verbs: ['dead-drop callback from', 'heartbeat from', 'telemetry from', 'C2 check-in from'],
  },
};

export const VECTOR_LIST: Vector[] = Object.values(VECTORS);
