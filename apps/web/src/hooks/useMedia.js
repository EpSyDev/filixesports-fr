
import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useMedia = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('media').getFullList({
        sort: '-uploadDate',
        $autoCancel: false
      });
      setMedia(records);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const createMedia = async (data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      const record = await pb.collection('media').create(formData, { $autoCancel: false });
      await fetchMedia();
      return record;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const deleteMedia = async (id) => {
    try {
      await pb.collection('media').delete(id, { $autoCancel: false });
      await fetchMedia();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  return {
    media,
    loading,
    error,
    createMedia,
    deleteMedia,
    refetch: fetchMedia
  };
};
