
import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('matches').getFullList({
        sort: '-date',
        expand: 'competition',
        $autoCancel: false
      });
      setMatches(records);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const createMatch = async (data) => {
    try {
      const record = await pb.collection('matches').create(data, { $autoCancel: false });
      await fetchMatches();
      return record;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const updateMatch = async (id, data) => {
    try {
      const record = await pb.collection('matches').update(id, data, { $autoCancel: false });
      await fetchMatches();
      return record;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const deleteMatch = async (id) => {
    try {
      // First, fetch and delete ALL associated player_stats for this match
      const stats = await pb.collection('player_stats').getList(1, 500, {
        filter: `matchId="${id}"`,
        $autoCancel: false
      });
      
      for (const stat of stats.items) {
        await pb.collection('player_stats').delete(stat.id, { $autoCancel: false });
      }

      // Then delete the match itself
      await pb.collection('matches').delete(id, { $autoCancel: false });
      await fetchMatches();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  return {
    matches,
    loading,
    error,
    createMatch,
    updateMatch,
    deleteMatch,
    refetch: fetchMatches
  };
};
