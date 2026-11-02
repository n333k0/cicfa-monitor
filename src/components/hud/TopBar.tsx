import { useEffect, useState } from 'react';
import { useEngine } from '../../sim/useEngine';
import { fmtInt, fmtTime } from '../../sim/format';
import { INSTITUTIONS } from '../../data/institutions';
import { V2 } from '../../theme';

export default function TopBar() {
  const snap = useEngine();
  const [wall, setWall] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setWall(Date.now()), 1000); return () => clearInterval(t); }, []);
  const s = snap.stats;
  const liveAgents = snap.agents.filter((a) => a.status === 'live' || a.status === 'degraded').length;

  if (V2) return null;   // v2: the spec block lives inside the right column (v2/Spec)

  return (
    <div className="topbar">
      <div className="panel brand">
        <span className="dot" />
        <div>
          <div className="mark">CICFA MONITOR</div>
        </div>
      </div>
      <div className="panel flex">
        <div className="kv"><span className="k">Institutions</span><span className="v cyan">{fmtInt(INSTITUTIONS.length)}</span></div>
        <div className="kv"><span className="k">Agents live</span><span className="v green">{liveAgents}/{snap.agents.length}</span></div>
        <div className="kv"><span className="k">In flight</span><span className="v amber">{s.active}</span></div>
        <div className="kv"><span className="k">Events logged</span><span className="v">{fmtInt(s.total)}</span></div>
        <div className="kv"><span className="k">Ops / min</span><span className="v amber">{s.perMin}</span></div>
        <div className="kv"><span className="k">Breaches</span><span className="v red">{s.byOutcome.breach}</span></div>
        <div className="kv"><span className="k">Blocked</span><span className="v green">{s.byOutcome.blocked}</span></div>
        <div className="kv" style={{ marginLeft: 'auto' }}>
          <span className="k">UTC · SIM {snap.running ? 'RUN' : 'HOLD'} ×{snap.speed}</span>
          <span className="clock">{fmtTime(wall)} // {fmtTime(snap.clock)}</span>
        </div>
      </div>
    </div>
  );
}
