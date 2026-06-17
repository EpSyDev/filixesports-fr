
import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      const records = await pb.collection('competitions').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setCompetitions(records);
      setError(null);
    } catch (err) {
      console.error("Error fetching competitions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();

    const setupSubscription = async () => {
      try {
        await pb.collection('competitions').subscribe('*', function (e) {
          if (e.action === 'create') {
            setCompetitions(prev => {
              const exists = prev.some(c => c.id === e.record.id);
              if (exists) return prev;
              return [e.record, ...prev].sort((a, b) => new Date(b.created) - new Date(a.created));
            });
          } else if (e.action === 'update') {
            setCompetitions(prev => prev.map(c => c.id === e.record.id ? e.record : c));
          } else if (e.action === 'delete') {
            setCompetitions(prev => prev.filter(c => c.id !== e.record.id));
          }
        });
      } catch (err) {
        console.error("Failed to subscribe to competitions:", err);
      }
    };

    setupSubscription();

    return () => {
      pb.collection('competitions').unsubscribe('*').catch(console.error);
    };
  }, [fetchCompetitions]);

  const createCompetition = async (data) => {
    try {
      const record = await pb.collection('competitions').create(data, { $autoCancel: false });
      return record;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const updateCompetition = async (id, data) => {
    try {
      const record = await pb.collection('competitions').update(id, data, { $autoCancel: false });
      return record;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const deleteCompetition = async (id) => {
    try {
      await pb.collection('competitions').delete(id, { $autoCancel: false });
    } catch (err) {
      throw new Error(err.message);
    }
  };

  return {
    competitions,
    loading,
    error,
    createCompetition,
    updateCompetition,
    deleteCompetition,
    refetch: fetchCompetitions
  };
};
