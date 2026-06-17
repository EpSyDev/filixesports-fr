
import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

export const useCompetitionLock = (competitionId) => {
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) {
      setLoading(false);
      return;
    }

    const fetchLockState = async () => {
      try {
        setLoading(true);
        const record = await pb.collection('competitions').getOne(competitionId, { $autoCancel: false });
        setIsLocked(!!record.locked);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch lock state:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLockState();

    pb.collection('competitions').subscribe(competitionId, function (e) {
      setIsLocked(!!e.record.locked);
    });

    return () => {
      pb.collection('competitions').unsubscribe(competitionId);
    };
  }, [competitionId]);

  const toggleLock = async () => {
    try {
      setLoading(true);
      const record = await pb.collection('competitions').update(competitionId, {
        locked: !isLocked
      }, { $autoCancel: false });
      
      setIsLocked(!!record.locked);
      toast.success(record.locked ? 'Sélections verrouillées avec succès' : 'Sélections déverrouillées avec succès');
      return record.locked;
    } catch (err) {
      console.error("Failed to toggle lock state:", err);
      toast.error('Erreur lors de la modification du verrouillage');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    isLocked,
    toggleLock,
    loading,
    error
  };
};
