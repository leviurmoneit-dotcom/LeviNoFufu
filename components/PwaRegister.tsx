'use client';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { asset } from '../lib/asset';

/** Registriert den Service Worker und meldet, wenn eine neue Version online ist (Vergleich mit version.json). */
export default function PwaRegister() {
  const [update, setUpdate] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    let reg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(asset('/sw.js'), { scope: asset('/') }).then(r => { reg = r; }, () => {});
    const check = async () => {
      if (document.hidden) return;
      try {
        const { v } = await (await fetch(asset('/version.json'), { cache: 'no-store' })).json();
        if (v && v !== process.env.NEXT_PUBLIC_BUILD_ID) { setUpdate(true); reg?.update().catch(() => {}); }
      } catch {}
    };
    check();
    const timer = setInterval(check, 5 * 60_000);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', check); };
  }, []);
  if (!update) return null;
  return (
    <button type="button" className="update-banner" onClick={() => location.reload()}>
      <RefreshCw size={16} /><span><strong>Neue Version verfügbar</strong><small>Tippen zum Aktualisieren</small></span>
    </button>
  );
}
