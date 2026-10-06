-- Einmal im Supabase SQL-Editor ausführen (ganzer Inhalt, dann "Run").
-- Jede Gruppe hat einen eigenen Code. Ohne den passenden Code sieht und ändert niemand etwas.

create table if not exists public.reviews (
  id text primary key,                 -- "<standId>:<authorId>"
  group_code text not null check (char_length(group_code) between 6 and 40),
  stand_id text not null,
  author_id text not null,
  author text not null check (char_length(author) between 1 and 30),
  scores smallint[] not null check (array_length(scores, 1) = 5),
  comment text not null default '' check (char_length(comment) <= 300),
  photos jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
create index if not exists reviews_group_idx on public.reviews (group_code);

-- Neuere Supabase-Projekte geben neue Tabellen nicht automatisch für die App frei.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.reviews to anon, authenticated;

-- Der Gruppencode kommt als HTTP-Header "x-group-code" von der App.
create or replace function public.request_group() returns text
language sql stable as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-group-code', '')
$$;
grant execute on function public.request_group() to anon, authenticated;

alter table public.reviews enable row level security;
drop policy if exists "gruppe lesen" on public.reviews;
drop policy if exists "gruppe anlegen" on public.reviews;
drop policy if exists "gruppe ändern" on public.reviews;
drop policy if exists "gruppe löschen" on public.reviews;
create policy "gruppe lesen" on public.reviews for select using (group_code = public.request_group());
create policy "gruppe anlegen" on public.reviews for insert with check (group_code = public.request_group());
create policy "gruppe ändern" on public.reviews for update using (group_code = public.request_group()) with check (group_code = public.request_group());
create policy "gruppe löschen" on public.reviews for delete using (group_code = public.request_group());

-- Fotos: öffentlich abrufbar über ihre (nicht erratbare) Adresse, aber nicht auflistbar.
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
drop policy if exists "fotos hochladen" on storage.objects;
drop policy if exists "fotos ersetzen" on storage.objects;
create policy "fotos hochladen" on storage.objects for insert with check (bucket_id = 'photos');
create policy "fotos ersetzen" on storage.objects for update using (bucket_id = 'photos');
