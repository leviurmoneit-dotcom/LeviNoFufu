'use client';
import { useEffect, useState } from 'react';

/** Netzdiagramm der fünf Kriterien: Gruppe als Fläche, eigene Bewertung als Linie. Wächst beim Öffnen auf. */
export default function Radar({ labels, group, own, size = 220 }: { labels: string[]; group: number[]; own?: number[]; size?: number }) {
  const [grow, setGrow] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setGrow(1); return; }
    let raf = 0; const start = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - start) / 700); setGrow(1 - (1 - k) ** 3); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const c = size / 2, r = size / 2 - 34, n = labels.length;
  const pt = (i: number, v: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v]; };
  const poly = (values: number[], k = 1) => values.map((v, i) => pt(i, (v / 5) * k).map(x => x.toFixed(1)).join(',')).join(' ');
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Netzdiagramm: ${labels.map((l, i) => `${l} ${group[i].toFixed(1)}`).join(', ')}`}>
      {[1, 2, 3, 4, 5].map(s => <polygon key={s} points={poly(Array(n).fill(s))} className="radar-ring" />)}
      {labels.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={c} y1={c} x2={x} y2={y} className="radar-axis" />; })}
      <polygon points={poly(group, grow)} className="radar-group" />
      {own && <polygon points={poly(own, grow)} className="radar-own" />}
      {group.map((v, i) => { const [x, y] = pt(i, (v / 5) * grow); return <circle key={i} cx={x} cy={y} r="3" className="radar-dot" />; })}
      {labels.map((l, i) => { const [x, y] = pt(i, 1.2); return <text key={l} x={x} y={y} textAnchor={Math.abs(x - c) < 4 ? 'middle' : x > c ? 'start' : 'end'} dominantBaseline="middle" className="radar-label">{l.split(' ')[0].replace('Schlotzigkeitsfaktor', 'Schlotzig')}</text>; })}
    </svg>
  );
}
