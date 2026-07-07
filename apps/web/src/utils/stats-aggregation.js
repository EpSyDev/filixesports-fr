
const EMPTY_PLAYER_STATS = {
  totalGoals: 0,
  totalAssists: 0,
  totalShots: 0,
  totalPasses: 0,
  totalTackles: 0,
  totalOffsides: 0,
  totalBallsRecovered: 0,
  totalBallsLost: 0,
  avgPassAccuracy: 0,
  avgShotAccuracy: 0,
  totalMatches: 0,
  averageRating: 0,
  yellowCards: 0,
  redCards: 0,
  motm: 0,
  // gardiens
  totalShotsFaced: 0,
  totalShotsOnTargetFaced: 0,
  totalSaves: 0,
  totalGoalsConceded: 0,
  totalPenaltiesSaved: 0,
  totalPenaltyGoalsConceded: 0,
};

export const calculatePlayerStats = (playerStats) => {
  if (!playerStats || playerStats.length === 0) {
    return { ...EMPTY_PLAYER_STATS };
  }

  // Un match est compté comme joué dès qu'une note est saisie ou qu'une stat
  // réelle existe — on ignore les lignes « fantômes » entièrement vides.
  const hasPlayed = (stat) =>
    (stat.rating != null && stat.rating !== '') ||
    stat.goals > 0 || stat.assists > 0 || stat.shots > 0 ||
    stat.passes > 0 || stat.tackles > 0 ||
    stat.offsides > 0 || stat.balls_recovered > 0 || stat.balls_lost > 0 ||
    stat.pass_accuracy != null || stat.shot_accuracy != null ||
    stat.shots_faced > 0 || stat.shots_on_target_faced > 0 || stat.saves > 0 ||
    stat.goals_conceded > 0 || stat.penalties_saved > 0 || stat.penalty_goals_conceded > 0 ||
    stat.yellowCards > 0 || stat.redCards > 0 ||
    (stat.notes || '').includes('MOTM');

  const totals = playerStats.reduce((acc, stat) => {
    return {
      goals: acc.goals + (stat.goals || 0),
      assists: acc.assists + (stat.assists || 0),
      shots: acc.shots + (stat.shots || 0),
      passes: acc.passes + (stat.passes || 0),
      tackles: acc.tackles + (stat.tackles || 0),
      offsides: acc.offsides + (stat.offsides || 0),
      ballsRecovered: acc.ballsRecovered + (stat.balls_recovered || 0),
      ballsLost: acc.ballsLost + (stat.balls_lost || 0),
      passAccuracies: stat.pass_accuracy != null ? [...acc.passAccuracies, stat.pass_accuracy] : acc.passAccuracies,
      shotAccuracies: stat.shot_accuracy != null ? [...acc.shotAccuracies, stat.shot_accuracy] : acc.shotAccuracies,
      shotsFaced: acc.shotsFaced + (stat.shots_faced || 0),
      shotsOnTargetFaced: acc.shotsOnTargetFaced + (stat.shots_on_target_faced || 0),
      saves: acc.saves + (stat.saves || 0),
      goalsConceded: acc.goalsConceded + (stat.goals_conceded || 0),
      penaltiesSaved: acc.penaltiesSaved + (stat.penalties_saved || 0),
      penaltyGoalsConceded: acc.penaltyGoalsConceded + (stat.penalty_goals_conceded || 0),
      matches: acc.matches + (hasPlayed(stat) ? 1 : 0),
      ratings: stat.rating ? [...acc.ratings, stat.rating] : acc.ratings,
      yellowCards: acc.yellowCards + (stat.yellowCards || 0),
      redCards: acc.redCards + (stat.redCards || 0),
      motm: acc.motm + ((stat.notes || '').includes('MOTM') ? 1 : 0)
    };
  }, {
    goals: 0, assists: 0, shots: 0, passes: 0, tackles: 0,
    offsides: 0, ballsRecovered: 0, ballsLost: 0, passAccuracies: [], shotAccuracies: [],
    shotsFaced: 0, shotsOnTargetFaced: 0, saves: 0, goalsConceded: 0, penaltiesSaved: 0, penaltyGoalsConceded: 0,
    matches: 0, ratings: [], yellowCards: 0, redCards: 0, motm: 0
  });

  const avg = (arr) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  return {
    totalGoals: totals.goals,
    totalAssists: totals.assists,
    totalShots: totals.shots,
    totalPasses: totals.passes,
    totalTackles: totals.tackles,
    totalOffsides: totals.offsides,
    totalBallsRecovered: totals.ballsRecovered,
    totalBallsLost: totals.ballsLost,
    avgPassAccuracy: Math.round(avg(totals.passAccuracies)),
    avgShotAccuracy: Math.round(avg(totals.shotAccuracies)),
    totalMatches: totals.matches,
    averageRating: parseFloat(avg(totals.ratings).toFixed(1)),
    yellowCards: totals.yellowCards,
    redCards: totals.redCards,
    motm: totals.motm,
    totalShotsFaced: totals.shotsFaced,
    totalShotsOnTargetFaced: totals.shotsOnTargetFaced,
    totalSaves: totals.saves,
    totalGoalsConceded: totals.goalsConceded,
    totalPenaltiesSaved: totals.penaltiesSaved,
    totalPenaltyGoalsConceded: totals.penaltyGoalsConceded,
  };
};

export const calculateTeamStats = (matches, playerStats) => {
  const safeMatches = matches || [];
  const safeStats = playerStats || [];

  const playedMatches = safeMatches.filter(m => m.status === 'played');
  
  // Calculate traditional team match outcomes
  const matchResults = playedMatches.reduce((acc, match) => {
    const goalsScored = match.homeScore || 0;
    const goalsConceded = match.awayScore || 0;

    let result = 'draw';
    if (goalsScored > goalsConceded) result = 'win';
    if (goalsScored < goalsConceded) result = 'loss';

    return {
      wins: acc.wins + (result === 'win' ? 1 : 0),
      draws: acc.draws + (result === 'draw' ? 1 : 0),
      losses: acc.losses + (result === 'loss' ? 1 : 0),
      goalsScored: acc.goalsScored + goalsScored,
      goalsConceded: acc.goalsConceded + goalsConceded
    };
  }, { wins: 0, draws: 0, losses: 0, goalsScored: 0, goalsConceded: 0 });

  // Calculate new aggregate metrics from player_stats
  const totalGoals = safeStats.reduce((sum, s) => sum + (s.goals || 0), 0);
  const totalAssists = safeStats.reduce((sum, s) => sum + (s.assists || 0), 0);
  const totalShots = safeStats.reduce((sum, s) => sum + (s.shots || 0), 0);
  const totalPasses = safeStats.reduce((sum, s) => sum + (s.passes || 0), 0);
  const totalTackles = safeStats.reduce((sum, s) => sum + (s.tackles || 0), 0);
  
  // Count unique players with at least one yellow/red card
  const yellowCardCount = new Set(safeStats.filter(s => s.yellowCards > 0).map(s => s.playerId)).size;
  const redCardCount = new Set(safeStats.filter(s => s.redCards > 0).map(s => s.playerId)).size;
  
  // Average rating across all non-zero ratings
  const ratedStats = safeStats.filter(s => s.rating && s.rating > 0);
  const averageRating = ratedStats.length > 0 
    ? (ratedStats.reduce((sum, s) => sum + s.rating, 0) / ratedStats.length)
    : 0;

  const totalMatches = playedMatches.length;
  const winRate = totalMatches > 0 ? (matchResults.wins / totalMatches) * 100 : 0;
  const goalDifference = matchResults.goalsScored - matchResults.goalsConceded;

  return {
    totalMatches,
    matchesPlayed: totalMatches, // Alias for consistency
    wins: matchResults.wins,
    draws: matchResults.draws,
    losses: matchResults.losses,
    winRate: parseFloat(winRate.toFixed(1)),
    goalsScored: matchResults.goalsScored,
    goalsConceded: matchResults.goalsConceded,
    goalDifference,
    // New metrics
    totalGoals,
    totalAssists,
    totalShots,
    totalPasses,
    totalTackles,
    yellowCardCount,
    redCardCount,
    averageRating: parseFloat(averageRating.toFixed(2))
  };
};

export const getTeamGoalTrend = (playerStats, matches) => {
  if (!matches || matches.length === 0) return [];
  
  const matchMap = {};
  matches.forEach(m => {
    if (m.status === 'played') {
      matchMap[m.id] = { 
        matchId: m.id, 
        name: m.opponent || 'Inconnu', 
        goals: 0, 
        date: m.date 
      };
    }
  });

  (playerStats || []).forEach(s => {
    if (s.matchId && matchMap[s.matchId]) {
      matchMap[s.matchId].goals += (s.goals || 0);
    }
  });

  return Object.values(matchMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(m => ({ name: m.name, goals: m.goals }));
};

export const getTeamAssistTrend = (playerStats, matches) => {
  if (!matches || matches.length === 0) return [];
  
  const matchMap = {};
  matches.forEach(m => {
    if (m.status === 'played') {
      matchMap[m.id] = { 
        matchId: m.id, 
        name: m.opponent || 'Inconnu', 
        assists: 0, 
        date: m.date 
      };
    }
  });

  (playerStats || []).forEach(s => {
    if (s.matchId && matchMap[s.matchId]) {
      matchMap[s.matchId].assists += (s.assists || 0);
    }
  });

  return Object.values(matchMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(m => ({ name: m.name, assists: m.assists }));
};

export const getTopScorers = (players, playerStats) => {
  const playerGoals = {};

  playerStats.forEach(stat => {
    if (!playerGoals[stat.playerId]) {
      playerGoals[stat.playerId] = 0;
    }
    playerGoals[stat.playerId] += stat.goals || 0;
  });

  return players
    .map(player => ({
      ...player,
      goals: playerGoals[player.id] || 0
    }))
    .filter(p => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10);
};

export const getTopAssists = (players, playerStats) => {
  const playerAssists = {};

  playerStats.forEach(stat => {
    if (!playerAssists[stat.playerId]) {
      playerAssists[stat.playerId] = 0;
    }
    playerAssists[stat.playerId] += stat.assists || 0;
  });

  return players
    .map(player => ({
      ...player,
      assists: playerAssists[player.id] || 0
    }))
    .filter(p => p.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 10);
};
