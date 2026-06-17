
import React from 'react';
import KnockoutBracketSeeding from './KnockoutBracketSeeding';
import KnockoutBracketDisplay from './KnockoutBracketDisplay';
import pb from '@/lib/pocketbaseClient';
import { 
  advanceWinnerToNextRound
} from '@/utils/competitionUtils';
import { toast } from 'sonner';

const KnockoutBracketManager = ({
  competitionId,
  existingMatches,
  onMatchesGenerated,
  qualifiedTeams,
}) => {

  const handleResetBracket = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer tout l'arbre généré ? Cette action est irréversible.")) return;
    
    try {
      for (const m of existingMatches) {
        await pb.collection('knockout_matches').delete(m.id, { $autoCancel: false });
      }
      toast.success("Arbre réinitialisé avec succès.");
      onMatchesGenerated();
    } catch (err) {
      toast.error("Erreur lors de la réinitialisation.");
      console.error(err);
    }
  };

  const handleSaveMatch = async (updatedMatch) => {
    try {
      // 1. Update current match in DB
      await pb.collection('knockout_matches').update(updatedMatch.id, updatedMatch, { $autoCancel: false });
      
      // 2. Prepare local state representation
      const newMatchesState = existingMatches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
      
      // 3. Immediately advance winner to the next round if played
      if (updatedMatch.status === 'played' && updatedMatch.winner) {
        const advancement = advanceWinnerToNextRound(
          updatedMatch.winner, 
          updatedMatch.round, 
          updatedMatch.matchNumber, 
          newMatchesState
        );
        
        if (advancement) {
          if (advancement.isNew) {
            await pb.collection('knockout_matches').create({
              ...advancement.newMatch,
              competitionId
            }, { $autoCancel: false });
          } else {
            await pb.collection('knockout_matches').update(
              advancement.matchId, 
              advancement.updates, 
              { $autoCancel: false }
            );
          }
        }
      }
      
      // Only show toast on actual match resolution to avoid spamming toast for every keystroke
      if (updatedMatch.status === 'played') {
        toast.success("Score auto-sauvegardé.");
      }
      
      // 4. Refresh global state immediately
      onMatchesGenerated();
    } catch (err) {
      console.error(err);
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
