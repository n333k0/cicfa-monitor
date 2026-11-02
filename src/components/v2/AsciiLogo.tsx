// CICFA in figlet "Caligraphy2" (the artist's reference, 2026-11-02) — rendered as live text.
import logo from './logo.txt?raw';

export default function AsciiLogo({ className = '' }: { className?: string }) {
  return <pre className={`ascii-logo ${className}`} aria-label="CICFA">{logo}</pre>;
}
