import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';
import './ios.css';
import './themes.css';
import './tour-details.css';
import './atlas.css';
export const metadata: Metadata = { title: 'Glühwein Tour 26', description: 'Deine winterliche Glühwein-Tour durch Bielefeld.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="de"><body>{children}</body></html> }
