// Touch / small-screen helpers shared by the map views.
export const IS_PHONE = typeof window !== 'undefined' && window.innerWidth <= 900;
export const IS_COARSE = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
/** how far (px) from a tiny dot a click/tap still picks it — fingers need a lot more slack */
export const PICK_RADIUS = IS_COARSE || IS_PHONE ? 16 : 10;
