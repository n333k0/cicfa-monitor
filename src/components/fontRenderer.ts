// deck.gl TextLayer builds its glyph atlas from each character's *tight* measured box. Safari/iOS
// under-reports those boxes for Helvetica Neue, so letters got their bottoms (or edges) shaved off
// on the map ("CAJA NEGRA" cut at the baseline). This renderer gives every glyph a padded box using the
// font's full ascent/descent, so nothing is ever clipped. Pass as `_getFontRenderer` to TextLayers.
const PAD = 3;   // ≤ deck's default atlas buffer (4) so neighbouring glyphs never overlap

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeFontRenderer({ fontFamily, fontWeight, fontSize }: any) {
  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const mctx = document.createElement('canvas').getContext('2d')!;
  mctx.font = font;
  const ref = mctx.measureText('ÁÉÍÓÚÑgjpqy|');
  const fontAscent = Math.ceil(Math.max(ref.fontBoundingBoxAscent || 0, ref.actualBoundingBoxAscent || 0, fontSize * 0.95)) + 1;
  const fontDescent = Math.ceil(Math.max(ref.fontBoundingBoxDescent || 0, ref.actualBoundingBoxDescent || 0, fontSize * 0.3)) + 1;
  const measure = (char?: string) => {
    if (char === undefined) return { advance: 0, width: 0, ascent: fontAscent, descent: fontDescent };
    const m = mctx.measureText(char);
    const left = Math.min(0, m.actualBoundingBoxLeft ? -m.actualBoundingBoxLeft : 0);
    const right = Math.max(m.width, m.actualBoundingBoxRight || m.width);
    return { advance: m.width, width: Math.ceil(right - left) + 2, ascent: fontAscent, descent: fontDescent };
  };
  const draw = (char: string) => {
    const { width } = measure(char);
    const m = mctx.measureText(char);
    const w = width + PAD * 2, h = fontAscent + fontDescent + PAD * 2;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.font = font; ctx.fillStyle = '#000'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.fillText(char, PAD + 1 + Math.max(0, m.actualBoundingBoxLeft || 0), PAD + fontAscent);
    return { data: ctx.getImageData(0, 0, w, h), left: PAD, top: PAD };
  };
  return { measure, draw };
}
