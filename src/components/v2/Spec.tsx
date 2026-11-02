// v2 spec block: the run's headline numbers as Tomb-style bold label · value rows. Sits at the
// top of the right column panel, mirroring the ASCII mark in the left one (one box, one edge).
import { useEffect, useState } from 'react';
import { useEngine } from '../../sim/useEngine';
import { fmtBytes, fmtInt, fmtTime } from '../../sim/format';
import { INSTITUTIONS } from '../../data/institutions';

export default function Spec() {
  const snap = useEngine();
  const [wall, setWall] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setWall(Date.now()), 1000); return () => clearInterval(t); }, []);
  const s = snap.stats;
  const live = snap.agents.filter((a) => a.status === 'live' || a.status === 'degraded').length;
  return (
    <div className="v2-spec">
      <div className="v2-spec-h"><b>CICFA<br />DWG-01</b><span className="v2-clock">{fmtTime(wall)} UTC</span></div>
      <dl>
        <dt>Institutions</dt><dd>{fmtInt(INSTITUTIONS.length)}</dd>
        <dt>Operations live</dt><dd>{live} / {snap.agents.length}</dd>
        <dt>In flight</dt><dd>{s.active}</dd>
        <dt>Events logged</dt><dd>{fmtInt(s.total)}</dd>
        <dt>Ops per minute</dt><dd>{s.perMin}</dd>
        <dt>Breaches</dt><dd className="crit">{s.byOutcome.breach}</dd>
        <dt>Exposed</dt><dd>{s.byOutcome.exposed}</dd>
        <dt>Contained</dt><dd>{s.byOutcome.contained}</dd>
        <dt>Blocked</dt><dd>{s.byOutcome.blocked}</dd>
        <dt>Exfiltrated</dt><dd>{fmtBytes(s.bytesExfil)}</dd>
      </dl>
    </div>
  );
}
