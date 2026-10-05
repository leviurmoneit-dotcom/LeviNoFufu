'use client';
import { useEffect, useRef } from 'react';

// Leichter Schnee für die dunklen Looks. Pausiert außerhalb des Bildschirms und bei reduzierter Bewegung.
export default function Snowfall({ count = 36 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, visible = true, last = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const flakes = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 1.8, v: 8 + Math.random() * 16, d: Math.random() * Math.PI * 2 }));
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const frame = (t: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (const f of flakes) {
        f.y += (f.v * dt) / h; f.d += dt * 0.8;
        if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
        ctx.beginPath();
        ctx.arc(f.x * w + Math.sin(f.d) * 6, f.y * h, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const io = new IntersectionObserver(e => { visible = e[0].isIntersecting; if (visible) start(); });
    io.observe(canvas);
    const vis = () => { if (!document.hidden) start(); };
    document.addEventListener('visibilitychange', vis);
    start();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, [count]);
  return <canvas ref={ref} className="snowfall" aria-hidden="true" />;
}
