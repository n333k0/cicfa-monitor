import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { engine } from './engine';

/** HUD-facing snapshot; re-renders only on meaningful change (spawn/resolve/~4Hz). */
export function useEngine() {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
}

/** Per-frame tick for the map. Returns a frame counter that increments each rAF. */
export function useFrame(): number {
  const [, force] = useState(0);
  const frame = useRef(0);
  useEffect(() => engine.subscribeFrame(() => { frame.current++; force(frame.current); }), []);
  return frame.current;
}
