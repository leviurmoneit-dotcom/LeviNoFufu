# Glühwein Tour 26

Next.js 15, React 19, TypeScript, Tailwind CSS 4. Mobile-first Web-App für eine Glühwein-Tour durch Bielefeld: Karte (MapLibre), Gruppen-Bewertungen mit Fotos (Supabase, sonst lokal), Three.js-Hintergrund und 3D-Tasse.

Live: https://leviurmoneit-dotcom.github.io/LeviNoFufu/

```
pnpm install
pnpm dev        # http://127.0.0.1:5173
pnpm build      # statischer Export nach ./out
pnpm typecheck
```

## Gemeinsame Bewertungen (Supabase)

Ohne Datenbank speichert die App nur auf dem eigenen Gerät. Für die Gruppe:
1. Kostenloses Projekt auf supabase.com anlegen.
2. Im SQL-Editor `supabase/schema.sql` ausführen (Tabelle, Regeln, Foto-Bucket, Live-Updates).
3. Unter Project Settings → API die Project URL und den `anon`-Key kopieren.
4. In GitHub: Settings → Secrets and variables → Actions → Variables: `SUPABASE_URL` und `SUPABASE_ANON_KEY` anlegen.
5. Den Pages-Workflow neu starten. Danach zeigt die App oben "Live".

Der `anon`-Key ist für den Browser gedacht und darf öffentlich sein. Geschützt wird über den Gruppencode: Beim ersten Öffnen tritt man einer Gruppe bei oder gründet eine. Der Code reist als Header mit, die Datenbank (Row Level Security) liefert nur Einträge dieser Gruppe. Der Einladungslink in der App enthält den Code (`#g=CODE`).

## Als App aufs Handy

Die Seite ist eine installierbare Web-App (Manifest, Icons, Offline-Cache). Nach dem Hosting:
- **iPhone (Safari):** Teilen, "Zum Home-Bildschirm".
- **Android (Chrome):** Menü, "App installieren".

## Hosting

Empfohlen: **Vercel** (Hobby-Plan, kostenlos). Repo verbinden, Framework "Next.js" wird erkannt, Build `pnpm build`. Jeder Push bekommt eine eigene Vorschau-URL. Die App liegt dort auf der Wurzel der Domain, deshalb funktionieren Pfade, Manifest und Offline-Cache ohne Anpassung. Alternative: Cloudflare Pages (Build `pnpm build`, Ausgabeordner `out`).
GitHub Pages ist unpraktisch, weil es unter `/LeviNoFufu/` ausliefert und alle Pfade anpassen müsste.

## Stand des Imports

Dieser Code wurde aus dem Drive-Ordner `gluehwein-tour-26` übernommen (Designprototyp v5). Typprüfung und Build laufen durch.

- Bilder: eigene Illustrationen in `public/illustrations/` (kein Fotomaterial). Echte Fotos sind optional und kommen bei Bedarf dazu.
- Nicht übernommen: `README.md`/`RESEARCH-2025.md` aus Drive (Originaltexte), `designs/winter-atlas`, das archivierte v1 (`index.html`, `app.js`, `style.css`).

## Quellen

- Karten: MapLibre GL JS, OpenFreeMap. Schrift: Fraunces und Instrument Sans (Fontsource, OFL). Icons: Lucide.
