import { engine } from '../../sim/engine';
import { useEngine } from '../../sim/useEngine';

export default function DetailCard() {
  const snap = useEngine();

  // leaderboard when nothing selected
  const top = snap.stats.topTargets;
  return (
    <div className="panel grow detail">
      <div className="panel-h"><span>Most-Targeted</span><span className="tag">// HOT LIST</span></div>
      <div className="panel-b" style={{ overflow: 'auto' }}>
        {top.map((t, k) => (
          <div key={t.id} className="row" style={{ cursor: 'pointer', padding: '3px 0' }} onClick={() => engine.selectInstitution(t.id)}>
            <span style={{ color: snap.selectedInstitution === t.id ? 'var(--crimson)' : 'var(--ink)' }}>{String(k + 1).padStart(2, '0')} · {t.name}</span>
            <b style={{ color: 'var(--amber)' }}>{t.hits}</b>
          </div>
        ))}
        {!top.length && <div className="mini">accumulating telemetry…</div>}
      </div>
    </div>
  );
}
