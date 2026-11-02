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

  if (V2) {
    // Tomb layout: spec block (bold label / regular value) top-right; the ASCII mark + nav live in the left column (v2/Brand)
    return (
      <>
        <div className="v2-spec">
          <div className="v2-spec-h"><b>CICFA<br />DWG-01</b><span className="v2-clock">{fmtTime(wall)} UTC<br /><i>SIM {snap.running ? 'RUN' : 'HOLD'} ×{snap.speed}</i></span></div>
          <dl>
            <dt>Institutions</dt><dd>{fmtInt(INSTITUTIONS.length)}</dd>
            <dt>Operations live</dt><dd>{liveAgents} / {snap.agents.length}</dd>
            <dt>In flight</dt><dd>{s.active}</dd>
            <dt>Events logged</dt><dd>{fmtInt(s.total)}</dd>
            <dt>Ops per minute</dt><dd>{s.perMin}</dd>
            <dt>Breaches</dt><dd className="crit">{s.byOutcome.breach}</dd>
            <dt>Blocked</dt><dd>{s.byOutcome.blocked}</dd>
            <dt>Sim clock</dt><dd>{fmtTime(snap.clock)}</dd>
          </dl>
        </div>
      </>
    );
  }

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
