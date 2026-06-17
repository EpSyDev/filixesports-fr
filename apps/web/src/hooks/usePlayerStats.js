import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

export const usePlayerStats = (playerId = null) => {
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('player_stats')
        .select('*, player:players(id, name, number, position), match:matches(id, date, opponent)')
        .order('created_at', { ascending: false });
      if (playerId) query = query.eq('playerId', playerId);
      const { data, error } = await query;
      if (error) throw error;
      // Normalise expand pour compatibilité
      const records = data.map(s => ({
        ...s,
        expand: { playerId: s.player, matchId: s.match }
      }));
      setPlayerStats(records);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlayerStats(); }, [playerId]);

  const createPlayerStat = async (data) => {
    const { data: record, error } = await supabase.from('player_stats').insert(data).select().single();
    if (error) throw new Error(error.message);
    await fetchPlayerStats();
    return record;
  };

  const updatePlayerStat = async (id, data) => {
    const { data: record, error } = await supabase.from('player_stats').update(data).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    await fetchPlayerStats();
    return record;
  };

  const deletePlayerStat = async (id) => {
    const { error } = await supabase.from('player_stats').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchPlayerStats();
  };

  return { playerStats, loading, error, createPlayerStat, updatePlayerStat, deletePlayerStat, refetch: fetchPlayerStats };
};
