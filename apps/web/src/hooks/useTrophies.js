import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

export const useTrophies = () => {
  const [trophies, setTrophies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrophies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('trophies').select('*').order('year', { ascending: false });
      if (error) throw error;
      setTrophies(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrophies(); }, []);

  const createTrophy = async (data) => {
    const { image, ...rest } = data;
    let imageUrl = '';

    if (image instanceof File) {
      const path = `${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage.from('trophies').upload(path, image);
      if (uploadError) throw new Error(uploadError.message);
      const { data: { publicUrl } } = supabase.storage.from('trophies').getPublicUrl(path);
      imageUrl = publicUrl;
    }

    const { data: record, error } = await supabase.from('trophies').insert({ ...rest, image: imageUrl }).select().single();
    if (error) throw new Error(error.message);
    await fetchTrophies();
    return record;
  };

  const updateTrophy = async (id, data) => {
    const { image, ...rest } = data;
    let imageUrl = typeof image === 'string' ? image : '';

    if (image instanceof File) {
      const path = `${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage.from('trophies').upload(path, image);
      if (uploadError) throw new Error(uploadError.message);
      const { data: { publicUrl } } = supabase.storage.from('trophies').getPublicUrl(path);
      imageUrl = publicUrl;
    }

    const { data: record, error } = await supabase.from('trophies').update({ ...rest, image: imageUrl }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    await fetchTrophies();
    return record;
  };

  const deleteTrophy = async (id) => {
    const { error } = await supabase.from('trophies').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchTrophies();
  };

  return { trophies, loading, error, createTrophy, updateTrophy, deleteTrophy, refetch: fetchTrophies };
};
