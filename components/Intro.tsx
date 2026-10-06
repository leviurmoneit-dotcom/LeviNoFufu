'use client';
import { useEffect, useRef, useState } from 'react';

const TITLE = ['Glühwein', 'Tour 26.'];
const SNOW = Array.from({ length: 28 }, (_, i) => ({ left: (i * 37) % 100, delay: (i * 0.23) % 3, size: 3 + ((i * 7) % 5), dur: 3.2 + ((i * 13) % 20) / 10 }));

/** Einmalige Start-Animation: Tasse fällt herein und dampft, Titel blendet Buchstabe für Buchstabe auf,
 *  dann hebt sich der Vorhang und gibt die App frei. Tippen überspringt. */
export default function Intro({ slogan, onDone }: { slogan: string; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);
  const leave = () => { if (!leaving) setLeaving(true); };
  useEffect(() => {
    const t = setTimeout(leave, 3300);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const finish = () => { if (!done.current) { done.current = true; onDone(); } };
  useEffect(() => { if (!leaving) return; const t = setTimeout(finish, 900); return () => clearTimeout(t); }, [leaving]); // eslint-disable-line react-hooks/exhaustive-deps

  let n = 0;
  return (
    <div className={`intro${leaving ? ' leaving' : ''}`} onClick={leave} role="presentation">
      <div className="intro-glow" />
      <div className="intro-snow" aria-hidden="true">
        {SNOW.map((f, i) => <i key={i} style={{ left: `${f.left}%`, width: f.size, height: f.size, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }} />)}
      </div>
      <div className="intro-stage">
        <svg className="intro-mug" viewBox="0 0 160 170" aria-hidden="true">
          <g className="intro-steam">
            <path d="M58 52 C48 38 68 30 58 14" /><path d="M80 50 C70 34 92 26 80 6" /><path d="M102 52 C92 38 112 30 102 14" />
          </g>
          <g className="intro-cup">
            <ellipse cx="80" cy="160" rx="52" ry="6" className="intro-shadow" />
            <path d="M126 82 c26 0 26 44 0 44" className="intro-handle" />
            <path d="M30 66 h100 l-8 82 a12 12 0 0 1 -12 10 h-60 a12 12 0 0 1 -12 -10 z" className="intro-body" />
            <ellipse cx="80" cy="66" rx="50" ry="10" className="intro-rim" />
            <ellipse cx="80" cy="67" rx="43" ry="7" className="intro-drink" />
            <text x="80" y="122" textAnchor="middle" className="intro-26">26</text>
          </g>
        </svg>
        <h1 className="intro-title" aria-label="Glühwein Tour 26">
          {TITLE.map(word => (
            <span key={word} className="intro-line" aria-hidden="true">
              {[...word].map((ch, i) => <span key={i} className="intro-letter" style={{ animationDelay: `${0.75 + (n++) * 0.045}s` }}>{ch === ' ' ? ' ' : ch}</span>)}
            </span>
          ))}
        </h1>
        <p className="intro-slogan">{slogan}</p>
      </div>
      <span className="intro-skip">Tippen zum Überspringen</span>
    </div>
  );
}
