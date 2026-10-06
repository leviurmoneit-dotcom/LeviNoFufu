import { criteria, stopNumber, type Stand } from './data';
import { average, type GroupMeta, type Review } from './reviews';

const cell = (v: string | number) => { const s = String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const num = (n: number) => n.toFixed(1).replace('.', ',');

/** Datei auf dem Gerät speichern (am Handy öffnet sich das Teilen-/Speichern-Menü). */
export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const stamp = () => new Date().toISOString().slice(0, 10);

/** Alle Bewertungen als Tabelle (Semikolon + BOM, damit Excel und Numbers Umlaute und Spalten richtig lesen). */
export function exportCsv(group: string, stands: Stand[], reviews: Review[]) {
  const head = ['Stopp', 'Stand', 'Ort', 'Person', ...criteria, 'Schnitt', 'Notiz', 'Datum', 'Fotos'];
  const order = (r: Review) => stands.findIndex(s => s.id === r.standId);
  const rows = [...reviews].sort((a, b) => order(a) - order(b) || a.author.localeCompare(b.author)).map(r => {
    const s = stands.find(x => x.id === r.standId);
    return [s ? stopNumber(s.id) : '', s?.name ?? r.standId, s?.place ?? '', r.author, ...r.values, num(average(r.values)), r.comment,
      new Date(r.updated).toLocaleString('de-DE'), r.photos.filter(p => !p.src.startsWith('data:')).map(p => p.src).join(' ')];
  });
  const ranking = stands.map(s => { const rs = reviews.filter(r => r.standId === s.id); return { s, n: rs.length, avg: average(rs.map(r => average(r.values))) }; })
    .filter(x => x.n).sort((a, b) => b.avg - a.avg);
  const lines = [head, ...rows].map(r => r.map(cell).join(';'));
  lines.push('', 'Ranking', ['Platz', 'Stand', 'Schnitt', 'Bewertungen'].join(';'), ...ranking.map((x, i) => [i + 1, x.s.name, num(x.avg), x.n].map(cell).join(';')));
  download(`gluehwein-tour-${group}-${stamp()}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
}

/** Vollständige Sicherung für Admins: Stände, Bewertungen und Nasenmeister als JSON. */
export function exportBackup(group: string, stands: Stand[], reviews: Review[], meta: GroupMeta) {
  const data = { app: 'Glühwein Tour 26', group, exportedAt: new Date().toISOString(), meta, stands, reviews };
  download(`gluehwein-tour-${group}-backup-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json');
}
