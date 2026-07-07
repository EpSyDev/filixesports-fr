-- ============================================================
--  Statistiques joueurs — nouveaux champs
--
--  Joueurs de champ : hors-jeu, ballons récupérés/perdus,
--  précision passes/tirs (en %).
--  Gardiens : tirs subis, tirs cadrés, arrêts, buts encaissés,
--  pénaltys arrêtés, buts encaissés sur pénalty.
--
--  Les colonnes cartons (yellowCards / redCards) restent en base
--  pour compatibilité mais ne sont plus saisies ni affichées.
--
--  À coller dans le SQL editor Supabase.
-- ============================================================

alter table public.player_stats
  -- joueurs de champ
  add column if not exists offsides               integer default 0,
  add column if not exists balls_recovered        integer default 0,
  add column if not exists balls_lost             integer default 0,
  add column if not exists pass_accuracy          integer,   -- 0-100 (%)
  add column if not exists shot_accuracy          integer,   -- 0-100 (%)
  -- gardiens
  add column if not exists shots_faced            integer default 0,
  add column if not exists shots_on_target_faced  integer default 0,
  add column if not exists saves                  integer default 0,
  add column if not exists goals_conceded         integer default 0,
  add column if not exists penalties_saved        integer default 0,
  add column if not exists penalty_goals_conceded integer default 0;
