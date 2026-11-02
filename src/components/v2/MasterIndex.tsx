// v2 MASTER INDEX — every institution as a numbered catalogue, laid out like the artist's
// reference spread ("Tomb Index / Master Index": number · roman · NAME · category).
// Two pages of 89 rows per spread; ◂ ▸ / arrow keys turn spreads; click a name to open its
// Target Profile. Opened from the icon rail.
import { useEffect, useMemo, useState } from 'react';
import { INSTITUTIONS } from '../../data/institutions';
import { engine } from '../../sim/engine';
import { useEngine } from '../../sim/useEngine';
import { roman } from './roman';

const PER_PAGE = 89;
const ORDER = [...INSTITUTIONS].sort((a, b) => b.prominence - a.prominence || a.name.localeCompare(b.name));

export default function MasterIndex({ open, onClose }: { open: boolean; onClose: () => void }) {
  const snap = useEngine();
  const [spread, setSpread] = useState(0);
  const spreads = Math.ceil(ORDER.length / (PER_PAGE * 2));
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setSpread((s) => Math.min(spreads - 1, s + 1));
      else if (e.key === 'ArrowLeft') setSpread((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose, spreads]);
  const pages = useMemo(() => {
    const start = spread * PER_PAGE * 2;
    return [ORDER.slice(start, start + PER_PAGE), ORDER.slice(start + PER_PAGE, start + PER_PAGE * 2)].map((rows, p) => rows.map((d, i) => ({ d, n: start + p * PER_PAGE + i + 1 })));
  }, [spread]);
  if (!open) return null;
  const hits = snap.hits;

  return (
    <div className="mindex" onClick={onClose}>
      {pages.map((rows, p) => (
        <div key={p} className="mi-page" onClick={(e) => e.stopPropagation()}>
          <div className="mi-head">
            <b>CICFA Index</b>
            {p === 1 ? <span className="mi-folio">{String(spread * 2 + 2).padStart(2, '0')}</span> : <span className="mi-ctl">
              <button className="mi-arrow" disabled={spread === 0} onClick={() => setSpread((s) => s - 1)} aria-label="Previous spread">◂</button>
              <span><b>{String(spread + 1).padStart(2, '0')}</b> <i>of {String(spreads).padStart(2, '0')}</i></span>
              <button className="mi-arrow" disabled={spread >= spreads - 1} onClick={() => setSpread((s) => s + 1)} aria-label="Next spread">▸</button>
            </span>}
            {p === 1 && <button className="mi-close" onClick={onClose} aria-label="Close index">✕</button>}
          </div>
          <div className="mi-body">
            <div className="mi-side">{p === 0 && spread === 0 ? <b>Master Index</b> : null}</div>
            <div className="mi-rows">
              {rows.map(({ d, n }) => {
                const h = hits[d.id] ?? 0;
                return (
                  <div key={d.id} className="mi-row clk" onClick={() => { engine.selectInstitution(d.id); onClose(); }}>
                    <span className="mi-n">{n}</span>
                    <span className="mi-r">{roman(n)}</span>
                    <span className="mi-name">{d.name.toUpperCase()}</span>
                    <span className="mi-cat">{d.city.toUpperCase()}</span>
                    <span className={`mi-h ${h ? 'hit' : ''}`}>{h ? `${h}✕` : d.kind.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {p === 0 && <span className="mi-folio bottom">{String(spread * 2 + 1).padStart(2, '0')}</span>}
        </div>
      ))}
    </div>
  );
}
