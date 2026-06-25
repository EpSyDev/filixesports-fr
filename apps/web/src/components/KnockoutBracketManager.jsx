
import React from 'react';
import KnockoutBracketSeeding from './KnockoutBracketSeeding';
import KnockoutBracketDisplay from './KnockoutBracketDisplay';
import supabase from '@/lib/supabaseClient';
import { advanceWinnerToNextRound, getSemiLoserAdvancement } from '@/utils/competitionUtils';
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
        // Avancer le gagnant au tour suivant
        const advancement = advanceWinnerToNextRound(
          updatedMatch.winner, updatedMatch.round, updatedMatch.matchNumber, newMatchesState
        );

        if (advancement) {
          if (advancement.isNew) {
            const { error: createError } = await supabase.from('knockout_matches').insert({
              ...advancement.newMatch,
              competitionId
            });
            if (createError) throw createError;
          } else {
            const { error: updateError } = await supabase.from('knockout_matches')
              .update(advancement.updates)
              .eq('id', advancement.matchId);
            if (updateError) throw updateError;
          }
        }

        // Demi-finale : le perdant va au match de 3e place
        if (String(updatedMatch.round) === '4') {
          const loser = updatedMatch.winner === updatedMatch.homeTeam
            ? updatedMatch.awayTeam
            : updatedMatch.homeTeam;

          const loserAdvancement = getSemiLoserAdvancement(
            loser, updatedMatch.matchNumber, newMatchesState
          );

          if (loserAdvancement) {
            if (loserAdvancement.isNew) {
              const { error: loserErr } = await supabase.from('knockout_matches').insert({
                ...loserAdvancement.newMatch,
                competitionId
              });
              if (loserErr) throw loserErr;
            } else {
              const { error: loserErr } = await supabase.from('knockout_matches')
                .update(loserAdvancement.updates)
                .eq('id', loserAdvancement.matchId);
              if (loserErr) throw loserErr;
            }
          }
        }

        toast.success('Score auto-sauvegardé.');
      }

      onMatchesGenerated();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement du match.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {(!existingMatches || existingMatches.length === 0) ? (
        <KnockoutBracketSeeding
          competitionId={competitionId}
          qualifiedTeams={qualifiedTeams}
          onMatchesGenerated={onMatchesGenerated}
        />
      ) : (
        <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <KnockoutBracketDisplay
            matches={existingMatches}
            onSaveMatch={handleSaveMatch}
            onResetBracket={handleResetBracket}
          />
        </div>
      )}
    </div>
  );
};

export default KnockoutBracketManager;
