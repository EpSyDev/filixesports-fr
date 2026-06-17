
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { validatePoolAssignments, generatePoolMatches, generatePoolStandings } from '@/utils/competitionUtils';
import pb from '@/lib/pocketbaseClient';
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
        const poolRec = await pb.collection('tournament_pools').create({
          competitionId,
          poolId: pool.id,
          poolName: pool.name
        }, { $autoCancel: false });

        for (const team of pool.teams) {
          await pb.collection('tournament_teams').update(team.id, {
            poolId: poolRec.poolId
          }, { $autoCancel: false });
        }
      }

      // 2. Generate and save matches
      const matches = generatePoolMatches(pools.map(p => ({ poolId: p.id, teams: p.teams })), competitionId);
      for (const match of matches) {
        await pb.collection('pool_matches').create(match, { $autoCancel: false });
      }

      // 3. Generate and save standings
      const standings = generatePoolStandings(pools.map(p => ({ poolId: p.id, teams: p.teams })), competitionId);
      for (const standing of standings) {
        await pb.collection('pool_standings').create(standing, { $autoCancel: false });
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
