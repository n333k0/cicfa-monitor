import { useEffect, useRef } from 'react';

// Ported from vault/ASCII terminal Page2.html — thin vertical glitch stripes
// (crimson/pink/magenta, pulsing, screen-blend) + occasional horizontal tears.
const COLORS = ['var(--crimson)', 'var(--pink)', 'var(--magenta)'];
const rInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1) + a);

export default function GlitchFX() {
  const vRef = useRef<HTMLDivElement>(null);
  const hRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = vRef.current, h = hRef.current;
    if (!v || !h) return;

    const clusters = [
      { x: 9, c: 4, s: 2 }, { x: 12, c: 2, s: 1 },
      { x: 54, c: 5, s: 3 }, { x: 58, c: 2, s: 1 }, { x: 80, c: 1, s: 0 },
    ];
    function stripes() {
      v!.innerHTML = '';
      for (const cl of clusters) {
        for (let i = 0; i < cl.c; i++) {
          const s = document.createElement('div');
          s.className = 'v-stripe';
          s.style.width = `${Math.random() > 0.8 ? rInt(2, 3) : 1}px`;
          s.style.left = `calc(${cl.x}% + ${(Math.random() * cl.s * 2) - cl.s}px)`;
          s.style.backgroundColor = COLORS[rInt(0, 2)];
          s.style.animationDuration = `${rInt(5, 20) / 10}s`;
          s.style.animationDelay = `${rInt(0, 10) / 10}s`;
          const top = rInt(42, 72);
          s.style.top = `${top}vh`;
          s.style.height = `${100 - top}vh`;
          v!.appendChild(s);
        }
      }
    }
    stripes();
    const si = window.setInterval(stripes, 9000);

    let to = 0;
    function tear() {
      const t = document.createElement('div');
      t.className = 'h-tear';
      t.style.top = `${rInt(8, 92)}%`;
      t.style.animation = `tear ${rInt(2, 6) / 10}s cubic-bezier(0.1,0.9,0.2,1) forwards`;
      h!.appendChild(t);
      window.setTimeout(() => t.remove(), 650);
    }
    function loop() { to = window.setTimeout(() => { tear(); loop(); }, Math.round(Math.random() * 3200) + 500); }
    loop();

    return () => { clearInterval(si); clearTimeout(to); };
  }, []);

  return (<>
    <div className="glitch-v" ref={vRef} />
    <div className="glitch-h" ref={hRef} />
  </>);
}
