export function fmtTime(ms: number): string {
  const d = new Date(ms);
  return d.toISOString().slice(11, 19);
}
export function fmtBytes(n: number): string {
  if (n < 1e3) return `${n} B`;
  if (n < 1e6) return `${(n / 1e3).toFixed(1)} KB`;
  if (n < 1e9) return `${(n / 1e6).toFixed(1)} MB`;
  return `${(n / 1e9).toFixed(2)} GB`;
}
export function fmtInt(n: number): string { return n.toLocaleString('en-US'); }
export function rgba(c: [number, number, number], a = 1): string { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
