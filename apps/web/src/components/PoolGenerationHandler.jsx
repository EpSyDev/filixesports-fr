
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { validatePoolAssignments, generatePoolMatches, generatePoolStandings } from '@/utils/competitionUtils';
import supabase from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Network, Loader2 } from 'lucide-react';

const PoolGenerationHandler = ({ competitionId, pools, onSuccess }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!validatePoolAssignments(pools)) {
      toast.error('Veuillez assigner exactement 4 équipes par poule (24 équipes au total).');
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Save Pools and update teams
      for (const pool of pools) {
        const { error: poolErr } = await supabase.from('tournament_pools').insert({
          competitionId, poolId: pool.id, name: pool.name
        });
        if (poolErr) throw poolErr;

        const teamUpdates = pool.teams.map(team =>
          supabase.from('tournament_teams').update({ poolId: pool.id }).eq('id', team.id)
        );
        await Promise.all(teamUpdates);
      }

      // 2. Generate and save matches
      const matches = generatePoolMatches(pools.map(p => ({ poolId: p.id, teams: p.teams })), competitionId);
      if (matches.length > 0) {
        const { error: mErr } = await supabase.from('pool_matches').insert(matches);
        if (mErr) throw mErr;
      }

      // 3. Generate and save standings
      const standings = generatePoolStandings(pools.map(p => ({ poolId: p.id, teams: p.teams })), competitionId);
      if (standings.length > 0) {
        const { error: sErr } = await supabase.from('pool_standings').insert(standings);
        if (sErr) throw sErr;
      }

      toast.success('Poules et matchs générés avec succès !');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error generating pools:', error);
      toast.error('Erreur lors de la génération des poules.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isValid = validatePoolAssignments(pools);

  return (
    <div className="flex justify-end mt-6 pt-6 border-t border-border">
      <Button 
        size="lg" 
        onClick={handleGenerate} 
        disabled={!isValid || isGenerating}
        className="gap-2 bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
      >
        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Network className="w-5 h-5" />}
        {isGenerating ? 'Génération en cours...' : 'Valider et Générer les Matchs'}
      </Button>
    </div>
  );
};

export default PoolGenerationHandler;
