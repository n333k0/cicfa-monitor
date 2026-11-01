import { engine, ALL_REGIONS, ALL_VECTORS } from '../../sim/engine';
import { useEngine } from '../../sim/useEngine';
import type { Region } from '../../sim/types';

const REGION_LABEL: Record<Region, string> = {
  NA: 'N.America', SA: 'LatAm', EU: 'Europe', ME: 'Mid.East', AF: 'Africa', AS: 'Asia', OC: 'Oceania',
};

export default function Filters() {
  const snap = useEngine();
  return (
    <div className="panel">
      <div className="panel-h">
        <span>Region Filter</span>
        <span style={{ cursor: 'pointer' }} className="tag"
          onClick={() => { ALL_VECTORS.forEach((v) => { if (!snap.filters.vectors.has(v)) engine.toggleVector(v); }); ALL_REGIONS.forEach((r) => { if (!snap.filters.regions.has(r)) engine.toggleRegion(r); }); }}>
          RESET
        </span>
      </div>
      <div className="panel-b">
        <div className="chips">
          {ALL_REGIONS.map((r) => (
            <button key={r} className={`chip ${snap.filters.regions.has(r) ? 'on' : ''}`}
              onClick={() => engine.toggleRegion(r)}>{REGION_LABEL[r]}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
