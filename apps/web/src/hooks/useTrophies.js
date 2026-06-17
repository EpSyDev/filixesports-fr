
import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useTrophies = () => {
  const [trophies, setTrophies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrophies = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('trophies').getFullList({
        sort: '-year',
        $autoCancel: false
      });
      setTrophies(records);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrophies();
  }, []);

  const createTrophy = async (data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      const record = await pb.collection('trophies').create(formData, { $autoCancel: false });
      await fetchTrophies();
      return record;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const updateTrophy = async (id, data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      const record = await pb.collection('trophies').update(id, formData, { $autoCancel: false });
      await fetchTrophies();
      return record;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const deleteTrophy = async (id) => {
    try {
      await pb.collection('trophies').delete(id, { $autoCancel: false });
      await fetchTrophies();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  return {
    trophies,
    loading,
    error,
    createTrophy,
    updateTrophy,
    deleteTrophy,
    refetch: fetchTrophies
  };
};
