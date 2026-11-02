import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { engine } from './engine';

/** HUD-facing snapshot; re-renders only on meaningful change (spawn/resolve/~4Hz). */
export function useEngine() {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
}

/** Animation tick for the map views, capped at `fps` (default 30): the React tree +
 *  deck.gl layer diff run at most this often; camera moves are not affected. */
export function useFrame(fps = 30): number {
  const [, force] = useState(0);
  const frame = useRef(0);
  useEffect(() => {
    let last = 0;
    const min = 1000 / fps - 2;
    return engine.subscribeFrame(() => {
      const t = performance.now();
      if (t - last < min) return;
      last = t; frame.current++; force(frame.current);
    });
  }, [fps]);
  return frame.current;
}
