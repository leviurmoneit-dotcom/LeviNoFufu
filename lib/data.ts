export type TourPhoto = { id: string; src: string; name: string };
export type Rating = { values: number[]; comment: string; photos: TourPhoto[]; updated: string };
export type TourState = { name: string; ratings: Record<string, Rating> };
export const initialState: TourState = { name: 'Levi', ratings: {} };
export const criteria = ['Geschmack', 'Temperatur', 'Atmosphäre', 'Preis / Leistung', 'Schlotzigkeitsfaktor'];
export type StandSource = { title: string; url: string };
export type Stand = {
 id: string; name: string; place: string; wine: string; description: string;
 coords: [number, number]; image: string; sources: StandSource[];
};
const marketing: StandSource = { title: 'Bielefeld Marketing · 04.11.2025', url: 'https://www.bielefeld-marketing.de/pressemeldung/bielefeld-laedt-weihnachtsmarkt' };

// Season IDs keep ratings of the former invented stands separate.
// Coordinates identify the documented square/street, not the exact stall.
export const stands: Stand[] = [
 {
  id: 'wm2025-lions', name: 'Lions-Häuschen', place: 'Alter Markt',
  wine: 'Roter & weißer Glühwein', description: 'Glühwein für den guten Zweck. 2025 gab es erstmals auch weißen Glühwein sowie alkoholfreien Claire de Lune.',
  coords: [8.5322820, 52.0206116], image: '/images/wine.jpg',
  sources: [{ title: 'Lions Club Bielefeld Phoenix · November 2025', url: 'https://www.lions-phoenix.com/presse/2025/11/21/dieses-jahr-mit-berraschung-wir-haben-jetzt-auch-weien-glhwein' }, { title: 'Lions Bielefeld Sparrenberg · Saison 2025', url: 'https://www.lc-bi-sparrenberg.de/lions-bielefeld-sparrenberg/aktuelles/' }]
 },
 {
  id: 'wm2025-almhuette', name: 'Krauses Almhütte', place: 'Bunnemannplatz',
  wine: 'Weißer Glühwein & Kinderpunsch', description: 'Eine warme Almhütte zwischen Obernstraße und Bunnemannplatz. Weißer Glühwein und Kinderpunsch waren 2025 angekündigt.',
  coords: [8.5295743, 52.0193913], image: '/images/market.jpg', sources: [marketing]
 },
 {
  id: 'wm2025-fels', name: 'Weihnacht unter dem Fels', place: 'Klosterplatz',
  wine: 'Glühwein & Punsch', description: 'Das Weihnachtsmarkt-Areal von André Hans Schneider am Klosterplatz: Heißgetränke und eine Lounge im Fels.',
  coords: [8.5285503, 52.0208272], image: '/images/market.jpg',
  sources: [{ title: 'Neue Westfälische · Weihnachtsmarkt 2025', url: 'https://www.nw.de/lokal/bielefeld/mitte/23899144_Bielefelder-Weihnachtsmarkt-2025-schliesst-bald-Oeffnungszeiten-Preise-und-Staende.html' }, { title: 'Betreiber · Klosterplatz (aktuelle Website)', url: 'https://www.weihnachtsmarkt-klosterplatz.de/' }]
 },
 {
  id: 'wm2025-nikolaus', name: 'Haus vom Nikolaus', place: 'Altstädter Kirchpark',
  wine: 'Feuerzangenbowle', description: 'Der rustikale Stopp im Kirchpark. Für 2025 ist Feuerzangenbowle ausdrücklich belegt — eine Alternative zum klassischen Glühwein.',
  coords: [8.5321475, 52.0210376], image: '/images/wine.jpg', sources: [marketing]
 },
 {
  id: 'wm2025-gluehbar', name: 'Glüh-Bar', place: 'Niedernstraße',
  wine: 'Getränk vor Ort auswählen', description: 'Die Glüh-Bar wurde 2025 in der Niedernstraße genannt. Eine konkrete Getränkekarte ist in der Quelle nicht dokumentiert.',
  coords: [8.5317787, 52.0222174], image: '/images/market.jpg',
  sources: [{ title: 'Bielefeld Marketing · 20.11.2025', url: 'https://www.bielefeld-marketing.de/pressemeldung/bielefeldjetzt-app-weihnachtsmarktbesuch-planen' }]
 },
 {
  id: 'wm2025-pyramide', name: 'Weihnachtspyramide', place: 'Jahnplatz',
  wine: 'Glühwein & weitere Heißgetränke', description: 'Die rund 23 Meter hohe Pyramide im Hüttendorf am Jahnplatz. Glühwein und weitere Heißgetränke waren 2025 angekündigt.',
  coords: [8.5329917, 52.0231648], image: '/images/market.jpg', sources: [marketing]
 }
];
export const legacyStands = [
 { id: '1', name: 'Weihnachtszauber' }, { id: '2', name: 'Die Glühhütte' },
 { id: '3', name: 'Wintergold' }, { id: '4', name: 'Sternenstube' }
];
export function average(_stand: Stand, rating?: Rating) {
 return rating?.values.length ? rating.values.reduce((a,b)=>a+b,0) / rating.values.length : 0;
}
export const stopNumber = (id: string) => String(stands.findIndex(s => s.id === id) + 1).padStart(2, '0');
export const formatScore = (n: number) => n.toFixed(1).replace('.', ',');
