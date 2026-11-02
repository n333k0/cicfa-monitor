// v2 on phones: the side columns become four collapsible bottom tabs (sheet slides up over the
// map; tap the tab again — or the map — to collapse). Desktop never renders these (CSS-gated).
import AsciiLogo from './AsciiLogo';

export type MTab = 'none' | 'lab' | 'targets' | 'telemetry' | 'stream';
const TABS: [Exclude<MTab, 'none'>, string][] = [['lab', 'Lab'], ['targets', 'Targets'], ['telemetry', 'Telemetry'], ['stream', 'Stream']];

export function MobileHead() {
  return <div className="mhead"><AsciiLogo /></div>;
}

export default function MobileTabs({ tab, onTab }: { tab: MTab; onTab: (t: MTab) => void }) {
  return (
    <nav className="mtabs" aria-label="Panels">
      {TABS.map(([id, label]) => (
        <button key={id} className={tab === id ? 'on' : ''} aria-expanded={tab === id}
          onClick={() => onTab(tab === id ? 'none' : id)}>
          {label}<i>{tab === id ? '▾' : '▴'}</i>
        </button>
      ))}
    </nav>
  );
}
