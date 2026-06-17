import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';

export const useCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCompetitions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();

    const channel = supabase.channel('competitions-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, () => {
        fetchCompetitions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchCompetitions]);

  const createCompetition = async (data) => {
    const { data: record, error } = await supabase.from('competitions').insert(data).select().single();
    if (error) throw new Error(error.message);
    return record;
  };

  const updateCompetition = async (id, data) => {
    const { data: record, error } = await supabase.from('competitions').update(data).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return record;
  };

  const deleteCompetition = async (id) => {
    const { error } = await supabase.from('competitions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  };

  return { competitions, loading, error, createCompetition, updateCompetition, deleteCompetition, refetch: fetchCompetitions };
};
