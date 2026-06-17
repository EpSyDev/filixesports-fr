
import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { calculateTeamStats, getTeamGoalTrend, getTeamAssistTrend } from '@/utils/stats-aggregation';

export const useTeamStats = () => {
  const [teamStats, setTeamStats] = useState(null);
  const [trends, setTrends] = useState({ goals: [], assists: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch played matches
      const matchesRes = await pb.collection('matches').getList(1, 500, {
        filter: 'status="played"',
        sort: 'date',
        $autoCancel: false
      });
      
      // 2. Fetch all player stats linked to matches
      const statsRes = await pb.collection('player_stats').getList(1, 5000, {
        expand: 'playerId,matchId',
        $autoCancel: false
      });

      const matches = matchesRes.items;
      const playerStats = statsRes.items;

      // 3. Aggregate totals and trends
      setTeamStats(calculateTeamStats(matches, playerStats));
      setTrends({
        goals: getTeamGoalTrend(playerStats, matches),
        assists: getTeamAssistTrend(playerStats, matches)
      });
      
    } catch (err) {
      console.error('Error fetching team stats:', err);
      setError(err.message || 'Une erreur est survenue lors de la récupération des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    teamStats,
    trends,
    loading,
    error,
    refetch: fetchStats
  };
};
