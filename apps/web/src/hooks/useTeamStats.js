import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';
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
      const [matchesRes, statsRes] = await Promise.all([
        supabase.from('matches').select('*').eq('status', 'played').order('date', { ascending: true }),
        supabase.from('player_stats').select('*')
      ]);
      if (matchesRes.error) throw matchesRes.error;
      if (statsRes.error) throw statsRes.error;

      const matches = matchesRes.data;
      const playerStats = statsRes.data;

      setTeamStats(calculateTeamStats(matches, playerStats));
      setTrends({
        goals: getTeamGoalTrend(playerStats, matches),
        assists: getTeamAssistTrend(playerStats, matches)
      });
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { teamStats, trends, loading, error, refetch: fetchStats };
};
