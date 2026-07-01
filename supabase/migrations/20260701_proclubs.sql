-- ============================================================
--  Intégration EA Pro Clubs (source : API non-officielle EA FC)
--  - 3 tables alimentées automatiquement
--  - 1 fonction refresh_proclubs() appelée toutes les heures (pg_cron)
--  Tout se déploie en collant ce fichier dans l'éditeur SQL Supabase.
-- ============================================================

-- Extensions requises (à activer une seule fois)
create extension if not exists http with schema extensions;
create extension if not exists pg_cron;

-- ---------- Tables ----------

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

-- ---------- Fonction de récupération ----------

create or replace function public.refresh_proclubs(
  p_club_id  text default '907897',
  p_platform text default 'common-gen5'
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_headers extensions.http_header[] := array[
    extensions.http_header('User-Agent','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'),
    extensions.http_header('Referer','https://www.ea.com/'),
    extensions.http_header('Accept','application/json')
  ];
  v_base   text := 'https://proclubs.ea.com/api/fc/';
  v_info    jsonb;
  v_overall jsonb;
  v_members jsonb;
  v_matches jsonb;
  v_match   jsonb;
  v_opp_key text;
  v_opp     jsonb;
begin
  -- ① Infos club
  select content::jsonb into v_info
  from extensions.http(('GET',
    v_base||'clubs/info?platform='||p_platform||'&clubIds='||p_club_id,
    v_headers, NULL, NULL)::extensions.http_request);

  -- ② Bilan global
  select content::jsonb into v_overall
  from extensions.http(('GET',
    v_base||'clubs/overallStats?platform='||p_platform||'&clubIds='||p_club_id,
    v_headers, NULL, NULL)::extensions.http_request);
  v_overall := v_overall->0;

  insert into public.proclubs_club (
    club_id, name, stadium, crest_asset_id, platform,
    games_played, wins, ties, losses, goals, goals_against,
    promotions, relegations, best_division, games_played_playoff,
    skill_rating, reputation_tier, league_appearances, updated_at
  ) values (
    p_club_id,
    v_info->p_club_id->>'name',
    v_info->p_club_id->'customKit'->>'stadName',
    v_info->p_club_id->'customKit'->>'crestAssetId',
    p_platform,
    (v_overall->>'gamesPlayed')::int,
    (v_overall->>'wins')::int,
    (v_overall->>'ties')::int,
    (v_overall->>'losses')::int,
    (v_overall->>'goals')::int,
    (v_overall->>'goalsAgainst')::int,
    (v_overall->>'promotions')::int,
    (v_overall->>'relegations')::int,
    (v_overall->>'bestDivision')::int,
    (v_overall->>'gamesPlayedPlayoff')::int,
    (v_overall->>'skillRating')::int,
    (v_overall->>'reputationtier')::int,
    (v_overall->>'leagueAppearances')::int,
    now()
  )
  on conflict (club_id) do update set
    name=excluded.name, stadium=excluded.stadium, crest_asset_id=excluded.crest_asset_id, platform=excluded.platform,
    games_played=excluded.games_played, wins=excluded.wins, ties=excluded.ties, losses=excluded.losses,
    goals=excluded.goals, goals_against=excluded.goals_against, promotions=excluded.promotions, relegations=excluded.relegations,
    best_division=excluded.best_division, games_played_playoff=excluded.games_played_playoff,
    skill_rating=excluded.skill_rating, reputation_tier=excluded.reputation_tier,
    league_appearances=excluded.league_appearances, updated_at=now();

  -- ③ Joueurs
  select content::jsonb into v_members
  from extensions.http(('GET',
    v_base||'members/stats?platform='||p_platform||'&clubId='||p_club_id,
    v_headers, NULL, NULL)::extensions.http_request);

  insert into public.proclubs_players (
    club_id, name, pro_name, favorite_position, pro_pos, pro_overall,
    games_played, win_rate, goals, assists, rating_ave,
    pass_success_rate, shot_success_rate, tackle_success_rate, passes_made, tackles_made,
    man_of_the_match, red_cards, clean_sheets_def, clean_sheets_gk, prev_goals, updated_at
  )
  select
    p_club_id,
    m->>'name', m->>'proName', m->>'favoritePosition', m->>'proPos', nullif(m->>'proOverall','')::int,
    nullif(m->>'gamesPlayed','')::int, nullif(m->>'winRate','')::int, nullif(m->>'goals','')::int,
    nullif(m->>'assists','')::int, nullif(m->>'ratingAve','')::numeric,
    nullif(m->>'passSuccessRate','')::int, nullif(m->>'shotSuccessRate','')::int, nullif(m->>'tackleSuccessRate','')::int,
    nullif(m->>'passesMade','')::int, nullif(m->>'tacklesMade','')::int,
    nullif(m->>'manOfTheMatch','')::int, nullif(m->>'redCards','')::int,
    nullif(m->>'cleanSheetsDef','')::int, nullif(m->>'cleanSheetsGK','')::int,
    jsonb_build_array(m->>'prevGoals1', m->>'prevGoals2', m->>'prevGoals3', m->>'prevGoals4', m->>'prevGoals5',
                      m->>'prevGoals6', m->>'prevGoals7', m->>'prevGoals8', m->>'prevGoals9', m->>'prevGoals10'),
    now()
  from jsonb_array_elements(v_members->'members') as m
  on conflict (club_id, name) do update set
    pro_name=excluded.pro_name, favorite_position=excluded.favorite_position, pro_pos=excluded.pro_pos, pro_overall=excluded.pro_overall,
    games_played=excluded.games_played, win_rate=excluded.win_rate, goals=excluded.goals, assists=excluded.assists, rating_ave=excluded.rating_ave,
    pass_success_rate=excluded.pass_success_rate, shot_success_rate=excluded.shot_success_rate, tackle_success_rate=excluded.tackle_success_rate,
    passes_made=excluded.passes_made, tackles_made=excluded.tackles_made, man_of_the_match=excluded.man_of_the_match, red_cards=excluded.red_cards,
    clean_sheets_def=excluded.clean_sheets_def, clean_sheets_gk=excluded.clean_sheets_gk, prev_goals=excluded.prev_goals, updated_at=now();

  -- ④ Matchs récents (ligue)
  select content::jsonb into v_matches
  from extensions.http(('GET',
    v_base||'clubs/matches?matchType=leagueMatch&platform='||p_platform||'&clubIds='||p_club_id||'&maxResultCount=15',
    v_headers, NULL, NULL)::extensions.http_request);

  for v_match in select value from jsonb_array_elements(v_matches)
  loop
    -- adversaire = première clé de "clubs" différente de notre club
    select k into v_opp_key
    from jsonb_object_keys(v_match->'clubs') as k
    where k <> p_club_id
    limit 1;
    v_opp := v_match->'clubs'->v_opp_key;

    insert into public.proclubs_matches (
      match_id, club_id, played_at, match_type,
      our_score, opp_score, result,
      opponent_name, opponent_club_id, opponent_crest_asset_id, players, updated_at
    ) values (
      v_match->>'matchId', p_club_id, to_timestamp((v_match->>'timestamp')::bigint), 'league',
      (v_match->'clubs'->p_club_id->>'goals')::int,
      (v_opp->>'goals')::int,
      case
        when (v_match->'clubs'->p_club_id->>'goals')::int > (v_opp->>'goals')::int then 'win'
        when (v_match->'clubs'->p_club_id->>'goals')::int < (v_opp->>'goals')::int then 'loss'
        else 'draw'
      end,
      v_opp->'details'->>'name', v_opp_key, v_opp->'details'->'customKit'->>'crestAssetId',
      v_match->'players'->p_club_id, now()
    )
    on conflict (match_id) do update set
      our_score=excluded.our_score, opp_score=excluded.opp_score, result=excluded.result,
      opponent_name=excluded.opponent_name, opponent_crest_asset_id=excluded.opponent_crest_asset_id,
      players=excluded.players, updated_at=now();
  end loop;
end;
$$;

revoke all on function public.refresh_proclubs(text, text) from public, anon;

-- ---------- Planification horaire ----------
-- (relance idempotente : on retire l'ancienne tâche avant de recréer)
select cron.unschedule('proclubs-hourly')
where exists (select 1 from cron.job where jobname = 'proclubs-hourly');

select cron.schedule(
  'proclubs-hourly',
  '0 * * * *',
  $$select public.refresh_proclubs('907897','common-gen5')$$
);

-- Premier remplissage immédiat :
select public.refresh_proclubs('907897','common-gen5');
