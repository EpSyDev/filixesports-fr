import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { toast } from 'sonner';

export const useCompetitionLock = (competitionId) => {
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) { setLoading(false); return; }

    const fetchLockState = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('competitions').select('locked').eq('id', competitionId).single();
        if (error) throw error;
        setIsLocked(!!data.locked);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLockState();

    const channel = supabase.channel(`competition-lock-${competitionId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'competitions',
        filter: `id=eq.${competitionId}`
      }, (payload) => {
        setIsLocked(!!payload.new.locked);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [competitionId]);

  const toggleLock = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('competitions')
        .update({ locked: !isLocked })
        .eq('id', competitionId)
        .select('locked')
        .single();
      if (error) throw error;
      setIsLocked(!!data.locked);
      toast.success(data.locked ? 'Sélections verrouillées' : 'Sélections déverrouillées');
      return data.locked;
    } catch (err) {
      toast.error('Erreur lors de la modification du verrouillage');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { isLocked, toggleLock, loading, error };
};
