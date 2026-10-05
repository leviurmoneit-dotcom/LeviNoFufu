'use client';
import { useEffect } from 'react';
import { asset } from '../lib/asset';

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(asset('/sw.js'), { scope: asset('/') }).catch(() => {});
  }, []);
  return null;
}
