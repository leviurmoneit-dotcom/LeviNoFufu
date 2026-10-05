-- Einmal im Supabase SQL-Editor ausführen.
create table if not exists public.reviews (
  id text primary key,                -- "<standId>:<authorId>", eine Bewertung pro Person und Stand
  stand_id text not null,
  author_id text not null,
  author text not null check (char_length(author) between 1 and 30),
  scores smallint[] not null check (array_length(scores, 1) = 5),
  comment text not null default '' check (char_length(comment) <= 300),
  photos jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
-- Gruppen-App ohne Login: jeder mit dem Link darf lesen und eigene Einträge schreiben, aber nichts löschen.
create policy "lesen" on public.reviews for select using (true);
create policy "anlegen" on public.reviews for insert with check (true);
create policy "ändern" on public.reviews for update using (true) with check (true);
alter publication supabase_realtime add table public.reviews;

insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict do nothing;
create policy "fotos lesen" on storage.objects for select using (bucket_id = 'photos');
create policy "fotos hochladen" on storage.objects for insert with check (bucket_id = 'photos');
create policy "fotos ersetzen" on storage.objects for update using (bucket_id = 'photos');
