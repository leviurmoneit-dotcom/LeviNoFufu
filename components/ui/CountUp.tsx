'use client';
import { useEffect, useRef, useState } from 'react';

/** Zählt beim ersten Sichtbarwerden und bei jeder späteren Änderung zum Zielwert. Bei reduzierter Bewegung sofort fertig. */
export default function CountUp({ value, decimals = 0, duration = 900 }: { value: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const current = useRef(0), seen = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { current.current = value; setShown(value); return; }
    let raf = 0;
    const run = () => {
      const start = performance.now(), a = current.current;
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / duration), v = a + (value - a) * (1 - Math.pow(1 - k, 3));
        current.current = v; setShown(v);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (seen.current) { run(); return () => cancelAnimationFrame(raf); }
    const io = new IntersectionObserver(entries => { if (entries[0].isIntersecting) { seen.current = true; io.disconnect(); run(); } });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);
  return <span ref={ref} className="tabular">{shown.toFixed(decimals).replace('.', ',')}</span>;
}
