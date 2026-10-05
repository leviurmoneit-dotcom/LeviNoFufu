'use client';
import type { ReactNode, PointerEvent } from 'react';

/** Karte mit einem Lichtkegel, der dem Finger bzw. der Maus folgt. */
export default function SpotlightCard({ children, className = '', onClick, label }: { children: ReactNode; className?: string; onClick?: () => void; label?: string }) {
  const move = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  if (onClick) return <button type="button" className={`spotlight ${className}`} onPointerMove={move} onClick={onClick} aria-label={label}>{children}</button>;
  return <div className={`spotlight ${className}`} onPointerMove={move}>{children}</div>;
}
