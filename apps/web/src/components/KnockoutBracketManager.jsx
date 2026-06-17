
import React from 'react';
import KnockoutBracketSeeding from './KnockoutBracketSeeding';
import KnockoutBracketDisplay from './KnockoutBracketDisplay';
import supabase from '@/lib/supabaseClient';
import { advanceWinnerToNextRound } from '@/utils/competitionUtils';
import { toast } from 'sonner';

const KnockoutBracketManager = ({ competitionId, existingMatches, onMatchesGenerated, qualifiedTeams }) => {

  const handleResetBracket = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer tout l'arbre généré ? Cette action est irréversible.")) return;
    try {
      const ids = existingMatches.map(m => m.id);
      const { error } = await supabase.from('knockout_matches').delete().in('id', ids);
      if (error) throw error;
      toast.success('Arbre réinitialisé avec succès.');
      onMatchesGenerated();
    } catch (err) {
      toast.error('Erreur lors de la réinitialisation.');
    }
  };

  const handleSaveMatch = async (updatedMatch) => {
    try {
      const { error } = await supabase.from('knockout_matches').update(updatedMatch).eq('id', updatedMatch.id);
      if (error) throw error;

      const newMatchesState = existingMatches.map(m => m.id === updatedMatch.id ? updatedMatch : m);

      if (updatedMatch.status === 'played' && updatedMatch.winner) {
        const advancement = advanceWinnerToNextRound(
          updatedMatch.winner, updatedMatch.round, updatedMatch.matchNumber, newMatchesState
        );

        if (advancement) {
          if (advancement.isNew) {
            const { error: createError } = await supabase.from('knockout_matches').insert({ ...advancement.newMatch, competitionId });
            if (createError) throw createError;
          } else {
            const { error: updateError } = await supabase.from('knockout_matches').update(advancement.updates).eq('id', advancement.matchId);
            if (updateError) throw updateError;
          }
        }
        toast.success('Score auto-sauvegardé.');
      }

      onMatchesGenerated();
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement du match.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {(!existingMatches || existingMatches.length === 0) ? (
        <KnockoutBracketSeeding competitionId={competitionId} qualifiedTeams={qualifiedTeams} onMatchesGenerated={onMatchesGenerated} />
      ) : (
        <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <KnockoutBracketDisplay matches={existingMatches} onSaveMatch={handleSaveMatch} onResetBracket={handleResetBracket} />
        </div>
      )}
    </div>
  );
};

export default KnockoutBracketManager;
