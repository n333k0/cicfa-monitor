// Thin line icons for the v2 rail (after tombseri.es' right-hand icon column). 18px, 1.2 stroke.
import type { ReactNode } from 'react';
const S = ({ children }: { children: ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
export const IconMap = () => <S><path d="M2 4.5l4.5-2 5 2 4.5-2v11l-4.5 2-5-2-4.5 2z" /><path d="M6.5 2.5v11M11.5 4.5v11" /></S>;
export const IconGlobe = () => <S><circle cx="9" cy="9" r="7" /><ellipse cx="9" cy="9" rx="3" ry="7" /><path d="M2 9h14M3.2 5h11.6M3.2 13h11.6" /></S>;
export const IconNetwork = () => <S><circle cx="4" cy="4.5" r="1.8" /><circle cx="14" cy="5" r="1.8" /><circle cx="9" cy="14" r="1.8" /><path d="M5.6 5.3l6.6.2M5 6l3.2 6.4M13.2 6.6L9.9 12.4" /></S>;
export const IconSat = () => <S><rect x="7" y="7" width="4" height="4" transform="rotate(45 9 9)" /><path d="M5.5 5.5L2.5 2.5M12.5 12.5l3 3M3.8 7.6l3.8-3.8M10.4 14.2l3.8-3.8" /><path d="M13.5 2.5a2 2 0 0 1 2 2" /></S>;
export const IconTilt = () => <S><path d="M1.5 14.5h15L13 7H5z" /><path d="M5.8 10.8h6.4M7.2 7l-1 7.5M10.8 7l1 7.5" /></S>;
export const IconIndex = () => <S><path d="M2.5 4h2M6.5 4h9M2.5 7.3h2M6.5 7.3h9M2.5 10.6h2M6.5 10.6h9M2.5 14h2M6.5 14h9" /></S>;
export const IconPause = () => <S><path d="M6.5 3.5v11M11.5 3.5v11" /></S>;
export const IconPlay = () => <S><path d="M5.5 3.5l8 5.5-8 5.5z" /></S>;
export const IconEject = () => <S><path d="M3.5 10.5L9 4l5.5 6.5z" /><path d="M3.5 14h11" /></S>;
