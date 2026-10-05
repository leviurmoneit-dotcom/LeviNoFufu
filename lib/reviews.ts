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
  subscribe(onChange: () => void): () => void;
}

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
    subscribe(onChange) { listeners.add(onChange); return () => listeners.delete(onChange); },
  };
}
const toReview = (standId: string, r: Rating, p: Profile): Review => ({
  id: reviewId(standId, p.id), standId, authorId: p.id, author: p.name || 'Du',
  values: r.values, comment: r.comment, photos: r.photos, updated: r.updated,
});

type Row = { id: string; stand_id: string; author_id: string; author: string; scores: number[]; comment: string; photos: TourPhoto[]; updated_at: string };

/** Gemeinsam über Supabase. Fotos landen im öffentlichen Bucket "photos". */
async function liveStore(url: string, key: string, profile: () => Profile): Promise<ReviewStore> {
  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const local = localStore(profile);
  return {
    mode: 'live',
    async list() {
      const { data, error } = await db.from('reviews').select('*').order('updated_at', { ascending: false });
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
        const path = `${review.standId}/${review.authorId}/${photo.id}.jpg`;
        const { error } = await db.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
        if (error) throw error;
        photos.push({ ...photo, src: db.storage.from('photos').getPublicUrl(path).data.publicUrl });
      }
      const row: Row = {
        id: review.id, stand_id: review.standId, author_id: review.authorId, author: review.author,
        scores: review.values, comment: review.comment, photos, updated_at: review.updated,
      };
      const { error } = await db.from('reviews').upsert(row);
      if (error) throw error;
      await local.save({ ...review, photos });
    },
    subscribe(onChange) {
      const channel = db.channel('reviews')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => onChange())
        .subscribe();
      const focus = () => { if (!document.hidden) onChange(); };
      document.addEventListener('visibilitychange', focus);
      return () => { db.removeChannel(channel); document.removeEventListener('visibilitychange', focus); };
    },
  };
}

export async function createStore(profile: () => Profile): Promise<ReviewStore> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try { return await liveStore(url, key, profile); } catch {}
  }
  return localStore(profile);
}
