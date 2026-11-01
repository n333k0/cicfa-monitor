import { engine, ALL_VECTORS } from '../../sim/engine';
import { VECTORS } from '../../data/vectors';
import { useEngine } from '../../sim/useEngine';
import { fmtBytes, rgba } from '../../sim/format';

export default function StatsPanel() {
  const snap = useEngine();
  const s = snap.stats;
  const max = Math.max(1, ...ALL_VECTORS.map((v) => s.byVector[v]));

  return (
    <div className="panel">
      <div className="panel-h"><span>Threat Telemetry</span><span className="tag">// LIVE</span></div>
      <div className="panel-b">
        <div className="tiles">
          <div className="tile"><div className="k">Breach</div><div className="v red">{s.byOutcome.breach}</div></div>
          <div className="tile"><div className="k">Exposed</div><div className="v" style={{ color: 'var(--magenta)' }}>{s.byOutcome.exposed}</div></div>
          <div className="tile"><div className="k">Contained</div><div className="v amber">{s.byOutcome.contained}</div></div>
          <div className="tile"><div className="k">Blocked</div><div className="v green">{s.byOutcome.blocked}</div></div>
          <div className="tile"><div className="k">Exfiltrated</div><div className="v" style={{ color: 'var(--magenta)' }}>{fmtBytes(s.bytesExfil)}</div></div>
          <div className="tile"><div className="k">Ops / min</div><div className="v cyan">{s.perMin}</div></div>
        </div>

        <hr className="hair" />
        <div className="mini" style={{ margin: '14px 0 5px' }}>Vector distribution · click to filter</div>
        {ALL_VECTORS.map((v) => {
          const def = VECTORS[v];
          const n = s.byVector[v];
          const on = snap.filters.vectors.has(v);
          return (
            <div key={v} className={`vrow ${on ? '' : 'mute'}`} onClick={() => engine.toggleVector(v)}>
              <span className="vl" style={{ color: rgba(def.color) }}><i>{def.glyph}</i>{def.label}</span>
              <span className="vbar"><span style={{ width: `${(n / max) * 100}%`, background: rgba(def.color, 0.85) }} /></span>
              <span className="vn">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
