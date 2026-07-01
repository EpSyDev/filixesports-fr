-- ============================================================
--  Ingestion sécurisée des stats Pro Clubs
--
--  Permet à une machine tierce (PC d'un membre) d'envoyer les
--  stats SANS lui confier la clé service_role. Le script distant
--  n'utilise que la clé anon (publique) + un JETON dédié, à
--  privilège minimal : il ne peut QUE remplir les tables
--  proclubs_*. Révocable en changeant le jeton ci-dessous.
-- ============================================================

-- Table de configuration (1 ligne, jeton non lisible publiquement)
create table if not exists public.proclubs_config (
  id            int primary key default 1,
  ingest_secret text not null,
  constraint proclubs_config_single_row check (id = 1)
);

alter table public.proclubs_config enable row level security;
-- Aucune policy => le jeton n'est jamais lisible via l'API REST.
-- (La fonction ci-dessous, SECURITY DEFINER, y accède quand même.)

insert into public.proclubs_config (id, ingest_secret)
values (1, '9a74927d2fad44c4ac0e89cac230250b66c6f37638df4a17bdb147439dbb2c91')
on conflict (id) do update set ingest_secret = excluded.ingest_secret;

-- Fonction d'ingestion : vérifie le jeton puis upsert les 3 tables.
create or replace function public.ingest_proclubs(
  p_secret  text,
  p_club    jsonb,
  p_players jsonb,
  p_matches jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_id text := p_club->>'club_id';
begin
  if p_secret is null
     or p_secret <> (select ingest_secret from public.proclubs_config where id = 1) then
    raise exception 'Jeton invalide';
  end if;

  -- Club : remplacement de la ligne
  delete from public.proclubs_club where club_id = v_club_id;
  insert into public.proclubs_club
  select * from jsonb_populate_record(null::public.proclubs_club, p_club);

  -- Joueurs : remplacement de l'effectif du club
  delete from public.proclubs_players where club_id = v_club_id;
  insert into public.proclubs_players
  select * from jsonb_populate_recordset(null::public.proclubs_players, p_players);

  -- Matchs : ajout sans écraser l'historique (matchs terminés = figés)
  insert into public.proclubs_matches
  select * from jsonb_populate_recordset(null::public.proclubs_matches, p_matches)
  on conflict (match_id) do nothing;
end;
$$;

-- La clé anon (publique) peut appeler la fonction, mais l'écriture
-- réelle est verrouillée par le jeton vérifié à l'intérieur.
revoke all on function public.ingest_proclubs(text, jsonb, jsonb, jsonb) from public;
grant execute on function public.ingest_proclubs(text, jsonb, jsonb, jsonb) to anon, authenticated;
