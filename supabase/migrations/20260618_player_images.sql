-- ============================================================
-- Photos des joueurs (équipe FILIX) — WebP uniquement.
-- Ajoute players.image + crée le bucket Storage 'players'
-- restreint au type image/webp (5 Mo max).
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

-- Colonne image sur players
alter table public.players add column if not exists image text default '';

-- Bucket Storage 'players' : public en lecture, WebP uniquement, 5 Mo max
insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values ('players', 'players', true, array['image/webp'], 5242880)
on conflict (id) do update
  set public             = true,
      allowed_mime_types = array['image/webp'],
      file_size_limit    = 5242880;

-- Policies Storage pour le bucket 'players' (idempotent)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='players lecture publique') then
    create policy "players lecture publique" on storage.objects
      for select using (bucket_id = 'players');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='players upload admin') then
    create policy "players upload admin" on storage.objects
      for insert with check (auth.role() = 'authenticated' and bucket_id = 'players');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='players delete admin') then
    create policy "players delete admin" on storage.objects
      for delete using (auth.role() = 'authenticated' and bucket_id = 'players');
  end if;
end $$;

notify pgrst, 'reload schema';
