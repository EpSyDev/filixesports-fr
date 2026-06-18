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

  // Upload photo joueur (WebP uniquement) → renvoie l'URL publique.
  // Une string en entrée = image déjà uploadée, on la conserve telle quelle.
  const resolvePlayerImage = async (image) => {
    if (!(image instanceof File)) return typeof image === 'string' ? image : '';
    if (image.type !== 'image/webp') throw new Error('Format non supporté : image WebP uniquement');
    const path = `${Date.now()}-${image.name}`;
    const { error: uploadError } = await supabase.storage.from('players').upload(path, image, { contentType: 'image/webp' });
    if (uploadError) throw new Error(uploadError.message);
    const { data: { publicUrl } } = supabase.storage.from('players').getPublicUrl(path);
    return publicUrl;
  };

  const createPlayer = async (data) => {
    const { image, ...rest } = data;
    const imageUrl = await resolvePlayerImage(image);
    const { data: record, error } = await supabase.from('players').insert({ ...rest, image: imageUrl }).select().single();
    if (error) throw new Error(error?.message || 'Erreur lors de la création');
    await fetchPlayers();
    return record;
  };

  const updatePlayer = async (id, data) => {
    const { image, ...rest } = data;
    const imageUrl = await resolvePlayerImage(image);
    const { data: record, error } = await supabase.from('players').update({ ...rest, image: imageUrl }).eq('id', id).select().single();
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
