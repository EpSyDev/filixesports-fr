
import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const usePlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('players').getFullList({
        sort: 'number',
        $autoCancel: false
      });
      setPlayers(records);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const createPlayer = async (data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      const record = await pb.collection('players').create(formData, { $autoCancel: false });
      await fetchPlayers();
      return record;
    } catch (err) {
      throw new Error(err?.response?.message || err.message || "Erreur lors de la création");
    }
  };

  const updatePlayer = async (id, data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      const record = await pb.collection('players').update(id, formData, { $autoCancel: false });
      await fetchPlayers();
      return record;
    } catch (err) {
      throw new Error(err?.response?.message || err.message || "Erreur lors de la mise à jour");
    }
  };

  const deletePlayer = async (id) => {
    try {
      await pb.collection('players').delete(id, { $autoCancel: false });
      await fetchPlayers();
    } catch (err) {
      console.error("Error deleting player:", err);
      throw new Error(err?.response?.message || err.message || "Erreur lors de la suppression");
    }
  };

  return {
    players,
    loading,
    error,
    createPlayer,
    updatePlayer,
    deletePlayer,
    refetch: fetchPlayers
  };
};
