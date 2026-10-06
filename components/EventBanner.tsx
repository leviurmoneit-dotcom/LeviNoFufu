'use client';
import { useEffect, useState } from 'react';
import { Beer, Clock, Crown, Megaphone, Navigation, PartyPopper, Trophy, X } from 'lucide-react';
import { formatScore, stopNumber, type Stand } from '../lib/data';
import type { EventKind, GroupEvent } from '../lib/reviews';

export const eventIcons: Record<EventKind, typeof Clock> = { treffpunkt: Navigation, countdown: Clock, runde: Beer, sieger: Trophy, text: Megaphone, nasenmeister: Crown, nase: Megaphone };

function remaining(endsAt: string | null, now: number) {
  if (!endsAt) return '';
  const s = Math.max(0, Math.round((new Date(endsAt).getTime() - now) / 1000));
  return s === 0 ? 'Jetzt!' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Ein Event des Admins, groß über der App. Bleibt, bis man es wegtippt oder es abläuft. */
export default function EventBanner({ event, stand, podium, onRoute, onClose }: {
  event: GroupEvent; stand?: Stand; podium: { stand: Stand; avg: number; count: number }[];
  onRoute: (standId: string) => void; onClose: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!event.endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [event.endsAt]);
  const Icon = eventIcons[event.kind];
  const left = remaining(event.endsAt, now);

  return (
    <div className={`event-layer kind-${event.kind}`} role="alertdialog" aria-labelledby="event-title" aria-describedby="event-body">
      {(event.kind === 'sieger' || event.kind === 'nasenmeister') && <div className="confetti" aria-hidden="true">{Array.from({ length: 36 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties} />)}</div>}
      <div className="event-card">
        <button type="button" className="icon-btn event-close" aria-label="Schließen" onClick={onClose}><X size={18} /></button>
        <span className="event-icon">{event.kind === 'nasenmeister' || event.kind === 'nase' ? <span className="event-emoji" aria-hidden="true">👃</span> : event.kind === 'sieger' ? <PartyPopper size={26} /> : <Icon size={26} />}</span>
        <small className="event-from">{event.kind === 'nase' ? `Nasenmeister ${event.createdBy} an alle` : event.createdBy ? `${event.createdBy} an alle` : 'An alle'}</small>
        <h2 id="event-title">{event.title}</h2>
        {event.body && <p id="event-body">{event.body}</p>}
        {left && <strong className="event-timer tabular">{left}</strong>}
        {event.kind === 'treffpunkt' && stand && <p className="event-stand">Stopp {stopNumber(stand.id)} · {stand.name} · {stand.place}</p>}
        {event.kind === 'sieger' && (
          podium.length ? <ol className="event-podium">{podium.slice(0, 3).map((p, i) => (
            <li key={p.stand.id}><span className="medal">{i + 1}</span><strong>{p.stand.name}</strong><b>{formatScore(p.avg)}</b></li>
          ))}</ol> : <p>Noch keine Bewertungen.</p>
        )}
        <div className="event-actions">
          {event.kind === 'treffpunkt' && event.standId && <button type="button" className="btn primary" onClick={() => { onRoute(event.standId!); onClose(); }}><Navigation size={17} /> Route</button>}
          <button type="button" className={`btn ${event.kind === 'treffpunkt' && event.standId ? 'ghost' : 'primary'}`} onClick={onClose}>Alles klar</button>
        </div>
      </div>
    </div>
  );
}
