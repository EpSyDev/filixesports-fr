import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

export const useMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select('*, competition_data:competitions(id, name, type)')
        .order('date', { ascending: false });
      if (error) throw error;
      // Normalise pour compatibilité avec les composants existants
      const records = data.map(m => ({
        ...m,
        expand: m.competition_data ? { competition: m.competition_data } : {}
      }));
      setMatches(records);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatches(); }, []);

  const createMatch = async (data) => {
    const { data: record, error } = await supabase.from('matches').insert(data).select().single();
    if (error) throw new Error(error.message);
    await fetchMatches();
    return record;
  };

  const updateMatch = async (id, data) => {
    const { data: record, error } = await supabase.from('matches').update(data).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    await fetchMatches();
    return record;
  };

  const deleteMatch = async (id) => {
    // La FK ON DELETE CASCADE supprime les player_stats automatiquement
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchMatches();
  };

  return { matches, loading, error, createMatch, updateMatch, deleteMatch, refetch: fetchMatches };
};
