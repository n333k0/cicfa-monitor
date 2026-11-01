// ─── Live agent connectors ────────────────────────────────────────────────
// The simulation is the default event source. These stubs are the seam where
// real "Hermes" agents push events INTO the monitor. Nothing here sends any
// traffic to the outside world — an emitter only calls engine.injectEvent(),
// which renders a node + arc exactly like a simulated one.
//
// Wire a real agent three ways:
//   1. window.CICFA.inject({...})            — from the browser console / any script
//   2. new WebSocket feed                    — see attachWebSocketFeed()
//   3. postMessage from an embedding host     — see attachPostMessageBridge()

import { AGENT_INDEX } from '../data/agents';
import { INSTITUTION_INDEX } from '../data/institutions';
import { engine } from './engine';
import type { VectorId } from './types';

export interface InjectPayload {
  agentId: string;
  vector: VectorId;
  targetId: string;
  severity?: number;
  line?: string;
}

/** Inject an externally-produced event. Falls back gracefully on bad input. */
export function injectEvent(p: InjectPayload) {
  const agent = AGENT_INDEX[p.agentId];
  const target = INSTITUTION_INDEX[p.targetId];
  if (!agent || !target) {
    console.warn('[cicfa] inject rejected — unknown agent/target', p);
    return null;
  }
  // Route through the engine's own spawn so visuals stay identical.
  const e = engine.fire(p.agentId);
  return e;
}

export function attachWebSocketFeed(url: string) {
  const ws = new WebSocket(url);
  ws.onmessage = (msg) => {
    try { injectEvent(JSON.parse(msg.data)); } catch { /* ignore malformed */ }
  };
  ws.onclose = () => console.info('[cicfa] ws feed closed', url);
  return () => ws.close();
}

export function attachPostMessageBridge() {
  const handler = (ev: MessageEvent) => {
    if (ev.data?.type === 'cicfa:inject') injectEvent(ev.data.payload);
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

// Expose a tiny global API for console / host-driven control during exhibition.
declare global {
  interface Window { CICFA?: Record<string, unknown>; }
}
export function installGlobalBridge() {
  window.CICFA = {
    inject: injectEvent,
    fire: (id: string) => engine.fire(id),
    pause: () => engine.setRunning(false),
    resume: () => engine.setRunning(true),
    speed: (n: number) => engine.setSpeed(n),
    attachWebSocketFeed,
  };
}
