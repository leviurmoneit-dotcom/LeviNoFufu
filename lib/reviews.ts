import { stands, type Rating, type TourPhoto } from './data';
import { kvGet, kvSet, loadTour, saveTour } from './storage';

export type Review = {
  id: string;
  standId: string;
  authorId: string;
  author: string;
  values: number[];
  comment: string;
  photos: TourPhoto[];
  updated: string;
};
export type Profile = { id: string; name: string };
export type SyncMode = 'live' | 'local';
export type SyncStatus = { online: boolean; pending: number; error: string };
export type SaveResult = 'synced' | 'queued';

export interface ReviewStore {
  mode: SyncMode;
  list(): Promise<Review[]>;
  save(review: Review): Promise<SaveResult>;
  remove(review: Review): Promise<SaveResult>;
  subscribe(onChange: () => void): () => void;
  /** Allen sagen, an welchem Stand die Truppe gerade ist. */
  shareHere(standId: string, by: string): void;
  onHere(listener: (standId: string, by: string) => void): () => void;
  status(): SyncStatus;
  onStatus(listener: (s: SyncStatus) => void): () => void;
  /** Wartende Änderungen jetzt senden. */
  flush(): Promise<void>;
}

const GROUP_KEY = 'glueh26-group';
/** Gruppencode aus dem Einladungslink (#g=CODE) oder aus dem Speicher. */
export function loadGroupCode(): string {
  const fromLink = new URLSearchParams(location.hash.slice(1)).get('g');
  if (fromLink) {
    saveGroupCode(fromLink);
    history.replaceState(null, '', location.pathname + location.search);
    return normalizeCode(fromLink);
  }
  try { return localStorage.getItem(GROUP_KEY) || ''; } catch { return ''; }
}
export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
export function saveGroupCode(code: string) { try { localStorage.setItem(GROUP_KEY, normalizeCode(code)); } catch {} }
export function newGroupCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'GLUEH-' + Array.from(crypto.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join('');
}
export const inviteLink = (code: string) => `${location.origin}${location.pathname}#g=${encodeURIComponent(code)}`;

const PROFILE_KEY = 'glueh26-profile';
const uuid = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');

export async function loadProfile(): Promise<Profile> {
  let stored: Partial<Profile> = {};
  try { stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch {}
  let name = stored.name ?? '';
  if (!stored.name) {
    // Name aus der ersten App-Version übernehmen, falls vorhanden.
    try { name = (await loadTour()).name || ''; } catch {}
  }
  const profile = { id: stored.id || uuid(), name };
  saveProfile(profile);
  return profile;
}
export function saveProfile(profile: Profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}

export const reviewId = (standId: string, authorId: string) => `${standId}:${authorId}`;
export const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

/** Nur auf diesem Gerät: eigene Bewertungen aus IndexedDB (Format der ersten Version). */
function localStore(profile: () => Profile): ReviewStore {
  const listeners = new Set<() => void>();
  return {
    mode: 'local',
    async list() {
      const state = await loadTour();
      const p = profile();
      return stands
        .filter(s => state.ratings[s.id])
        .map(s => toReview(s.id, state.ratings[s.id], p));
    },
    async save(review) {
      const state = await loadTour();
      const rating: Rating = { values: review.values, comment: review.comment, photos: review.photos, updated: review.updated };
      await saveTour({ ...state, name: review.author, ratings: { ...state.ratings, [review.standId]: rating } });
      listeners.forEach(l => l());
      return 'synced';
    },
    async remove(review) {
      const state = await loadTour();
      const ratings = { ...state.ratings };
      delete ratings[review.standId];
      await saveTour({ ...state, ratings });
      listeners.forEach(l => l());
      return 'synced';
    },
    subscribe(onChange) { listeners.add(onChange); return () => listeners.delete(onChange); },
    shareHere() {},
    onHere() { return () => {}; },
    status: () => ({ online: true, pending: 0, error: '' }),
    onStatus() { return () => {}; },
    flush: async () => {},
  };
}
const toReview = (standId: string, r: Rating, p: Profile): Review => ({
  id: reviewId(standId, p.id), standId, authorId: p.id, author: p.name || 'Du',
  values: r.values, comment: r.comment, photos: r.photos, updated: r.updated,
});

type Row = { id: string; group_code: string; stand_id: string; author_id: string; author: string; scores: number[]; comment: string; photos: TourPhoto[]; updated_at: string };
type Pending = { op: 'save' | 'remove'; review: Review };
// Auf dem Markt ist das Netz oft zäh: lieber nach ein paar Sekunden aufgeben und in die Warteschlange.
const timeout = (ms: number) => (typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(ms) : new AbortController().signal);
const fromRow = (r: Row): Review => ({
  id: r.id, standId: r.stand_id, authorId: r.author_id, author: r.author,
  values: r.scores, comment: r.comment, photos: r.photos || [], updated: r.updated_at,
});

/** Fehler von Supabase oder vom Netz in einen verständlichen Satz übersetzen. */
export function explainError(e: unknown): string {
  const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  if (/schema cache|does not exist|PGRST205|42P01/i.test(msg)) return 'Die Tabelle fehlt in Supabase. Bitte supabase/schema.sql im SQL Editor ausführen.';
  if (/row-level security|violates|permission denied|42501/i.test(msg)) return 'Supabase verweigert den Zugriff. Bitte supabase/schema.sql erneut ausführen.';
  if (/bucket not found/i.test(msg)) return 'Der Foto-Speicher fehlt. Bitte supabase/schema.sql erneut ausführen.';
  if (/fetch|network|load failed|offline|timeout/i.test(msg)) return 'Keine Verbindung zum Server.';
  return msg.slice(0, 160);
}

/** Gemeinsam über Supabase. Zugriff nur mit Gruppencode (Header, geprüft per Row Level Security).
 *  Fotos landen im öffentlichen Bucket "photos" unter einem nicht erratbaren Pfad.
 *  Ohne Netz landen Änderungen in einer Warteschlange und werden später nachgeschickt. */
async function liveStore(url: string, key: string, group: string, profile: () => Profile): Promise<ReviewStore> {
  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { 'x-group-code': group } } });
  const local = localStore(profile);
  const OUTBOX = `outbox:${group}`, CACHE = `cache:${group}`;
  let outbox: Pending[] = (await kvGet<Pending[]>(OUTBOX).catch(() => undefined)) || [];
  let status: SyncStatus = { online: true, pending: outbox.length, error: '' };
  const statusListeners = new Set<(s: SyncStatus) => void>();
  const setStatus = (next: Partial<SyncStatus>) => { status = { ...status, ...next, pending: outbox.length }; statusListeners.forEach(l => l(status)); };
  const persistOutbox = () => kvSet(OUTBOX, outbox).catch(() => {});

  // Postgres-Änderungen kommen wegen der Header-Regel nicht per Realtime an, daher Broadcast im Gruppenkanal.
  const channel = db.channel(`gruppe-${group}`);
  const listeners = new Set<() => void>();
  const hereListeners = new Set<(standId: string, by: string) => void>();
  let here: { standId: string; by: string } | null = null;
  const send = (event: string, payload: object) => channel.send({ type: 'broadcast', event, payload });
  channel
    .on('broadcast', { event: 'changed' }, () => listeners.forEach(l => l()))
    .on('broadcast', { event: 'here' }, ({ payload }) => {
      if (typeof payload?.standId !== 'string') return;
      here = { standId: payload.standId, by: String(payload.by || '') };
      hereListeners.forEach(l => l(here!.standId, here!.by));
    })
    // Wer neu dazukommt, fragt nach dem aktuellen Stand der Truppe.
    .on('broadcast', { event: 'where' }, () => { if (here) send('here', here); })
    .subscribe(s => { if (s === 'SUBSCRIBED') send('where', {}); });
  const announce = () => send('changed', {});

  async function pushSave(review: Review) {
    const photos: TourPhoto[] = [];
    for (const photo of review.photos) {
      if (!photo.src.startsWith('data:')) { photos.push(photo); continue; }
      const blob = await (await fetch(photo.src)).blob();
      const path = `${group}/${review.standId}/${review.authorId}/${photo.id}.jpg`;
      // Ohne upsert: Überschreiben bräuchte eine Lese-Regel, und die Fotos sollen nicht auflistbar sein.
      const { error } = await db.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' });
      if (error && !/exists|duplicate/i.test(error.message)) throw error;
      photos.push({ ...photo, src: db.storage.from('photos').getPublicUrl(path).data.publicUrl });
    }
    const row: Row = {
      id: review.id, group_code: group, stand_id: review.standId, author_id: review.authorId, author: review.author,
      scores: review.values, comment: review.comment, photos, updated_at: review.updated,
    };
    const { error } = await db.from('reviews').upsert(row).abortSignal(timeout(15000));
    if (error) throw error;
    return { ...review, photos };
  }
  async function pushRemove(review: Review) {
    const { error } = await db.from('reviews').delete().eq('id', review.id).eq('group_code', group).abortSignal(timeout(15000));
    if (error) throw error;
  }
  let flushing: Promise<void> | null = null;
  function flush() {
    if (!outbox.length) return Promise.resolve();
    return (flushing ||= (async () => {
      try {
        while (outbox.length) {
          const item = outbox[0];
          if (item.op === 'save') await local.save(await pushSave(item.review));
          else await pushRemove(item.review);
          outbox = outbox.slice(1);
          await persistOutbox();
        }
        setStatus({ online: true, error: '' });
        announce();
        listeners.forEach(l => l());
      } catch (e) {
        setStatus({ error: explainError(e) });
      } finally { flushing = null; }
    })());
  }
  function enqueue(item: Pending, e: unknown) {
    outbox = [...outbox.filter(x => x.review.id !== item.review.id), item];
    persistOutbox();
    setStatus({ error: explainError(e) });
  }
  const retry = () => { if (!document.hidden) flush(); };
  addEventListener('online', retry);
  setInterval(() => { if (outbox.length) retry(); }, 30_000);
  if (outbox.length) setTimeout(retry, 1500);

  return {
    mode: 'live',
    async list() {
      let remote: Review[];
      try {
        const { data, error } = await db.from('reviews').select('*').eq('group_code', group).order('updated_at', { ascending: false }).abortSignal(timeout(12000));
        if (error) throw error;
        remote = (data as Row[]).map(fromRow);
        kvSet(CACHE, remote).catch(() => {});
        setStatus({ online: true, ...(outbox.length ? {} : { error: '' }) });
      } catch (e) {
        // Offline: zuletzt geladene Gruppenwertung anzeigen.
        remote = (await kvGet<Review[]>(CACHE).catch(() => undefined)) || [];
        setStatus({ online: false, error: explainError(e) });
      }
      const pending = new Map(outbox.map(p => [p.review.id, p]));
      const merged = remote.filter(r => !pending.has(r.id));
      for (const p of outbox) if (p.op === 'save') merged.unshift(p.review);
      return merged;
    },
    async save(review) {
      try {
        const saved = await pushSave(review);
        await local.save(saved);
        announce();
        setStatus({ online: true, error: outbox.length ? status.error : '' });
        flush();
        return 'synced';
      } catch (e) {
        await local.save(review);
        enqueue({ op: 'save', review }, e);
        return 'queued';
      }
    },
    async remove(review) {
      await local.remove(review);
      try { await pushRemove(review); announce(); return 'synced'; }
      catch (e) { enqueue({ op: 'remove', review }, e); return 'queued'; }
    },
    subscribe(onChange) {
      listeners.add(onChange);
      const focus = () => { if (!document.hidden) { flush(); onChange(); } };
      document.addEventListener('visibilitychange', focus);
      const poll = setInterval(focus, 60_000);
      return () => { listeners.delete(onChange); clearInterval(poll); document.removeEventListener('visibilitychange', focus); };
    },
    shareHere(standId, by) { here = { standId, by }; send('here', here); },
    onHere(listener) { hereListeners.add(listener); return () => hereListeners.delete(listener); },
    status: () => status,
    onStatus(listener) { statusListeners.add(listener); return () => statusListeners.delete(listener); },
    flush,
  };
}

export const liveConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function createStore(profile: () => Profile, group: string): Promise<ReviewStore> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key && group) {
    try { return await liveStore(url, key, group, profile); } catch {}
  }
  return localStore(profile);
}
