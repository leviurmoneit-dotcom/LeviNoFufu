# Glühwein Tour 26

Next.js 15, React 19, TypeScript, Tailwind CSS 4. Mobile-first Prototyp für eine Glühwein-Tour durch Bielefeld: Karte (MapLibre), Bewertungen und Fotos lokal in IndexedDB, vier wechselbare Looks (Winter Atlas, Studio, Noël, Afterglow), 3D-Tasse mit Three.js.

```
pnpm install
pnpm dev        # http://127.0.0.1:5173
pnpm build      # statischer Export nach ./out
pnpm typecheck
```

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

- React Bits FadeContent (`components/FadeContent.tsx`), Lizenz: `REACT-BITS-LICENSE.md`
- Karten: MapLibre GL JS, OpenFreeMap. Schrift: Inter (Fontsource). Icons: Lucide.
