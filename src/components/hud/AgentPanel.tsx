import { engine } from '../../sim/engine';
import { useEngine } from '../../sim/useEngine';
import { rgba } from '../../sim/format';
import type { CSSProperties } from 'react';

export default function AgentPanel() {
  const snap = useEngine();
  return (
    <div className="panel">
      <div className="panel-h">
        <span>Cyber Weapons Lab</span>
        <span>{snap.agents.filter((a) => a.status !== 'offline').length} ARMED</span>
      </div>
      <div className="panel-b" style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {snap.agents.map((a) => {
          const sel = snap.selectedAgent === a.id || snap.filters.agentSolo === a.id;
          const off = a.status === 'offline' || a.status === 'idle';
          return (
            <div
              key={a.id}
              className={`agent ${sel ? 'sel' : ''} ${off ? 'off' : ''}`}
              style={{ ['--agent' as string]: rgba(a.color) } as CSSProperties}
              onClick={() => engine.selectAgent(a.id)}
            >
              <span className="led" />
              <div className="name">
                <b>{a.handle}</b>
                <span>“{a.codename}” · {a.originLabel}</span>
              </div>
              <div className="meta">
                <b>{engine.agentHitCount(a.id)}</b>
                <div className={`st ${a.status}`}>{a.status}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="panel-b" style={{ borderTop: '1px solid var(--line)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {snap.selectedAgent ? (
          <AgentActions id={snap.selectedAgent} />
        ) : (
          <span className="mini">select an operation · solo · deploy</span>
        )}
      </div>
    </div>
  );
}

function AgentActions({ id }: { id: string }) {
  const snap = useEngine();
  const a = snap.agents.find((x) => x.id === id);
  if (!a) return null;
  const solo = snap.filters.agentSolo === id;
  return (
    <>
      <span className="conn">{a.connector}</span>
      {a.vectors.map((v) => <span key={v} className="conn">{v}</span>)}
      <div style={{ flexBasis: '100%', height: 2 }} />
      <button className="btn fire" onClick={() => engine.fire(id)}>▶ Deploy</button>
      <button className="btn" onClick={() => engine.soloAgent(id)}>{solo ? 'Unsolo' : 'Solo'}</button>
      {a.status === 'offline' || a.status === 'idle'
        ? <button className="btn primary" onClick={() => engine.setAgentStatus(id, 'live')}>Bring online</button>
        : <button className="btn" onClick={() => engine.setAgentStatus(id, 'offline')}>Take offline</button>}
    </>
  );
}
