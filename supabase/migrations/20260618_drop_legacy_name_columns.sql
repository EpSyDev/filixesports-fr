-- ============================================================
-- Suppression des colonnes legacy "name".
-- La base déployée a été créée depuis une version où les tables
-- d'équipes utilisaient une colonne `name` (NOT NULL). Le schéma
-- actuel utilise `"teamName"`. L'ancienne colonne `name` subsiste
-- en prod et casse chaque insert (null value in column "name"
-- violates not-null constraint).
--
-- Cette migration migre les noms existants vers `"teamName"` (aucune
-- perte de données) puis supprime la colonne `name` devenue inutile.
-- Idempotente : ne fait rien si la colonne `name` n'existe plus.
-- À exécuter dans Supabase > SQL Editor.
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array[
    'league_teams','league_standings','tournament_teams','pool_standings'
  ]
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'name'
    ) then
      -- Récupère les noms existants vers teamName quand il est vide
      execute format(
        'update public.%I set "teamName" = name '
        || 'where ("teamName" is null or "teamName" = '''') '
        || 'and name is not null and name <> ''''',
        t
      );
      -- Supprime la colonne legacy
      execute format('alter table public.%I drop column name', t);
    end if;
  end loop;
end $$;

-- Rafraîchit le cache de schéma de PostgREST
notify pgrst, 'reload schema';
