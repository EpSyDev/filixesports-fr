
export const cleanTeamName = (teamName) => {
  if (!teamName) return teamName;
  return teamName.replace(/^([A-Z]\.|[A-Z]\s|U\d{1,2}\s)+/i, '').trim();
};

export const generateRoundRobinMatches = (teams) => {
  const matches = [];
  const tempTeams = [...teams];
  
  if (tempTeams.length % 2 !== 0) {
    tempTeams.push({ teamName: 'BYE', isBye: true });
  }
  
  const totalRounds = tempTeams.length - 1;
  const halfSize = tempTeams.length / 2;
  
  for (let round = 0; round < totalRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const home = tempTeams[i];
      const away = tempTeams[tempTeams.length - 1 - i];
      
      if (!home.isBye && !away.isBye) {
        matches.push({
          matchday: round + 1,
          homeTeam: home.teamName,
          awayTeam: away.teamName,
          status: 'scheduled'
        });
      }
    }
    tempTeams.splice(1, 0, tempTeams.pop());
  }
  
  return matches;
};

export const generatePoolMatches = (pools, competitionId) => {
  const allMatches = [];
  pools.forEach(pool => {
    const poolMatches = generateRoundRobinMatches(pool.teams);
    poolMatches.forEach(m => {
      allMatches.push({
        competitionId,
        poolId: pool.poolId,
        matchday: m.matchday,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        status: 'scheduled'
      });
    });
  });
  return allMatches;
};

export const generatePoolStandings = (pools, competitionId) => {
  const standings = [];
  pools.forEach(pool => {
    pool.teams.forEach(team => {
      standings.push({
        competitionId,
        poolId: pool.poolId,
        team: team.teamName,
        teamName: team.teamName,
        played: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        rank: 0,
        qualified: false
      });
    });
  });
  return standings;
};

export const validatePoolAssignments = (pools) => {
  if (!pools || pools.length === 0) return false;
  const allTeams = new Set();
  for (const pool of pools) {
    if (!pool.teams || pool.teams.length !== 4) return false;
    for (const team of pool.teams) {
      if (allTeams.has(team.id)) return false;
      allTeams.add(team.id);
    }
  }
  return allTeams.size === pools.length * 4;
};

export const calculateLeagueStandings = (matches, teams) => {
  const standings = teams.reduce((acc, team) => {
    acc[team.teamName] = { 
      teamName: team.teamName, 
      played: 0, won: 0, drawn: 0, lost: 0, 
      points: 0, goalsFor: 0, goalsAgainst: 0 
    };
    return acc;
  }, {});

  matches.forEach(m => {
    if (m.status === 'played') {
      const h = standings[m.homeTeam];
      const a = standings[m.awayTeam];
      if (!h || !a) return;
      
      h.played++; a.played++;
      h.goalsFor += (m.homeScore || 0);
      h.goalsAgainst += (m.awayScore || 0);
      a.goalsFor += (m.awayScore || 0);
      a.goalsAgainst += (m.homeScore || 0);
      
      if (m.homeScore > m.awayScore) { 
        h.won++; h.points += 3; a.lost++; 
      } else if (m.homeScore < m.awayScore) { 
        a.won++; a.points += 3; h.lost++; 
      } else { 
        h.drawn++; a.drawn++; h.points += 1; a.points += 1; 
      }
    }
  });

  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const bGD = b.goalsFor - b.goalsAgainst;
    const aGD = a.goalsFor - a.goalsAgainst;
    if (bGD !== aGD) return bGD - aGD;
    return b.goalsFor - a.goalsFor;
  }).map((s, i) => ({ ...s, rank: i + 1, qualified: i < 2 }));
};

export const calculatePoolStandings = (poolMatches, poolTeams) => {
  return calculateLeagueStandings(poolMatches, poolTeams);
};

export const getTopTeamsFromPools = (poolsData) => {
  const topTeams = [];
  Object.values(poolsData).forEach(standings => {
    if (standings.length >= 2) {
      topTeams.push(standings[0]);
      topTeams.push(standings[1]);
    }
  });
  
  return topTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const bGD = b.goalsFor - b.goalsAgainst;
    const aGD = a.goalsFor - a.goalsAgainst;
    return bGD - aGD;
  });
};

export const generateKnockoutBracket = (qualifiedTeams, competitionId) => {
  const matches = [];
  
  if (!qualifiedTeams || qualifiedTeams.length < 2) {
    throw new Error('Au moins 2 équipes sont requises pour générer l\'arbre.');
  }

  const sortedTeams = [...qualifiedTeams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const bGD = (b.goalsFor || 0) - (b.goalsAgainst || 0);
    const aGD = (a.goalsFor || 0) - (a.goalsAgainst || 0);
    return bGD - aGD;
  });

  const numTeams = sortedTeams.length;
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  
  const teamNames = sortedTeams.map(t => t.teamName);
  
  while (teamNames.length < nextPowerOf2) {
    teamNames.push('BYE');
  }
  
  const seededPairs = [];
  for (let i = 0; i < nextPowerOf2 / 2; i++) {
    seededPairs.push([teamNames[i], teamNames[nextPowerOf2 - 1 - i]]);
  }

  for (let i = 0; i < nextPowerOf2 / 2; i++) {
    const home = seededPairs[i][0] || null;
    const away = seededPairs[i][1] || null;
    
    matches.push({
      competitionId,
      round: String(nextPowerOf2),
      matchNumber: i + 1,
      homeTeam: home,
      awayTeam: away,
      winner: null,
      status: 'scheduled'
    });
  }

  let r = nextPowerOf2 / 2;
  while (r >= 2) {
    for (let i = 0; i < r / 2; i++) {
      matches.push({
        competitionId,
        round: String(r),
        matchNumber: i + 1,
        homeTeam: null,
        awayTeam: null,
        winner: null,
        status: 'scheduled'
      });
    }
    r = r / 2;
  }

  return matches;
};

export const generateKnockoutBracketFromPools = (competitionId, qualifiedTeams) => {
  const matches = [];
  
  if (!qualifiedTeams || qualifiedTeams.length < 2) {
    throw new Error('Au moins 2 équipes sont requises pour générer l\'arbre.');
  }

  const sortedTeams = [...qualifiedTeams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const bGD = (b.goalsFor || 0) - (b.goalsAgainst || 0);
    const aGD = (a.goalsFor || 0) - (a.goalsAgainst || 0);
    return bGD - aGD;
  });

  const numTeams = sortedTeams.length;
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  
  const teamNames = sortedTeams.map(t => t.teamName);
  
  while (teamNames.length < nextPowerOf2) {
    teamNames.push('BYE');
  }
  
  const seededPairs = [];
  for (let i = 0; i < nextPowerOf2 / 2; i++) {
    seededPairs.push([teamNames[i], teamNames[nextPowerOf2 - 1 - i]]);
  }

  for (let i = 0; i < nextPowerOf2 / 2; i++) {
    const home = seededPairs[i][0] || null;
    const away = seededPairs[i][1] || null;
    
    matches.push({
      competitionId,
      round: String(nextPowerOf2),
      matchNumber: i + 1,
      homeTeam: home,
      awayTeam: away,
      winner: null,
      status: 'scheduled'
    });
  }

  let r = nextPowerOf2 / 2;
  while (r >= 2) {
    for (let i = 0; i < r / 2; i++) {
      matches.push({
        competitionId,
        round: String(r),
        matchNumber: i + 1,
        homeTeam: null,
        awayTeam: null,
        winner: null,
        status: 'scheduled'
      });
    }
    r = r / 2;
  }

  return matches;
};

export const calculateKnockoutWinner = (homeScore, awayScore, homeTeam, awayTeam) => {
  if (homeScore === null || awayScore === null) return null;
  if (homeScore > awayScore) return homeTeam;
  if (awayScore > homeScore) return awayTeam;
  return null; 
};

export const checkIfRoundComplete = (competitionId, round, allMatches) => {
  const roundMatches = allMatches.filter(m => String(m.round) === String(round));
  if (roundMatches.length === 0) return false;
  return roundMatches.every(m => m.status === 'played' || m.status === 'cancelled');
};

export const getWinnersFromRound = (competitionId, round, allMatches) => {
  return allMatches
    .filter(m => String(m.round) === String(round))
    .sort((a, b) => a.matchNumber - b.matchNumber)
    .map(m => m.winner || m.homeTeam);
};

export const autoGenerateNextRound = (competitionId, currentRound, winners, allMatches) => {
  if (currentRound === '2' || currentRound === '1') return [];
  
  const nextRound = String(parseInt(currentRound) / 2);
  const nextMatches = [];

  for (let i = 0; i < winners.length; i += 2) {
    const homeTeam = winners[i];
    const awayTeam = winners[i + 1] || null;
    const matchNumber = (i / 2) + 1;

    const existingMatch = allMatches.find(m => String(m.round) === nextRound && m.matchNumber === matchNumber);

    if (existingMatch) {
      nextMatches.push({
        ...existingMatch,
        homeTeam,
        awayTeam,
        status: existingMatch.status === 'played' ? 'played' : 'scheduled'
      });
    } else {
      nextMatches.push({
        competitionId,
        round: nextRound,
        matchNumber,
        homeTeam,
        awayTeam,
        winner: null,
        status: 'scheduled'
      });
    }
  }
  return nextMatches;
};

export const advanceWinnerToNextRound = (winner, currentRound, matchNumber, allMatches) => {
  if (currentRound === '2' || currentRound === '1') return null; 

  const nextRound = String(parseInt(currentRound) / 2);
  const nextMatchNumber = Math.ceil(matchNumber / 2);
  const isHome = matchNumber % 2 !== 0;
  
  const nextMatch = allMatches.find(m => String(m.round) === nextRound && m.matchNumber === nextMatchNumber);
  
  if (nextMatch) {
    return {
      isNew: false,
      matchId: nextMatch.id,
      updates: isHome ? { homeTeam: winner } : { awayTeam: winner }
    };
  }
  
  return {
    isNew: true,
    newMatch: {
      round: nextRound,
      matchNumber: nextMatchNumber,
      homeTeam: isHome ? winner : null,
      awayTeam: !isHome ? winner : null,
      status: 'scheduled'
    }
  };
};

export const updateKnockoutBracketAfterMatch = (match, winner, allMatches) => {
  return advanceWinnerToNextRound(winner, match.round, match.matchNumber, allMatches);
};

export const getKnockoutBracketStatus = (matches) => {
  if (!matches || matches.length === 0) return { status: 'not_started', progress: 0 };
  
  const played = matches.filter(m => m.status === 'played').length;
  const total = matches.length;
  const finalMatch = matches.find(m => m.round === '2');
  
  if (finalMatch && finalMatch.status === 'played' && finalMatch.winner) {
    return { status: 'completed', progress: 100, winner: finalMatch.winner };
  }
  
  return { 
    status: played > 0 ? 'in_progress' : 'scheduled', 
    progress: Math.round((played / total) * 100) 
  };
};

export const isKnockoutMatchStarted = async (competitionId) => {
  try {
    const { default: supabase } = await import('@/lib/supabaseClient');
    const { data, error } = await supabase.from('knockout_matches')
      .select('id').eq('competitionId', competitionId).eq('status', 'played').limit(1);
    if (error) throw error;
    return data.length > 0;
  } catch (error) {
    console.error('Error checking knockout match status:', error);
    return false;
  }
};

export const validateQualifiedTeamsCount = (poolCount, qualifiedTeamsCount) => {
  return qualifiedTeamsCount >= 2;
};

// Quand une demi-finale est jouée, le perdant va au match de 3e place (round '1')
export const getSemiLoserAdvancement = (loser, matchNumber, allMatches) => {
  const thirdPlaceMatch = allMatches.find(m => String(m.round) === '1');
  const isHome = matchNumber === 1;

  if (thirdPlaceMatch) {
    return {
      isNew: false,
      matchId: thirdPlaceMatch.id,
      updates: isHome ? { homeTeam: loser } : { awayTeam: loser }
    };
  }
  return null;
};

// Génère un bracket avec les paires du premier tour définies par l'admin.
// firstRoundPairings: [{home: string|null, away: string|null|'BYE'}, ...]
export const generateKnockoutBracketWithSeeding = (firstRoundPairings, competitionId) => {
  const numFirstRoundMatches = firstRoundPairings.length;
  const bracketSize = numFirstRoundMatches * 2;
  const matches = [];

  firstRoundPairings.forEach((pairing, i) => {
    const isBye = !pairing.away || pairing.away === 'BYE';
    matches.push({
      competitionId,
      round: String(bracketSize),
      matchNumber: i + 1,
      homeTeam: pairing.home || null,
      awayTeam: isBye ? null : pairing.away,
      winner: null,
      status: 'scheduled'
    });
  });

  // Rounds suivants vides
  let r = bracketSize / 2;
  while (r >= 2) {
    for (let i = 0; i < r / 2; i++) {
      matches.push({
        competitionId,
        round: String(r),
        matchNumber: i + 1,
        homeTeam: null,
        awayTeam: null,
        winner: null,
        status: 'scheduled'
      });
    }
    r = r / 2;
  }

  // Match de 3e place (petite finale) si au moins des demi-finales
  if (bracketSize >= 4) {
    matches.push({
      competitionId,
      round: '1',
      matchNumber: 1,
      homeTeam: null,
      awayTeam: null,
      winner: null,
      status: 'scheduled'
    });
  }

  return matches;
};
