'use client';

import { useEffect, useId, useRef } from 'react';
import { Check, Palette, X } from 'lucide-react';

export type ThemeId = 'studio' | 'noel' | 'night' | 'atlas';

type ThemePickerProps = {
  theme: ThemeId;
  onChange: (theme: ThemeId) => void;
  onClose: () => void;
};

const themes: { id: ThemeId; name: string; subtitle: string; description: string }[] = [
  {
    id: 'atlas',
    name: 'Winter Atlas',
    subtitle: 'Die Stadt ist eure Bühne.',
    description: 'Eine große Karte, ruhige Flächen und ein kompaktes Panel für euren nächsten Stopp.',
  },
  {
    id: 'studio',
    name: 'Studio',
    subtitle: 'Ruhig. Klar. iOS.',
    description: 'Helle Flächen, schwebende Navigation und die Tasse als kleiner Designmoment.',
  },
  {
    id: 'noel',
    name: 'Noël',
    subtitle: 'Ein Ticket für den Winter.',
    description: 'Tannengrün, Creme und Cranberry. Große Schrift, Fotokarten und Festivalgefühl.',
  },
  {
    id: 'night',
    name: 'Afterglow',
    subtitle: 'Die Stadt nach Sonnenuntergang.',
    description: 'Dunkles Bordeaux, warmes Licht und eine leuchtende Tasse auf der Abendtour.',
  },
];

function ThemePreview({ theme }: { theme: ThemeId }) {
  return (
    <div className={`look-preview look-preview--${theme}`} aria-hidden="true">
      <div className="look-preview-header"><span>Bielefeld</span><i /></div>
      <div className="look-preview-hero">
        <div className="look-preview-copy">
          <span>WINTER 2026</span>
          <strong>Glühwein<br />Tour <b>26.</b></strong>
        </div>
        <div className="look-preview-cup"><i /><span>26</span></div>
      </div>
      <div className="look-preview-map">
        <svg viewBox="0 0 180 47" preserveAspectRatio="none">
          <path className="look-preview-street" d="M-4 37 47 29 66 -8M30 50 71 18 135 22 185 4M110 55 123 -5M-5 8 47 14 100 6 182 34" />
          <path className="look-preview-route" d="M52 30 77 18 115 23 138 13" />
          <circle cx="52" cy="30" r="4" /><circle cx="115" cy="23" r="5" />
        </svg>
        <span>Deine Route</span>
      </div>
      <div className="look-preview-stop"><i /><span>Nächster Stopp<b>Auf einen Glühwein</b></span><em>→</em></div>
      <div className="look-preview-nav"><b /><i /><i /><i /></div>
    </div>
  );
}

export default function ThemePicker({ theme, onChange, onClose }: ThemePickerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const hintId = useId();
  const radioName = useId();

  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (element && !element.open) element.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="theme-dialog"
      aria-labelledby={titleId}
      aria-describedby={hintId}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="theme-dialog-inner">
        <div className="theme-dialog-heading">
          <div><span className="theme-kicker"><Palette size={13} /> DEIN LOOK</span><h2 id={titleId}>Welche Tour bist du?</h2></div>
          <button type="button" className="theme-close" aria-label="Designauswahl schließen" onClick={onClose}><X size={20} /></button>
        </div>
        <p className="theme-intro" id={hintId}>Vier Looks, dieselbe Runde. Wechsel jederzeit — deine Bewertungen bleiben.</p>
        <fieldset className="theme-options">
          <legend className="sr-only">Design auswählen</legend>
          {themes.map(option => (
            <label key={option.id} className={`theme-option ${theme === option.id ? 'is-selected' : ''}`}>
              <input type="radio" name={radioName} value={option.id} checked={theme === option.id} onChange={() => onChange(option.id)} />
              <ThemePreview theme={option.id} />
              <div className="theme-option-copy">
                <div className="theme-option-title"><h3>{option.name}</h3><span className="theme-check">{theme === option.id && <Check size={14} />}</span></div>
                <strong>{option.subtitle}</strong>
                <p>{option.description}</p>
              </div>
            </label>
          ))}
        </fieldset>
        <div className="theme-dialog-footer">
          <button type="button" className="theme-done" onClick={onClose}>Mit {themes.find(option => option.id === theme)?.name} losziehen <Check size={17} /></button>
          <span>Dein Look wird auf diesem Gerät gespeichert.</span>
        </div>
      </div>
    </dialog>
  );
}
