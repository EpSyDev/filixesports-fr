-- ============================================================
-- Filix Esports — Schéma Supabase
-- À exécuter dans SQL Editor > New query
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table public.players (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  number integer not null,
  position text not null,
  "secondaryPosition" text default '',
  created_at timestamptz default now()
);

create table public.competitions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null default 'LIGUE',
  season text default '',
  status text default 'draft',
  description text default '',
  locked boolean default false,
  created_at timestamptz default now()
);

create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  opponent text not null,
  "homeScore" integer,
  "awayScore" integer,
  competition uuid references public.competitions(id) on delete set null,
  formation text default '',
  status text not null default 'scheduled',
  notes text default '',
  created_at timestamptz default now()
);

create table public.player_stats (
  id uuid primary key default uuid_generate_v4(),
  "playerId" uuid not null references public.players(id) on delete cascade,
  "matchId" uuid not null references public.matches(id) on delete cascade,
  goals integer default 0,
  assists integer default 0,
  shots integer default 0,
  passes integer default 0,
  tackles integer default 0,
  rating numeric(3,1),
  "yellowCards" integer default 0,
  "redCards" integer default 0,
  notes text default '',
  created_at timestamptz default now(),
  unique("playerId", "matchId")
);

create table public.trophies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  year integer not null,
  competition text default '',
  description text default '',
  image text default '',
  created_at timestamptz default now()
);

create table public.media (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  type text default 'image',
  url text default '',
  file text default '',
  "uploadDate" timestamptz default now(),
  created_at timestamptz default now()
);

create table public.formations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  tactic text default '3-5-2',
  players jsonb default '[]',
  created_at timestamptz default now()
);

-- ---- Ligue ----

create table public.league_teams (
  id uuid primary key default uuid_generate_v4(),
  "competitionId" uuid not null references public.competitions(id) on delete cascade,
  "teamName" text not null,
  "isOurTeam" boolean default false,
  created_at timestamptz default now()
);

create table public.league_matches (
  id uuid primary key default uuid_generate_v4(),
  "competitionId" uuid not null references public.competitions(id) on delete cascade,
  "homeTeam" text not null,
  "awayTeam" text not null,
  "homeScore" integer,
  "awayScore" integer,
  matchday integer default 1,
  status text default 'scheduled',
  created_at timestamptz default now()
);

create table public.league_standings (
  id uuid primary key default uuid_generate_v4(),
  "competitionId" uuid not null references public.competitions(id) on delete cascade,
  "teamName" text not null,
  played integer default 0,
  won integer default 0,
  drawn integer default 0,
  lost integer default 0,
  "goalsFor" integer default 0,
  "goalsAgainst" integer default 0,
  points integer default 0,
  rank integer default 0,
  created_at timestamptz default now()
);

-- ---- Tournoi (poules + élimination) ----

create table public.tournament_teams (
  id uuid primary key default uuid_generate_v4(),
  "competitionId" uuid not null references public.competitions(id) on delete cascade,
  "teamName" text not null,
  "isOurTeam" boolean default false,
  "poolId" text default '',
  created_at timestamptz default now()
);

create table public.tournament_pools (
  id uuid primary key default uuid_generate_v4(),
  "competitionId" uuid not null references public.competitions(id) on delete cascade,
  "poolId" text not null,
  name text not null,
  created_at timestamptz default now()
);

create table public.pool_matches (
  id uuid primary key default uuid_generate_v4(),
  "competitionId" uuid not null references public.competitions(id) on delete cascade,
  "poolId" text not null,
  "homeTeam" text not null,
  "awayTeam" text not null,
  "homeScore" integer,
  "awayScore" integer,
  status text default 'scheduled',
  created_at timestamptz default now()
);

create table public.pool_standings (
  id uuid primary key default uuid_generate_v4(),
  "competitionId" uuid not null references public.competitions(id) on delete cascade,
  "poolId" text not null,
  "teamName" text not null,
  played integer default 0,
  won integer default 0,
  drawn integer default 0,
  lost integer default 0,
  "goalsFor" integer default 0,
  "goalsAgainst" integer default 0,
  points integer default 0,
  rank integer default 0,
  qualified boolean default false,
  created_at timestamptz default now()
);

create table public.knockout_matches (
  id uuid primary key default uuid_generate_v4(),
  "competitionId" uuid not null references public.competitions(id) on delete cascade,
  round text not null,
  "matchNumber" integer not null,
  "homeTeam" text default '',
  "awayTeam" text default '',
  "homeScore" integer,
  "awayScore" integer,
  winner text default '',
  status text default 'scheduled',
  "nextMatchId" uuid,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS — lecture publique, écriture authentifiée
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array[
    'players','matches','player_stats','competitions','trophies','media','formations',
    'league_teams','league_matches','league_standings',
    'tournament_teams','tournament_pools','pool_matches','pool_standings','knockout_matches'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "lecture publique" on public.%I for select using (true)', t);
    execute format('create policy "ecriture admin" on public.%I for all using (auth.role() = ''authenticated'')', t);
  end loop;
end;
$$;

-- ============================================================
-- STORAGE
-- ============================================================

insert into storage.buckets (id, name, public) values ('media', 'media', true);
insert into storage.buckets (id, name, public) values ('trophies', 'trophies', true);
insert into storage.buckets (id, name, public) values ('players', 'players', true);

create policy "lecture publique storage" on storage.objects
  for select using (bucket_id in ('media', 'trophies', 'players'));

create policy "upload admin" on storage.objects
  for insert with check (auth.role() = 'authenticated' and bucket_id in ('media', 'trophies', 'players'));

create policy "delete admin" on storage.objects
  for delete using (auth.role() = 'authenticated' and bucket_id in ('media', 'trophies', 'players'));

-- ============================================================
-- REALTIME
-- ============================================================

alter publication supabase_realtime add table public.competitions;
alter publication supabase_realtime add table public.league_matches;
alter publication supabase_realtime add table public.league_standings;
alter publication supabase_realtime add table public.pool_matches;
alter publication supabase_realtime add table public.pool_standings;
alter publication supabase_realtime add table public.knockout_matches;
alter publication supabase_realtime add table public.tournament_teams;
