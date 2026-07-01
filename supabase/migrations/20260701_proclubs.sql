-- ============================================================
--  Intégration EA Pro Clubs — tables uniquement
--
--  NB : l'API EA (Akamai) bloque les IP datacenter, y compris
--  celles de Supabase. La récupération ne peut donc PAS se faire
--  depuis Postgres. Elle est assurée par un script externe
--  (scripts/proclubs-sync.mjs) lancé toutes les heures via une
--  GitHub Action, qui upsert dans ces tables via l'API REST.
-- ============================================================

create table if not exists public.proclubs_club (
  club_id                text primary key,
  name                   text,
  stadium                text,
  crest_asset_id         text,
  platform               text,
  games_played           int,
  wins                   int,
  ties                   int,
  losses                 int,
  goals                  int,
  goals_against          int,
  promotions             int,
  relegations            int,
  best_division          int,
  games_played_playoff   int,
  skill_rating           int,
  reputation_tier        int,
  league_appearances     int,
  updated_at             timestamptz default now()
);

create table if not exists public.proclubs_players (
  club_id                text,
  name                   text,
  pro_name               text,
  favorite_position      text,
  pro_pos                text,
  pro_overall            int,
  games_played           int,
  win_rate               int,
  goals                  int,
  assists                int,
  rating_ave             numeric,
  pass_success_rate      int,
  shot_success_rate      int,
  tackle_success_rate    int,
  passes_made            int,
  tackles_made           int,
  man_of_the_match       int,
  red_cards              int,
  clean_sheets_def       int,
  clean_sheets_gk        int,
  prev_goals             jsonb,
  updated_at             timestamptz default now(),
  primary key (club_id, name)
);

create table if not exists public.proclubs_matches (
  match_id                 text primary key,
  club_id                  text,
  played_at                timestamptz,
  match_type               text,
  our_score                int,
  opp_score                int,
  result                   text,          -- 'win' | 'loss' | 'draw'
  opponent_name            text,
  opponent_club_id         text,
  opponent_crest_asset_id  text,
  players                  jsonb,          -- détail par joueur pour ce match
  updated_at               timestamptz default now()
);

-- ---------- Lecture publique (le site affiche ces stats) ----------

alter table public.proclubs_club    enable row level security;
alter table public.proclubs_players enable row level security;
alter table public.proclubs_matches enable row level security;

drop policy if exists "lecture publique proclubs_club"    on public.proclubs_club;
drop policy if exists "lecture publique proclubs_players" on public.proclubs_players;
drop policy if exists "lecture publique proclubs_matches" on public.proclubs_matches;

create policy "lecture publique proclubs_club"    on public.proclubs_club    for select using (true);
create policy "lecture publique proclubs_players" on public.proclubs_players for select using (true);
create policy "lecture publique proclubs_matches" on public.proclubs_matches for select using (true);
