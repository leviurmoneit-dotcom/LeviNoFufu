# Glühwein Tour 26

Next.js 15, React 19, TypeScript, Tailwind CSS 4. Mobile-first Prototyp für eine Glühwein-Tour durch Bielefeld: Karte (MapLibre), Bewertungen und Fotos lokal in IndexedDB, vier wechselbare Looks (Winter Atlas, Studio, Noël, Afterglow), 3D-Tasse mit Three.js.

```
pnpm install
pnpm dev        # http://127.0.0.1:5173
pnpm build      # statischer Export nach ./out
pnpm typecheck
```

## Stand des Imports

Dieser Code wurde aus dem Drive-Ordner `gluehwein-tour-26` übernommen (Designprototyp v5). Typprüfung und Build laufen durch.

- `public/images/market.jpg` und `public/images/wine.jpg` sind **Platzhalter**. Die echten Pexels-Fotos (Quellen siehe unten) fehlen noch und müssen hier überschrieben werden.
- Nicht übernommen: `README.md`/`RESEARCH-2025.md` aus Drive (Originaltexte), `designs/winter-atlas`, das archivierte v1 (`index.html`, `app.js`, `style.css`).

## Quellen

- Foto `market.jpg`: Bastian Riccardi / Pexels, https://www.pexels.com/photo/munich-christmas-market-gluhwein-stand-at-night-29719849/
- Foto `wine.jpg`: Mâide Arslan / Pexels, https://www.pexels.com/photo/traditional-munich-christmas-market-mulled-wine-29705578/
- React Bits FadeContent (`components/FadeContent.tsx`), Lizenz: `REACT-BITS-LICENSE.md`
- Karten: MapLibre GL JS, OpenFreeMap. Schrift: Inter (Fontsource). Icons: Lucide.
