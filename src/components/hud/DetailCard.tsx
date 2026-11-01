import { engine } from '../../sim/engine';
import { INSTITUTION_INDEX } from '../../data/institutions';
import { AGENT_INDEX } from '../../data/agents';
import { VECTORS } from '../../data/vectors';
import { useEngine } from '../../sim/useEngine';
import { rgba } from '../../sim/format';

export default function DetailCard() {
  const snap = useEngine();
  const inst = snap.selectedInstitution ? INSTITUTION_INDEX[snap.selectedInstitution] : null;

  if (inst) {
    const logs = snap.log.filter((e) => e.targetId === inst.id);
    const byVec = new Map<string, number>();
    const byAgent = new Map<string, number>();
    for (const e of logs) {
      byVec.set(e.vector, (byVec.get(e.vector) ?? 0) + 1);
      byAgent.set(e.agentId, (byAgent.get(e.agentId) ?? 0) + 1);
    }
    const breaches = logs.filter((e) => e.outcome === 'breach' || e.outcome === 'exposed').length;
    const topAgent = [...byAgent.entries()].sort((a, b) => b[1] - a[1])[0];
    return (
      <div className="panel grow detail">
        <div className="panel-h"><span>Target Dossier</span><span className="tag" style={{ cursor: 'pointer' }} onClick={() => engine.selectInstitution(null)}>✕ CLOSE</span></div>
        <div className="panel-b" style={{ overflow: 'auto' }}>
          <div className="big">{inst.name}</div>
          <div className="mini" style={{ margin: '3px 0 6px' }}>{inst.city} · {inst.country} · {inst.kind}{inst.scene ? ` · ${inst.scene}` : ''}</div>
          {inst.blurb && <div style={{ color: 'var(--ink-dim)', margin: '0 0 8px', textTransform: 'none', lineHeight: 1.5 }}>{inst.blurb}</div>}
          <div className="row"><span>Coordinates</span><b>{inst.lat.toFixed(3)}, {inst.lon.toFixed(3)}</b></div>
          <div className="row"><span>Prominence</span><b>{'◆'.repeat(inst.prominence)}{'◇'.repeat(5 - inst.prominence)}</b></div>
          <div className="row"><span>Total strikes</span><b style={{ color: 'var(--amber)' }}>{engine.getSnapshot().hits[inst.id] ?? 0}</b></div>
          <div className="row"><span>Confirmed breach</span><b style={{ color: 'var(--red)' }}>{breaches}</b></div>
          <div className="row"><span>Primary aggressor</span><b style={{ color: rgba(AGENT_INDEX[topAgent?.[0] ?? '']?.color ?? [200,200,200]) }}>{AGENT_INDEX[topAgent?.[0] ?? '']?.handle ?? '—'}</b></div>
          <hr className="hair" />
          <div className="mini" style={{ marginBottom: 4 }}>Vectors used</div>
          <div className="chips">
            {[...byVec.entries()].sort((a, b) => b[1] - a[1]).map(([v, n]) => (
              <span key={v} className="conn" style={{ color: rgba(VECTORS[v as keyof typeof VECTORS].color), borderColor: rgba(VECTORS[v as keyof typeof VECTORS].color, 0.4) }}>
                {VECTORS[v as keyof typeof VECTORS].label} ×{n}
              </span>
            ))}
            {!byVec.size && <span className="mini">no recorded activity yet</span>}
          </div>
        </div>
      </div>
    );
  }

  // leaderboard when nothing selected
  const top = snap.stats.topTargets;
  return (
    <div className="panel grow detail">
      <div className="panel-h"><span>Most-Targeted</span><span className="tag">// HOT LIST</span></div>
      <div className="panel-b" style={{ overflow: 'auto' }}>
        {top.map((t, k) => (
          <div key={t.id} className="row" style={{ cursor: 'pointer', padding: '3px 0' }} onClick={() => engine.selectInstitution(t.id)}>
            <span style={{ color: 'var(--ink)' }}>{String(k + 1).padStart(2, '0')} · {t.name}</span>
            <b style={{ color: 'var(--amber)' }}>{t.hits}</b>
          </div>
        ))}
        {!top.length && <div className="mini">accumulating telemetry…</div>}
      </div>
    </div>
  );
}
