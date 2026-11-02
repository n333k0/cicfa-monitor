import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { engine } from '../../sim/engine';
import { INSTITUTION_INDEX } from '../../data/institutions';
import { AGENT_INDEX } from '../../data/agents';
import { VECTORS } from '../../data/vectors';
import { useEngine } from '../../sim/useEngine';
import { fmtBytes, fmtTime, rgba } from '../../sim/format';
import { assetStates, deadline, leakSample, nearest, scramble, threat, wikiLink } from '../../sim/intel';
import { loadOsm, osmLink, type OsmState } from '../../sim/osm';
import { esriPatch, camsNear, camSrc, type Cam } from '../../sim/recon';
import { loadWiki, loadPhotos, type WikiFacts, type Photo } from '../../sim/zone';

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
  // every PUBLIC camera in the zone (≤ 2 km), nearest first
  const [cams, setCams] = useState<{ cam: Cam; km: number }[] | undefined>(undefined);
  useEffect(() => {
    if (!inst) return;
    let alive = true;
    setCams(undefined);
    camsNear(inst.lat, inst.lon, 2, 4).then((c) => { if (alive) setCams(c); }).catch(() => { if (alive) setCams([]); });
    return () => { alive = false; };
  }, [inst]);
  // Wikidata record (waits for OSM so it can use its wikidata tag; falls back to a coordinate-checked name search)
  const [wiki, setWiki] = useState<WikiFacts | null | undefined>(undefined);
  const osmQid = osm.status === 'ok' ? osm.data.wikidata : undefined;
  const osmDone = osm.status !== 'loading';
  useEffect(() => {
    if (!inst || !osmDone) return;
    let alive = true;
    setWiki(undefined);
    loadWiki(inst, osmQid).then((w) => { if (alive) setWiki(w); }).catch(() => { if (alive) setWiki(null); });
    return () => { alive = false; };
  }, [inst, osmDone, osmQid]);
  // street-level photographs geotagged around the site (Wikimedia Commons)
  const [photos, setPhotos] = useState<Photo[] | null | undefined>(undefined);
  useEffect(() => {
    if (!inst) return;
    let alive = true;
    setPhotos(undefined);
    loadPhotos(inst.lat, inst.lon).then((p) => { if (alive) setPhotos(p); }).catch(() => { if (alive) setPhotos(null); });
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
        <span className="tag clk-tag" onClick={() => engine.selectInstitution(null)}>✕ CLOSE</span></div>

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

      <div className="pf-sec pf-realblock">
        <div className="pf-h real">Institutional record <span className="tag">// REAL · Wikidata</span></div>
        {wiki === undefined && <div className="mini">querying public record…</div>}
        {wiki === null && <div className="mini">no linked public record</div>}
        {wiki && (() => {
          const rows: [string, ReactNode][] = [];
          const j = (a?: string[]) => a?.join(' · ');
          if (wiki.instanceOf) rows.push(['Type', <b className="wrap">{j(wiki.instanceOf)}</b>]);
          if (wiki.inception) rows.push(['Founded', <b>{wiki.inception}</b>]);
          if (wiki.visitors) rows.push(['Visitors / yr', <b>{wiki.visitors.n.toLocaleString('en-US')}{wiki.visitors.year ? ` (${wiki.visitors.year})` : ''}</b>]);
          if (wiki.collection) rows.push(['Collection', <b>{wiki.collection.toLocaleString('en-US')} WORKS</b>]);
          if (wiki.architect) rows.push(['Architect', <b className="wrap">{j(wiki.architect)}</b>]);
          if (wiki.director) rows.push(['Director', <b className="wrap">{j(wiki.director)}</b>]);
          if (wiki.owner) rows.push(['Owned by', <b className="wrap">{j(wiki.owner)}</b>]);
          if (wiki.style) rows.push(['Style', <b className="wrap">{j(wiki.style)}</b>]);
          return (<>
            {wiki.description && <div className="pf-text real-text">{wiki.description}</div>}
            {rows.map(([k, v], i) => <div key={i} className="pf-row real"><span>{k}</span>{v}</div>)}
            <div className="pf-row real"><span>Public channels</span><span style={{ textAlign: 'right', whiteSpace: 'normal' }}>
              {wiki.instagram && <a href={`https://www.instagram.com/${wiki.instagram}/`} target="_blank" rel="noreferrer">INSTAGRAM ↗ </a>}
              {wiki.x && <a href={`https://x.com/${wiki.x}`} target="_blank" rel="noreferrer">X ↗ </a>}
              <a href={`https://www.wikidata.org/wiki/${wiki.qid}`} target="_blank" rel="noreferrer">{wiki.qid} ↗</a>
            </span></div>
          </>);
        })()}
      </div>

      <div className="pf-sec pf-realblock">
        <div className="pf-h real">Reconnaissance <span className="tag">// REAL · overhead + public CCTV</span></div>
        <div className="recon-frame">
          <img className="recon-img sat" src={esriPatch(inst.lat, inst.lon)} alt="" draggable={false}
            onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
          <div className="recon-reticle" />
          <div className="recon-tag tl">SAT · ESRI WORLD IMAGERY</div>
          <div className="recon-tag br">{inst.lat.toFixed(4)} {inst.lon.toFixed(4)}</div>
        </div>
        <div className="mini" style={{ marginTop: 8 }}>
          {cams === undefined ? 'scanning public camera networks…' : cams.length ? `zone cameras · ${cams.length} public feed${cams.length > 1 ? 's' : ''} within 2 km` : 'no public street camera within 2 km · satellite + street photos only'}
        </div>
        {!!cams?.length && (
          <div className="recon-grid">
            {cams.map(({ cam: c, km }) => (
              <a key={c.id} className="recon-frame sm clk-img" href={c.url} target="_blank" rel="noreferrer" title={`${c.name} — open live still`}>
                <img className="recon-img cam" src={camSrc(c)} alt="" draggable={false} onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
                <div className="recon-reticle thermal" />
                <div className="recon-tag tl">● {c.source}</div>
                <div className="recon-tag br">{km < 1 ? `${Math.round(km * 1000)} M` : `${km.toFixed(1)} KM`}</div>
                <div className="recon-cap">{c.name}</div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="pf-sec pf-realblock">
        <div className="pf-h real">Street level <span className="tag">// REAL · Wikimedia Commons</span></div>
        {photos === undefined && <div className="mini">pulling geotagged photographs…</div>}
        {photos === null && <div className="mini">photo archive unreachable</div>}
        {photos && !photos.length && <div className="mini">no geotagged photographs within 600 m</div>}
        {!!photos?.length && (
          <div className="recon-grid three">
            {photos.slice(0, 6).map((ph) => (
              <a key={ph.page} className="recon-frame sq clk-img" href={ph.page} target="_blank" rel="noreferrer" title={`${ph.title}${ph.author ? ' — ' + ph.author : ''}`}>
                <img className="recon-img street" src={ph.thumb} alt="" loading="lazy" draggable={false} onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
                <div className="recon-tag br">{Number.isFinite(ph.m) ? `${ph.m} M` : ''}{ph.year ? ` · ${ph.year}` : ''}</div>
              </a>
            ))}
          </div>
        )}
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
            <div key={id} className="pf-row clk" onClick={() => engine.selectAgent(id)}>
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
          <div key={d.id} className="pf-row clk" onClick={() => engine.selectInstitution(d.id)}>
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
