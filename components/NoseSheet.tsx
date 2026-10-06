'use client';
import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';

const presets = [
  { title: 'Nasen-Alarm! 👃', body: 'Alle mal tief einatmen: Zimt, Nelke oder Orange?' },
  { title: 'Blindprobe!', body: 'Augen zu, Nase auf. Wer errät, was im Becher ist?' },
  { title: 'Prost! 🍷', body: 'Der Nasenmeister erhebt das Glas.' },
  { title: 'Nachschub!', body: 'Der Nasenmeister hat Durst. Wer holt die nächste Runde?' },
];

/** Der Nasenmeister schickt eine kleine Ansage an alle. */
export default function NoseSheet({ onSend, onClose }: { onSend: (title: string, body: string) => Promise<void>; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState('');
  useEffect(() => {
    const el = dialog.current, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (el && !el.open) el.showModal();
    return () => { el?.close(); document.body.style.overflow = overflow; };
  }, []);
  async function send(t: string, b: string) {
    if (!t.trim()) return;
    setBusy(t);
    try { await onSend(t.trim(), b); onClose(); } finally { setBusy(''); }
  }
  return (
    <dialog ref={dialog} className="sheet nose-sheet" aria-labelledby="nose-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-body">
        <div className="sheet-top"><h2 id="nose-title"><span aria-hidden="true">👃</span> Nasenmeister spricht</h2><button type="button" className="icon-btn" aria-label="Schließen" onClick={onClose}><X size={20} /></button></div>
        <p className="muted">Deine Ansage erscheint sofort bei allen in der Gruppe.</p>
        <div className="nose-presets">
          {presets.map(p => (
            <button key={p.title} type="button" disabled={!!busy} onClick={() => send(p.title, p.body)}>
              <strong>{busy === p.title ? <LoaderCircle className="spin" size={15} /> : null}{p.title}</strong><small>{p.body}</small>
            </button>
          ))}
        </div>
        <form className="nose-free" onSubmit={e => { e.preventDefault(); send(title, ''); }}>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} placeholder="Eigene Ansage …" aria-label="Eigene Ansage" />
          <button type="submit" className="btn primary small" disabled={!title.trim() || !!busy}>Senden</button>
        </form>
      </div>
    </dialog>
  );
}
