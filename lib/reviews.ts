import { stands, type Rating, type TourPhoto } from './data';
import { loadTour, saveTour } from './storage';

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

export interface ReviewStore {
  mode: SyncMode;
  list(): Promise<Review[]>;
  save(review: Review): Promise<void>;
  remove(review: Review): Promise<void>;
  subscribe(onChange: () => void): () => void;
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
    },
    async remove(review) {
      const state = await loadTour();
      const ratings = { ...state.ratings };
      delete ratings[review.standId];
      await saveTour({ ...state, ratings });
      listeners.forEach(l => l());
    },
    subscribe(onChange) { listeners.add(onChange); return () => listeners.delete(onChange); },
  };
}
const toReview = (standId: string, r: Rating, p: Profile): Review => ({
  id: reviewId(standId, p.id), standId, authorId: p.id, author: p.name || 'Du',
  values: r.values, comment: r.comment, photos: r.photos, updated: r.updated,
});

type Row = { id: string; group_code: string; stand_id: string; author_id: string; author: string; scores: number[]; comment: string; photos: TourPhoto[]; updated_at: string };

/** Gemeinsam über Supabase. Zugriff nur mit Gruppencode (Header, geprüft per Row Level Security).
 *  Fotos landen im öffentlichen Bucket "photos" unter einem nicht erratbaren Pfad. */
async function liveStore(url: string, key: string, group: string, profile: () => Profile): Promise<ReviewStore> {
  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(url, key, { auth: { persistSession: false }, global: { headers: { 'x-group-code': group } } });
  const local = localStore(profile);
  // Postgres-Änderungen kommen wegen der Header-Regel nicht per Realtime an, daher Broadcast im Gruppenkanal.
  const channel = db.channel(`gruppe-${group}`);
  const listeners = new Set<() => void>();
  channel.on('broadcast', { event: 'changed' }, () => listeners.forEach(l => l())).subscribe();
  const announce = () => channel.send({ type: 'broadcast', event: 'changed', payload: {} });
  return {
    mode: 'live',
    async list() {
      const { data, error } = await db.from('reviews').select('*').eq('group_code', group).order('updated_at', { ascending: false });
      if (error) throw error;
      return (data as Row[]).map(r => ({
        id: r.id, standId: r.stand_id, authorId: r.author_id, author: r.author,
        values: r.scores, comment: r.comment, photos: r.photos || [], updated: r.updated_at,
      }));
    },
    async save(review) {
      const photos: TourPhoto[] = [];
      for (const photo of review.photos) {
        if (!photo.src.startsWith('data:')) { photos.push(photo); continue; }
        const blob = await (await fetch(photo.src)).blob();
        const path = `${group}/${review.standId}/${review.authorId}/${photo.id}.jpg`;
        const { error } = await db.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
        if (error) throw error;
        photos.push({ ...photo, src: db.storage.from('photos').getPublicUrl(path).data.publicUrl });
      }
      const row: Row = {
        id: review.id, group_code: group, stand_id: review.standId, author_id: review.authorId, author: review.author,
        scores: review.values, comment: review.comment, photos, updated_at: review.updated,
      };
      const { error } = await db.from('reviews').upsert(row);
      if (error) throw error;
      await local.save({ ...review, photos });
      announce();
    },
    async remove(review) {
      const { error } = await db.from('reviews').delete().eq('id', review.id).eq('group_code', group);
      if (error) throw error;
      await local.remove(review);
      announce();
    },
    subscribe(onChange) {
      listeners.add(onChange);
      const focus = () => { if (!document.hidden) onChange(); };
      document.addEventListener('visibilitychange', focus);
      const poll = setInterval(focus, 60_000);
      return () => { listeners.delete(onChange); clearInterval(poll); document.removeEventListener('visibilitychange', focus); };
    },
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
