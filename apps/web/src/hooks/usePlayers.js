import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

export const usePlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('players').select('*').order('number', { ascending: true });
      if (error) throw error;
      setPlayers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlayers(); }, []);

  const createPlayer = async (data) => {
    const { data: record, error } = await supabase.from('players').insert(data).select().single();
    if (error) throw new Error(error?.message || 'Erreur lors de la création');
    await fetchPlayers();
    return record;
  };

  const updatePlayer = async (id, data) => {
    const { data: record, error } = await supabase.from('players').update(data).eq('id', id).select().single();
    if (error) throw new Error(error?.message || 'Erreur lors de la mise à jour');
    await fetchPlayers();
    return record;
  };

  const deletePlayer = async (id) => {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw new Error(error?.message || 'Erreur lors de la suppression');
    await fetchPlayers();
  };

  return { players, loading, error, createPlayer, updatePlayer, deletePlayer, refetch: fetchPlayers };
};
