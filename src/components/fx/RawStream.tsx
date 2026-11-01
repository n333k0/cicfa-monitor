import { useEffect, useRef } from 'react';

// Fast synthetic signal cascade (≈13 lines/sec) — the "text moving fast" layer,
// in the spirit of the vault reference's streaming assembly dump. Pure theatre.
const OPS = ['ENUM', 'MIRROR', 'LOCK', 'SIPHON', 'INJECT', 'BREACH', 'BIND', 'NULL', 'EXFIL', 'PROBE', 'HALT', 'PERSIST', 'SPOOF', 'REDACT'];
const TGT = ['symbolic_architecture', 'curatorial_text', 'provenance_db', 'donor_registry', 'wall_text', 'ticketing_node', 'archive_vault', 'manifest_env', 'mirror_site', 'press_kit', 'board_minutes'];
const HEX = '0123456789ABCDEF';
const hex = (n: number) => Array.from({ length: n }, () => HEX[(Math.random() * 16) | 0]).join('');
const rInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1) + a);

export default function RawStream() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const MAX = 46;
    const id = window.setInterval(() => {
      const line = document.createElement('div');
      line.className = `rs-line${Math.random() > 0.82 ? ' hl' : ''}`;
      line.innerHTML =
        `<span>${hex(3)}</span><span>${rInt(1, 9)}</span>` +
        `<span class="op">${OPS[rInt(0, OPS.length - 1)]}</span>` +
        `<span class="tg">${TGT[rInt(0, TGT.length - 1)]}[${hex(2)}]</span>` +
        `<span>${hex(3)} R</span>`;
      el.appendChild(line);
      while (el.childElementCount > MAX) el.removeChild(el.firstChild!);
    }, 75);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rawstream">
      <div className="rs-head">SIGNAL BUFFER // RAW</div>
      <div className="rs-body" ref={ref} />
    </div>
  );
}
