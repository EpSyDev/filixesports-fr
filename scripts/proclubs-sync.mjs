#!/usr/bin/env node
// ============================================================
//  Synchronisation EA Pro Clubs → Supabase
//  Récupère les stats du club sur l'API EA et les upsert dans
//  les tables proclubs_*. Sans dépendance (fetch natif Node 18+).
//
//  Variables d'environnement requises :
//    SUPABASE_URL                ex. https://xxxx.supabase.co
//    SUPABASE_SERVICE_ROLE_KEY   clé service_role (jamais côté client)
//  Optionnelles :
//    PROCLUBS_CLUB_ID   (défaut 907897)
//    PROCLUBS_PLATFORM  (défaut common-gen5)
//
//  Lancement : node scripts/proclubs-sync.mjs
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLUB_ID = process.env.PROCLUBS_CLUB_ID || '907897';
const PLATFORM = process.env.PROCLUBS_PLATFORM || 'common-gen5';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
  process.exit(1);
}

const EA_BASE = 'https://proclubs.ea.com/api/fc/';
const EA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.ea.com/',
  Origin: 'https://www.ea.com',
  'Accept-Language': 'en-US,en;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
};

const num = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

async function eaFetch(path, tries = 3) {
  const url = EA_BASE + path;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: EA_HEADERS });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (text.trimStart().startsWith('<')) throw new Error('Réponse HTML (blocage Akamai / IP refusée)');
      return JSON.parse(text);
    } catch (err) {
      if (i === tries) throw new Error(`EA ${path} → ${err.message}`);
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

async function upsert(table, rows, onConflict) {
  if (!rows || (Array.isArray(rows) && rows.length === 0)) return;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`,
    {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase upsert ${table} → HTTP ${res.status} ${body}`);
  }
}

async function main() {
  const nowIso = new Date().toISOString();

  // ① Infos club + ② bilan global
  const info = await eaFetch(`clubs/info?platform=${PLATFORM}&clubIds=${CLUB_ID}`);
  const overallArr = await eaFetch(`clubs/overallStats?platform=${PLATFORM}&clubIds=${CLUB_ID}`);
  const club = info?.[CLUB_ID] || {};
  const o = overallArr?.[0] || {};

  await upsert('proclubs_club', {
    club_id: CLUB_ID,
    name: club.name ?? null,
    stadium: club.customKit?.stadName ?? null,
    crest_asset_id: club.customKit?.crestAssetId ?? null,
    platform: PLATFORM,
    games_played: num(o.gamesPlayed),
    wins: num(o.wins),
    ties: num(o.ties),
    losses: num(o.losses),
    goals: num(o.goals),
    goals_against: num(o.goalsAgainst),
    promotions: num(o.promotions),
    relegations: num(o.relegations),
    best_division: num(o.bestDivision),
    games_played_playoff: num(o.gamesPlayedPlayoff),
    skill_rating: num(o.skillRating),
    reputation_tier: num(o.reputationtier),
    league_appearances: num(o.leagueAppearances),
    updated_at: nowIso,
  }, 'club_id');

  // ③ Joueurs
  const members = await eaFetch(`members/stats?platform=${PLATFORM}&clubId=${CLUB_ID}`);
  const playerRows = (members?.members || []).map((m) => ({
    club_id: CLUB_ID,
    name: m.name,
    pro_name: m.proName ?? null,
    favorite_position: m.favoritePosition ?? null,
    pro_pos: m.proPos ?? null,
    pro_overall: num(m.proOverall),
    games_played: num(m.gamesPlayed),
    win_rate: num(m.winRate),
    goals: num(m.goals),
    assists: num(m.assists),
    rating_ave: num(m.ratingAve),
    pass_success_rate: num(m.passSuccessRate),
    shot_success_rate: num(m.shotSuccessRate),
    tackle_success_rate: num(m.tackleSuccessRate),
    passes_made: num(m.passesMade),
    tackles_made: num(m.tacklesMade),
    man_of_the_match: num(m.manOfTheMatch),
    red_cards: num(m.redCards),
    clean_sheets_def: num(m.cleanSheetsDef),
    clean_sheets_gk: num(m.cleanSheetsGK),
    prev_goals: [1,2,3,4,5,6,7,8,9,10].map((i) => num(m[`prevGoals${i}`])),
    updated_at: nowIso,
  }));
  await upsert('proclubs_players', playerRows, 'club_id,name');

  // ④ Matchs récents (ligue)
  const matches = await eaFetch(`clubs/matches?matchType=leagueMatch&platform=${PLATFORM}&clubIds=${CLUB_ID}&maxResultCount=15`);
  const matchRows = (matches || []).map((mt) => {
    const oppKey = Object.keys(mt.clubs || {}).find((k) => k !== CLUB_ID);
    const us = mt.clubs?.[CLUB_ID] || {};
    const opp = mt.clubs?.[oppKey] || {};
    const ourScore = num(us.goals);
    const oppScore = num(opp.goals);
    return {
      match_id: mt.matchId,
      club_id: CLUB_ID,
      played_at: mt.timestamp ? new Date(mt.timestamp * 1000).toISOString() : null,
      match_type: 'league',
      our_score: ourScore,
      opp_score: oppScore,
      result: ourScore > oppScore ? 'win' : ourScore < oppScore ? 'loss' : 'draw',
      opponent_name: opp.details?.name ?? null,
      opponent_club_id: oppKey ?? null,
      opponent_crest_asset_id: opp.details?.customKit?.crestAssetId ?? null,
      players: mt.players?.[CLUB_ID] ?? null,
      updated_at: nowIso,
    };
  });
  await upsert('proclubs_matches', matchRows, 'match_id');

  console.log(`✅ Sync OK — ${club.name || CLUB_ID} : ${playerRows.length} joueurs, ${matchRows.length} matchs.`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
