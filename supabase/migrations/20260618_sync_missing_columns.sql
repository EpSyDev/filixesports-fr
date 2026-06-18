-- ============================================================
-- Resynchronisation : la base déployée a été créée à partir d'une
-- version ancienne de schema.sql. Plusieurs colonnes ajoutées depuis
-- n'existaient pas en prod → erreurs PGRST204 à la création de
-- compétition, à l'enregistrement des stats, des équipes, etc.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

-- competitions
alter table public.competitions   add column if not exists season      text default '';
alter table public.competitions   add column if not exists description text default '';

-- player_stats
alter table public.player_stats    add column if not exists notes       text default '';

-- formations
alter table public.formations      add column if not exists tactic      text default '3-5-2';
alter table public.formations      add column if not exists players      jsonb default '[]';

-- ligue
alter table public.league_teams     add column if not exists "teamName"  text not null default '';
alter table public.league_standings add column if not exists "teamName"  text not null default '';

-- tournoi (poules)
alter table public.tournament_teams add column if not exists "teamName"  text not null default '';
alter table public.pool_standings   add column if not exists "teamName"  text not null default '';
alter table public.pool_standings   add column if not exists qualified   boolean default false;

-- élimination directe
alter table public.knockout_matches add column if not exists winner      text default '';

-- Rafraîchit le cache de schéma de PostgREST
notify pgrst, 'reload schema';
