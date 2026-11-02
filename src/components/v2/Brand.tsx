// v2 brand block: ASCII mark with the view nav underneath — lives at the top of the left
// column panel so logo, nav and panels share one box and one left edge (artist, 2026-11-02).
import { engine } from '../../sim/engine';
import { useEngine } from '../../sim/useEngine';
import AsciiLogo from './AsciiLogo';

const VIEWS: [string, 'flat' | 'globe' | 'ontology'][] = [['Map', 'flat'], ['Globe', 'globe'], ['Network', 'ontology']];

export default function Brand() {
  const snap = useEngine();
  return (
    <div className="v2-brand">
      <AsciiLogo />
      <nav className="v2-nav">
        {VIEWS.map(([l, m]) => <button key={m} className={snap.viewMode === m ? 'on' : ''} onClick={() => engine.setViewMode(m)}>{l}</button>)}
      </nav>
    </div>
  );
}
