// v2 right-hand icon rail: views, SAT / TILT, master index, hold/resume. Every icon shows its
// label on rollover (artist rule: clickable things must say they are clickable).
import { useEffect, useState, type ReactNode } from 'react';
import { engine } from '../../sim/engine';
import { useEngine } from '../../sim/useEngine';
import { IconGlobe, IconIndex, IconMap, IconNetwork, IconPause, IconPlay, IconSat, IconTilt } from './icons';

function Btn({ on, label, onClick, children }: { on?: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return <button className={`rail-btn ${on ? 'on' : ''}`} onClick={onClick} aria-label={label}>{children}<span className="rail-tip">{label}</span></button>;
}

export default function IconRail({ onIndex }: { onIndex: () => void }) {
  const snap = useEngine();
  const [map, setMap] = useState({ sat: false, tilt: false });
  useEffect(() => {
    const f = (e: Event) => setMap((e as CustomEvent).detail);
    window.addEventListener('cicfa:mapstate', f);
    return () => window.removeEventListener('cicfa:mapstate', f);
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const flat = snap.viewMode === 'flat';
  return (
    <div className="irail">
      <Btn on={flat} label="Map" onClick={() => engine.setViewMode('flat')}><IconMap /></Btn>
      <Btn on={snap.viewMode === 'globe'} label="Globe" onClick={() => engine.setViewMode('globe')}><IconGlobe /></Btn>
      <Btn on={snap.viewMode === 'ontology'} label="Network" onClick={() => engine.setViewMode('ontology')}><IconNetwork /></Btn>
      <i className="rail-sep" />
      {flat && <Btn on={map.sat} label="Satellite (S)" onClick={() => w.CICFA_sat?.()}><IconSat /></Btn>}
      {flat && <Btn on={map.tilt} label="Tilt (T)" onClick={() => w.CICFA_tilt?.()}><IconTilt /></Btn>}
      <Btn label="Master index" onClick={onIndex}><IconIndex /></Btn>
      <Btn label={snap.running ? 'Hold simulation' : 'Resume simulation'} onClick={() => engine.toggleRunning()}>{snap.running ? <IconPause /> : <IconPlay />}</Btn>
    </div>
  );
}
