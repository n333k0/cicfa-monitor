import { engine } from '../../sim/engine';
import { VECTORS } from '../../data/vectors';
import { AGENT_INDEX } from '../../data/agents';
import { useEngine } from '../../sim/useEngine';
import { fmtTime, rgba } from '../../sim/format';

export default function EventFeed() {
  const snap = useEngine();
  // newest at the bottom so the stream scrolls upward like a live terminal
  const rows = snap.log.filter((e) => engine.passesFilter(e)).slice(0, 90).reverse();

  return (
    <div className="panel grow">
      <div className="panel-h">
        <span>Event Stream <span className="tag">// INTERCEPT</span></span>
        <span>{rows.length ? `LAST ${rows.length}` : 'STANDBY'}</span>
      </div>
      <div className="panel-b feed">
        {rows.map((e) => {
          const def = VECTORS[e.vector];
          const ag = AGENT_INDEX[e.agentId];
          return (
            <div key={e.id} className="ev" onClick={() => engine.selectInstitution(e.targetId)}>
              <span className="t">{fmtTime(e.startedAt)}</span>
              <span className="g" style={{ color: rgba(def.color) }}>{def.glyph}</span>
              <span className="d"><b style={{ color: rgba(ag?.color ?? def.color) }}>{ag?.handle ?? e.agentId}</b> {e.line}</span>
              <span className={`o ${e.outcome ?? ''}`}>{e.outcome ?? '···'}</span>
            </div>
          );
        })}
        {!rows.length && <div className="mini" style={{ padding: 10 }}>no events match current filter</div>}
      </div>
    </div>
  );
}
