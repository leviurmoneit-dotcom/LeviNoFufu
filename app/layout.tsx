import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/fredoka';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './app.css';
import PwaRegister from '../components/PwaRegister';
import { asset } from '../lib/asset';
import { themeBootScript } from '../lib/themes';
export const metadata: Metadata = {
  title: 'Glühwein Tour 26',
  description: 'Deine winterliche Glühwein-Tour durch Bielefeld.',
  manifest: asset('/manifest.webmanifest'),
  icons: { icon: asset('/favicon.svg'), apple: asset('/apple-touch-icon.png') },
  appleWebApp: { capable: true, title: 'Glühwein 26', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#120e16' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="de" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeBootScript }} /></head><body>{children}<PwaRegister /></body></html> }
