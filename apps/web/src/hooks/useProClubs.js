import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

export const useProClubs = () => {
  const [club, setClub] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [clubRes, playersRes, matchesRes] = await Promise.all([
          supabase.from('proclubs_club').select('*').limit(1).maybeSingle(),
          supabase.from('proclubs_players').select('*').order('goals', { ascending: false }),
          supabase.from('proclubs_matches').select('*').order('played_at', { ascending: false }),
        ]);
        if (!active) return;
        if (clubRes.error) throw clubRes.error;
        if (playersRes.error) throw playersRes.error;
        if (matchesRes.error) throw matchesRes.error;
        setClub(clubRes.data);
        setPlayers(playersRes.data || []);
        setMatches(matchesRes.data || []);
        setError(null);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { club, players, matches, loading, error };
};
