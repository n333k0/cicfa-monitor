import { engine } from '../../sim/engine';
import { useEngine } from '../../sim/useEngine';
import type { ViewMode } from '../../sim/types';

// MAP · GLOBE · NETWORK (artist, 2026-11-02: ARC removed; GLOBE back once redone red + readable)
const VIEWS: { id: ViewMode; label: string; ready: boolean }[] = [
  { id: 'flat', label: 'MAP', ready: true },
  { id: 'globe', label: 'GLOBE', ready: true },
  { id: 'ontology', label: 'NETWORK', ready: true },
];

export default function ViewSelector() {
  const snap = useEngine();
  return (
    <div className="viewsel panel">
      <span className="vs-label">VIEW</span>
      {VIEWS.map((v) => (
        <button key={v.id} className={`vbtn ${snap.viewMode === v.id ? 'on' : ''} ${v.ready ? '' : 'soon'}`}
          onClick={() => engine.setViewMode(v.id)} title={v.ready ? '' : 'in progress'}>
          {v.label}
        </button>
      ))}
    </div>
  );
}
