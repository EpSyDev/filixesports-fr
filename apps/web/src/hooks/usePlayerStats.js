
import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const usePlayerStats = (playerId = null) => {
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);
      const filter = playerId ? `playerId = "${playerId}"` : '';
      const records = await pb.collection('player_stats').getFullList({
        filter,
        expand: 'playerId,matchId',
        sort: '-matchId.date',
        $autoCancel: false
      });
      setPlayerStats(records);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerStats();
  }, [playerId]);

  const createPlayerStat = async (data) => {
    try {
      const record = await pb.collection('player_stats').create(data, { $autoCancel: false });
      await fetchPlayerStats();
      return record;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const updatePlayerStat = async (id, data) => {
    try {
      const record = await pb.collection('player_stats').update(id, data, { $autoCancel: false });
      await fetchPlayerStats();
      return record;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const deletePlayerStat = async (id) => {
    try {
      await pb.collection('player_stats').delete(id, { $autoCancel: false });
      await fetchPlayerStats();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  return {
    playerStats,
    loading,
    error,
    createPlayerStat,
    updatePlayerStat,
    deletePlayerStat,
    refetch: fetchPlayerStats
  };
};
