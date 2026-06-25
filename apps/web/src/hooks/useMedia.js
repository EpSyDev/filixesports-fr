import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

export const useMedia = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ensureBucket = async () => {
    await supabase.storage.createBucket('media', {
      public: true,
      allowedMimeTypes: ['image/webp'],
      fileSizeLimit: 10 * 1024 * 1024,
    }).catch(() => {}); // ignore si le bucket existe déjà
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      await ensureBucket();
      const { data, error } = await supabase.from('media').select('*').order('uploadDate', { ascending: false });
      if (error) throw error;
      setMedia(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedia(); }, []);

  const createMedia = async (data) => {
    const { file, ...rest } = data;
    let fileUrl = '';

    if (file instanceof File) {
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${Date.now()}-${sanitized}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
      if (uploadError) throw new Error(uploadError.message);
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
      fileUrl = publicUrl;
    }

    const { data: record, error } = await supabase
      .from('media')
      .insert({ ...rest, url: fileUrl, uploadDate: new Date().toISOString() })
      .select().single();
    if (error) throw new Error(error.message);
    await fetchMedia();
    return record;
  };

  const deleteMedia = async (id) => {
    const { error } = await supabase.from('media').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchMedia();
  };

  return { media, loading, error, createMedia, deleteMedia, refetch: fetchMedia };
};
