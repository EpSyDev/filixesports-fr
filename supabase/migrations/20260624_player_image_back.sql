-- ============================================================
-- Deuxième photo des joueurs (dos) — WebP uniquement.
-- Ajoute players."imageBack" (visible au survol dans l'effectif).
-- Réutilise le bucket Storage 'players' existant.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

alter table public.players add column if not exists "imageBack" text default '';

notify pgrst, 'reload schema';
