// Theme switch. v1 = the original terminal look (root URL). v2 = the "Tomb" edition
// (served from /v2/, or any URL with ?v=2): off-black, off-white Helvetica, bold-label /
// regular-value spec hierarchy after tombseri.es, ASCII logo, icon rail, master index.
// Same code + data for both; v2 only changes presentation.
export const V2 = typeof window !== 'undefined'
  && (/\/v2(\/|$)/.test(window.location.pathname) || new URLSearchParams(window.location.search).get('v') === '2');

/** font for deck.gl text (map labels): mono in v1, Helvetica in v2 */
export const MAP_FONT = V2 ? '"Helvetica Neue", Helvetica, Arial, sans-serif' : 'JetBrains Mono, monospace';
/** off-white used for v2 map ink */
export const INK: [number, number, number] = V2 ? [236, 233, 226] : [235, 238, 245];
