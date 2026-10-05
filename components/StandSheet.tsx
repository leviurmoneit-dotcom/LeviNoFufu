'use client';
import { useEffect, useRef } from 'react';
import { ArrowUpRight, Navigation, Pencil, Star, X } from 'lucide-react';
import { criteria, formatScore, stopNumber, type Stand } from '../lib/data';
import { average, type Review } from '../lib/reviews';
import Avatar from './ui/Avatar';
import CountUp from './ui/CountUp';
import Stars from './ui/Stars';

const dateFmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function StandSheet({ stand, reviews, ownId, onRate, onPhoto, onClose }: {
  stand: Stand; reviews: Review[]; ownId: string;
  onRate: () => void; onPhoto: (src: string, label: string) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (el && !el.open) el.showModal();
    return () => { el?.close(); document.body.style.overflow = overflow; };
  }, []);
  const avg = average(reviews.map(r => average(r.values)));
  const perCriterion = criteria.map((_, i) => average(reviews.map(r => r.values[i])));
  const own = reviews.find(r => r.authorId === ownId);
  const sorted = [...reviews].sort((a, b) => (a.authorId === ownId ? -1 : b.authorId === ownId ? 1 : b.updated.localeCompare(a.updated)));
  const route = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stand.place + ', Bielefeld')}&travelmode=walking`;

  return (
    <dialog ref={dialog} className="sheet stand-sheet" aria-labelledby="stand-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-media">
        <img src={stand.image} alt="" />
        <button type="button" className="icon-btn sheet-close" aria-label="Schließen" onClick={onClose}><X size={20} /></button>
        <span className="sheet-number">Stopp {stopNumber(stand.id)}</span>
      </div>
      <div className="sheet-body">
        <h2 id="stand-title">{stand.name}</h2>
        <p className="sheet-place">{stand.place} · {stand.wine}</p>

        <section className="score-panel" aria-label="Gruppenwertung">
          <div className="score-big">
            <strong>{reviews.length ? <CountUp value={avg} decimals={1} /> : '–'}</strong>
            <div>
              <Stars value={avg} size={15} />
              <span>{reviews.length === 0 ? 'Noch keine Bewertung' : reviews.length === 1 ? '1 Bewertung' : `${reviews.length} Bewertungen`}</span>
            </div>
          </div>
          {reviews.length > 0 && (
            <ul className="criteria-bars">
              {criteria.map((c, i) => (
                <li key={c}><span>{c}</span><i><b style={{ width: `${(perCriterion[i] / 5) * 100}%` }} /></i><em>{formatScore(perCriterion[i])}</em></li>
              ))}
            </ul>
          )}
        </section>

        <div className="sheet-actions">
          <a className="btn ghost" href={route} target="_blank" rel="noreferrer"><Navigation size={17} /> Route</a>
          <button type="button" className="btn primary" onClick={onRate}>{own ? <><Pencil size={17} /> Meine Bewertung ändern</> : <><Star size={17} /> Jetzt bewerten</>}</button>
        </div>

        <h3 className="sheet-heading">Alle Bewertungen <span>{reviews.length}</span></h3>
        {sorted.length === 0 && <p className="empty">Sei die erste Person, die hier bewertet.</p>}
        <ol className="review-list">
          {sorted.map(r => (
            <li key={r.id} className="review">
              <header>
                <Avatar name={r.author} size={36} />
                <div><strong>{r.author}{r.authorId === ownId && <span className="you">Du</span>}</strong><time dateTime={r.updated}>{dateFmt.format(new Date(r.updated))}</time></div>
                <span className="review-score">{formatScore(average(r.values))}</span>
              </header>
              <ul className="chips">{criteria.map((c, i) => <li key={c}>{c} <b>{r.values[i]}</b></li>)}</ul>
              {r.comment && <p className="review-comment">{r.comment}</p>}
              {r.photos.length > 0 && (
                <div className="review-photos">
                  {r.photos.map((p, i) => <button key={p.id} type="button" onClick={() => onPhoto(p.src, `${stand.name} · ${r.author}`)}><img src={p.src} alt={`Foto ${i + 1} von ${r.author}`} /></button>)}
                </div>
              )}
            </li>
          ))}
        </ol>

        <details className="sources">
          <summary>Über diesen Stopp · Quellen 2025</summary>
          <p>{stand.description}</p>
          <p>Preise vor Ort prüfen. Die Markierung zeigt den Ortsbereich, keine vermessene Standposition.</p>
          {stand.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={13} /></a>)}
        </details>
      </div>
    </dialog>
  );
}
