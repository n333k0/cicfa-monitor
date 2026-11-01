import { engine } from '../../sim/engine';
import { VECTOR_LIST } from '../../data/vectors';
import { useEngine } from '../../sim/useEngine';
import { fmtBytes, rgba } from '../../sim/format';

const SPEEDS = [0.5, 1, 2, 5];

export default function Dock() {
  const snap = useEngine();
  const ticker = snap.log.slice(0, 18).map((e) => `${e.line} // ${e.outcome ?? 'inflight'}`);

  return (
    <div className="dock">
      <div className="panel ticker">
        <div className="rail">
          {[...ticker, ...ticker].map((t, k) => <span key={k}><b>▚</b> {t}</span>)}
        </div>
      </div>
      <div className="panel transport">
        <button className="btn primary" title={snap.running ? 'hold' : 'resume'} onClick={() => engine.toggleRunning()}>
          {snap.running ? '❚❚' : '▶'}
        </button>
        <div className="spd">
          {SPEEDS.map((s) => (
            <button key={s} className={snap.speed === s ? 'on' : ''} onClick={() => engine.setSpeed(s)}>×{s}</button>
          ))}
        </div>
        <div className="legend">
          {VECTOR_LIST.slice(0, 10).map((v) => (
            <i key={v.id}><b style={{ background: rgba(v.color) }} />{v.label}</i>
          ))}
        </div>
        <div className="bytes">EXFIL TOTAL <b>{fmtBytes(snap.stats.bytesExfil)}</b></div>
      </div>
    </div>
  );
}
