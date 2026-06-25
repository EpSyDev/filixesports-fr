import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

const STORAGE_LIMIT = 1024 * 1024 * 1024;     // 1 GB — stockage fichiers (free tier)
export const DB_LIMIT_MB = 500;               // 500 MB — base de données (free tier)

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const useStorageUsage = () => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [filesRes, playersRes, matchesRes, trophiesRes, mediasRes] = await Promise.all([
          supabase.storage.from('media').list('', { limit: 1000 }),
          supabase.from('players').select('id', { count: 'exact', head: true }),
          supabase.from('matches').select('id', { count: 'exact', head: true }),
          supabase.from('trophies').select('id', { count: 'exact', head: true }),
          supabase.from('media').select('id', { count: 'exact', head: true }),
        ]);

        const files = filesRes.data ?? [];
        const storageBytes = files.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);

        setUsage({
          storageBytes,
          storageLimit: STORAGE_LIMIT,
          storagePct: Math.min((storageBytes / STORAGE_LIMIT) * 100, 100),
          players: playersRes.count ?? 0,
          matches: matchesRes.count ?? 0,
          trophies: trophiesRes.count ?? 0,
          mediaFiles: mediasRes.count ?? 0,
        });
      } catch (err) {
        console.error('useStorageUsage error', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { usage, loading };
};
