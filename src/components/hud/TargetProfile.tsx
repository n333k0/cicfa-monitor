import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { engine } from '../../sim/engine';
import { INSTITUTION_INDEX } from '../../data/institutions';
import { AGENT_INDEX } from '../../data/agents';
import { VECTORS } from '../../data/vectors';
import { useEngine } from '../../sim/useEngine';
import { fmtBytes, fmtTime, rgba } from '../../sim/format';
import { assetStates, deadline, leakSample, nearest, scramble, threat, wikiLink } from '../../sim/intel';
import { loadOsm, osmLink, type OsmState } from '../../sim/osm';

// TARGET PROFILE — the full surveillance dossier that opens when an institution is clicked.
// Real: name, place, coordinates, public links. Simulated: everything about the attack.
export default function TargetProfile() {
  const snap = useEngine();
  const inst = snap.selectedInstitution ? INSTITUTION_INDEX[snap.selectedInstitution] : null;
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 1000); return () => clearInterval(t); }, []);
  const links = useMemo(() => (inst ? nearest(inst, 6) : []), [inst]);
  const [osm, setOsm] = useState<OsmState>({ status: 'loading' });
  useEffect(() => {
    if (!inst) return;
    let alive = true;
    setOsm({ status: 'loading' });
    loadOsm(inst).then((s) => { if (alive) setOsm(s); });
    return () => { alive = false; };
  }, [inst]);
  if (!inst) return null;

  const hist = engine.historyFor(inst.id);
  const strikes = snap.hits[inst.id] ?? 0;
  const count = (o: string) => hist.filter((e) => e.outcome === o).length;
  const breaches = count('breach') + count('exposed');
  const th = threat(strikes, breaches);
  const live = engine.getActive().filter((e) => e.targetId === inst.id);
  const status = live.length ? `UNDER ACTIVE OPERATION · ${live.length} INBOUND` : strikes ? 'MONITORED · COMPROMISE SUSPECTED' : 'MONITORED · NO CONTACT';
  const exfil = hist.filter((e) => e.vector === 'exfiltration' && (e.outcome === 'breach' || e.outcome === 'exposed')).reduce((s, e) => s + e.payloadBytes, 0);
  const assets = assetStates(hist);
  const lost = assets.filter((a) => a.won).map((a) => a.asset);
  const leak = leakSample(inst.id, lost);
  const dl = deadline(inst.id, Date.now());
  const aggressors = [...hist.reduce((m, e) => m.set(e.agentId, (m.get(e.agentId) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const maxAgg = Math.max(1, ...aggressors.map((a) => a[1]));
  const blurb = inst.blurb ?? `${inst.kind} in ${inst.city}, ${inst.country}.`;
  const approx = inst.tags?.includes('approx-coords');

  return (
    <div className="profile panel">
      <div className="panel-h"><span>Target Profile <span className="tag">// {inst.id.toUpperCase()}</span></span>
        <span className="tag" style={{ cursor: 'pointer' }} onClick={() => engine.selectInstitution(null)}>✕ CLOSE</span></div>

      <div className="pf-name">{inst.name}</div>
      <div className="mini">{inst.kind} · {inst.city} · {inst.country}{inst.scene ? ` · ${inst.scene}` : ''}</div>
      <div className="mini">{inst.lat.toFixed(4)}, {inst.lon.toFixed(4)}{approx ? ' · ±APPROX' : ''} · PROMINENCE {'◆'.repeat(inst.prominence)}{'◇'.repeat(5 - inst.prominence)}</div>

      <div className="pf-sec pf-realblock">
        <div className="pf-h real">Open source intelligence <span className="tag">// REAL · OpenStreetMap</span></div>
        {osm.status === 'loading' && <div className="mini">querying open sources…</div>}
        {osm.status === 'error' && <div className="mini">open source unreachable ({osm.message})</div>}
        {osm.status === 'none' && <div className="mini">no matching record in OpenStreetMap</div>}
        {osm.status === 'ok' && (() => {
          const d = osm.data;
          const rows: [string, ReactNode][] = [];
          if (d.openNow) rows.push(['Status now', <b className={d.openNow === 'OPEN' ? 'open' : 'shut'}>{d.openNow === 'OPEN' ? '● OPEN NOW' : '○ CLOSED NOW'}</b>]);
          if (d.openingHours) rows.push(['Hours', <b style={{ whiteSpace: 'normal', textAlign: 'right' }}>{d.openingHours}</b>]);
          if (d.address) rows.push(['Address', <b style={{ whiteSpace: 'normal', textAlign: 'right' }}>{d.address}</b>]);
          if (d.operator) rows.push(['Operator', <b style={{ whiteSpace: 'normal', textAlign: 'right' }}>{d.operator}</b>]);
          if (d.startDate) rows.push(['Established', <b>{d.startDate}</b>]);
          if (d.wheelchair) rows.push(['Accessibility', <b>{d.wheelchair === 'yes' ? 'WHEELCHAIR ✓' : d.wheelchair.toUpperCase()}</b>]);
          if (d.fee) rows.push(['Entry', <b>{d.fee === 'yes' ? 'TICKETED' : d.fee === 'no' ? 'FREE' : d.fee.toUpperCase()}</b>]);
          if (d.heritage) rows.push(['Listing', <b>PROTECTED HERITAGE</b>]);
          if (d.phone) rows.push(['Phone', <b>{d.phone}</b>]);
          return (<>
            {rows.map(([k, v], i) => <div key={i} className="pf-row real"><span>{k}</span>{v}</div>)}
            {d.description && <div className="pf-text real-text">{d.description}</div>}
            <div className="pf-row real"><span>Links</span><span style={{ textAlign: 'right', whiteSpace: 'normal' }}>
              {d.website && <a href={d.website} target="_blank" rel="noreferrer">SITE ↗ </a>}
              {d.wikidata && <a href={`https://www.wikidata.org/wiki/${d.wikidata}`} target="_blank" rel="noreferrer">WIKIDATA ↗ </a>}
              <a href={osmLink(inst)} target="_blank" rel="noreferrer">OSM ↗</a>
            </span></div>
          </>);
        })()}
      </div>

      <div className="pf-sec">
        <div className="pf-h">Simulated operation <span className="tag">// THEATRE · SIM</span></div>
        <div className="pf-row"><span>Threat level</span><b className={`lv${th.lvl}`}>{th.level}</b></div>
        <div className={`pf-bar lv${th.lvl}`}>{th.bar}</div>
        <div className="pf-row"><span>Status</span><b className={live.length ? 'lv4' : ''}>{status}</b></div>
        <div className="pf-row"><span>Deadline</span><b className="lv4">{dl.done ? 'NOTHING HAPPENED' : `${dl.text} → NOTHING`}</b></div>
        <div className="pf-row"><span>Strikes · breach · contained · blocked</span><b>{strikes} · {breaches} · {count('contained')} · {count('blocked')}</b></div>
        <div className="pf-row"><span>Exfiltrated (symbolic)</span><b className="mag">{fmtBytes(exfil)}</b></div>
      </div>

      <div className="pf-sec">
        <div className="pf-h">Institutional language {breaches ? '// degrading' : '// intact'}</div>
        <div className="pf-text">{scramble(blurb, Math.min(0.55, breaches * 0.07), tick)}</div>
      </div>

      <div className="pf-sec">
        <div className="pf-h">Symbolic assets</div>
        {assets.map((a) => (
          <div key={a.asset} className="pf-row"><span>{a.asset}</span><b className={a.won ? 'lv4' : a.n ? '' : 'dim'}>{a.state}{a.n ? ` ×${a.n}` : ''}</b></div>
        ))}
      </div>

      <div className="pf-sec">
        <div className="pf-h">Aggressors</div>
        {aggressors.length ? aggressors.map(([id, n]) => {
          const ag = AGENT_INDEX[id];
          return (
            <div key={id} className="pf-row" style={{ cursor: 'pointer' }} onClick={() => engine.selectAgent(id)}>
              <span style={{ color: rgba(ag?.color ?? [200, 200, 200]) }}>{ag?.handle ?? id}</span>
              <b>{'|'.repeat(Math.max(1, Math.round((n / maxAgg) * 14)))} {n}</b>
            </div>
          );
        }) : <div className="mini">no operation has made contact</div>}
      </div>

      <div className="pf-sec">
        <div className="pf-h">Attack log <span className="tag">// last {Math.min(10, hist.length)}</span></div>
        {live.map((e) => (
          <div key={e.id} className="pf-log"><span>{fmtTime(e.startedAt)}</span><span style={{ color: rgba(VECTORS[e.vector].color) }}>{VECTORS[e.vector].label}</span><span>{AGENT_INDEX[e.agentId]?.handle}</span><b className="lv4">INBOUND</b></div>
        ))}
        {hist.slice(0, 10).map((e) => (
          <div key={e.id} className="pf-log"><span>{fmtTime(e.startedAt)}</span><span style={{ color: rgba(VECTORS[e.vector].color) }}>{VECTORS[e.vector].label}</span><span>{AGENT_INDEX[e.agentId]?.handle}</span><b className={`o ${e.outcome}`}>{e.outcome}</b></div>
        ))}
        {!hist.length && !live.length && <div className="mini">no recorded activity yet</div>}
      </div>

      <div className="pf-sec">
        <div className="pf-h">Leak sample <span className="tag">// unverified · fiction</span></div>
        {lost.length ? leak.map((l) => (
          <div key={l.off} className="pf-log"><span>{l.off}</span><span>{l.asset}</span><span>{l.hash}</span><b>{l.tag}</b></div>
        )) : <div className="mini">no exfiltration confirmed</div>}
      </div>

      <div className="pf-sec">
        <div className="pf-h">Linked nodes <span className="tag">// adjacency</span></div>
        {links.map(({ inst: d, km }) => (
          <div key={d.id} className="pf-row" style={{ cursor: 'pointer' }} onClick={() => engine.selectInstitution(d.id)}>
            <span className="pf-link">{d.name}</span><b>{km < 10 ? km.toFixed(1) : Math.round(km)} KM{(snap.hits[d.id] ?? 0) ? ` · ${snap.hits[d.id]}✕` : ''}</b>
          </div>
        ))}
      </div>

      <div className="pf-sec">
        <div className="pf-h">Open source</div>
        <div className="pf-row"><a href={osmLink(inst)} target="_blank" rel="noreferrer">OPENSTREETMAP ↗</a><a href={wikiLink(inst)} target="_blank" rel="noreferrer">WIKIPEDIA ↗</a></div>
      </div>
    </div>
  );
}
