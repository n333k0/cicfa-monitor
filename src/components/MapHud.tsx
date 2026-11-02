// God's-Eye HUD chrome for the MAP view — classification strip, MGRS + lat/lon
// readout, REC clock, live-data ticker and SAT / TILT toggles. Always OPTICAL
// (the artist dropped the CRT/NVG/FLIR/NOIR presets, 2026-11-02).
// Pure overlay (aesthetic theatre, clearly a SIMULATION); the real data
// lives in the layers underneath. Inspired by bilawalsidhu/gods-eye-view.
import { useEffect, useMemo, useState } from 'react';
import { forward } from 'mgrs';

const TICKER = [
  'REFRESHING LIVE DATA // SATELLITE',
  'SYNCING STREET CAMERAS // PUBLIC CCTV',
  'DECONFLICTING OPEN SOURCES',
  'REAL LAYER // OSM · ESRI · TfL',
  'TELEMETRY NOMINAL // NO CONTACT',
];

function mgrsOf(lon: number, lat: number): string {
  try {
    const s = forward([lon, lat], 4); // 10m precision
    const m = s.match(/^(\d{1,2}[C-X])([A-Z]{2})(\d{4})(\d{4})$/);
    return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : s;
  } catch { return '——'; }
}
function dms(v: number, pos: string, neg: string): string {
  const h = v >= 0 ? pos : neg, a = Math.abs(v);
  const d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d) * 60 - m) * 60;
  return `${d}°${String(m).padStart(2, '0')}'${s.toFixed(2).padStart(5, '0')}"${h}`;
}

interface Props {
  lon: number; lat: number; zoom: number;
  sat: boolean; onSat: () => void;
  tilt: boolean; onTilt: () => void;
}

export default function MapHud({ lon, lat, zoom, sat, onSat, tilt, onTilt }: Props) {
  const [clock, setClock] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z'), 1000);
    const k = setInterval(() => setTick((n) => n + 1), 2400);
    return () => { clearInterval(t); clearInterval(k); };
  }, []);
  const wrappedLon = ((((lon + 180) % 360) + 360) % 360) - 180;
  const mgrs = useMemo(() => mgrsOf(wrappedLon, lat), [wrappedLon, lat]);

  return (
    <div className="ghud">
      {/* classification strip, top of the map band */}
      <div className="ghud-class">
        <span className="ghud-rec"><i /> REC {clock}</span>
        <span className="ghud-cls">CICFA // SI-TK // DWG-CICFA-01 · OPTICAL · NOFORN · SIMULATION</span>
        <span className="ghud-tick">{TICKER[tick % TICKER.length]}</span>
      </div>

      {/* coordinate readout */}
      <div className="ghud-coord">
        <div>MGRS {mgrs}</div>
        <div>{dms(lat, 'N', 'S')}  {dms(wrappedLon, 'E', 'W')}</div>
        <div className="ghud-dim">ALT {(Math.round(591657550 / 2 ** zoom)).toLocaleString('en-US')} M · Z{zoom.toFixed(1)}</div>
      </div>

      {/* control cluster, bottom of the map band */}
      <div className="ghud-controls">
        <button className={sat ? 'on' : ''} onClick={onSat} title="Overhead imagery (S)">◹ SAT</button>
        <button className={tilt ? 'on' : ''} onClick={onTilt} title="Oblique view (T)">⛰ TILT</button>
      </div>
    </div>
  );
}
