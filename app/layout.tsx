import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';
import './ios.css';
import './themes.css';
import './tour-details.css';
import './atlas.css';
import './motion.css';
import PwaRegister from '../components/PwaRegister';
import { asset } from '../lib/asset';
export const metadata: Metadata = {
  title: 'Glühwein Tour 26',
  description: 'Deine winterliche Glühwein-Tour durch Bielefeld.',
  manifest: asset('/manifest.webmanifest'),
  icons: { icon: asset('/favicon.svg'), apple: asset('/apple-touch-icon.png') },
  appleWebApp: { capable: true, title: 'Glühwein 26', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f7f8f3' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="de"><body>{children}<PwaRegister /></body></html> }
