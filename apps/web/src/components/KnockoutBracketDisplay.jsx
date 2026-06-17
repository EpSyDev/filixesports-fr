
import React from 'react';
import { Trophy, RotateCcw, CheckCircle2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MatchResultForm from './MatchResultForm';
import { getKnockoutBracketStatus, checkIfRoundComplete, cleanTeamName } from '@/utils/competitionUtils';
import { cn } from '@/lib/utils';

const KnockoutBracketDisplay = ({ matches, onSaveMatch, onResetBracket }) => {
  const rounds = {
    '16': matches.filter(m => m.round === '16').sort((a, b) => a.matchNumber - b.matchNumber),
    '8': matches.filter(m => m.round === '8').sort((a, b) => a.matchNumber - b.matchNumber),
    '4': matches.filter(m => m.round === '4').sort((a, b) => a.matchNumber - b.matchNumber),
    '2': matches.filter(m => m.round === '2').sort((a, b) => a.matchNumber - b.matchNumber),
    '1': matches.filter(m => m.round === '1').sort((a, b) => a.matchNumber - b.matchNumber),
  };

  const getRoundName = (roundNum) => {
    switch (roundNum) {
      case '16': return '8èmes';
      case '8': return 'Quarts';
      case '4': return 'Demis';
      case '2': return 'Finale';
      case '1': return '3e Place';
      default: return `Tour ${roundNum}`;
    }
  };

  const startingRound = ['16', '8', '4', '2'].find(r => rounds[r] && rounds[r].length > 0);
  
  let displayRounds = [];
  if (startingRound === '16') displayRounds = ['16', '8', '4', '2'];
  else if (startingRound === '8') displayRounds = ['8', '4', '2'];
  else if (startingRound === '4') displayRounds = ['4', '2'];
  else if (startingRound === '2') displayRounds = ['2'];
  
  if (rounds['1'] && rounds['1'].length > 0) {
    displayRounds.push('1');
  }

  const getExpectedMatchCount = (round) => {
    if (round === '16') return 8;
    if (round === '8') return 4;
    if (round === '4') return 2;
    if (round === '2') return 1;
    if (round === '1') return 1;
    return 0;
  };

  const getPaddedMatches = (roundKey) => {
    const actualMatches = rounds[roundKey] || [];
    const expectedCount = getExpectedMatchCount(roundKey);
    
    if (actualMatches.length >= expectedCount) return actualMatches;
    
    const padded = [...actualMatches];
    for (let i = actualMatches.length; i < expectedCount; i++) {
      padded.push({
        id: `dummy-${roundKey}-${i}`,
        isDummy: true,
        round: roundKey,
        matchNumber: i + 1,
        homeTeam: '',
        awayTeam: '',
        status: 'scheduled'
      });
    }
    return padded.sort((a, b) => a.matchNumber - b.matchNumber);
  };

  const status = getKnockoutBracketStatus(matches);

  const sortedIncompleteKeys = displayRounds
    .filter(k => k !== '1' && !checkIfRoundComplete(matches[0]?.competitionId, k, matches))
    .sort((a, b) => Number(b) - Number(a));
  
  const activeRoundKey = sortedIncompleteKeys[0] || null;

  if (displayRounds.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Aucun match n'est disponible pour la phase finale.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b bg-muted/20 gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-sm md:text-base">Arbre Final</h3>
          {status.status === 'completed' && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] md:text-xs gap-1 py-0 px-2 h-5">
              <Trophy className="w-3 h-3" /> Terminé
            </Badge>
          )}
          <Badge variant="default" className="text-[10px] md:text-xs gap-1 py-0 px-2 h-5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            Édition auto-sauvegardée
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {onResetBracket && (
            <Button variant="outline" size="sm" onClick={onResetBracket} className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/20 transition-all duration-200">
              <RotateCcw className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Réinitialiser</span>
            </Button>
          )}
        </div>
      </div>

      <div className="w-full p-2 md:p-4 bg-background overflow-x-auto">
        <div className="flex flex-row min-w-[800px] w-full justify-between gap-4 md:gap-6 pt-10 pb-4 px-2">
          {displayRounds.map((roundKey, colIndex) => {
            const roundMatches = getPaddedMatches(roundKey);
            const isLastRound = colIndex === displayRounds.length - 1;
            const isComplete = !roundMatches.some(m => m.isDummy) && checkIfRoundComplete(matches[0]?.competitionId, roundKey, matches);
            const isActive = roundKey === activeRoundKey;

            return (
              <div key={roundKey} className="flex flex-col justify-around flex-1 relative min-w-[200px] gap-4">
                <div className="absolute top-0 left-0 right-0 flex justify-center -mt-10">
                  <div className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md border text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors",
                    isComplete && "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                    isActive && "bg-primary/10 border-primary/30 text-primary ring-2 ring-primary/20",
                    !isComplete && !isActive && "bg-muted/30 border-border text-muted-foreground"
                  )}>
                    {getRoundName(roundKey)}
                    {isComplete && <CheckCircle2 className="w-3 h-3" />}
                    {isActive && <PlayCircle className="w-3 h-3" />}
                  </div>
                </div>
                
                {roundMatches.map((match) => {
                  const hasNext = !isLastRound && roundKey !== '1';
                  
                  return (
                    <div key={match.id} className="relative w-full flex items-center justify-center py-2 group">
                      {hasNext && (
                        <div className="hidden md:block absolute top-1/2 -right-2 md:-right-3 w-2 md:w-3 border-t-2 border-border/60 z-0 transition-colors group-hover:border-primary/40" />
                      )}
                      {colIndex > 0 && roundKey !== '1' && (
                        <div className="hidden md:block absolute top-1/2 -left-2 md:-left-3 w-2 md:w-3 border-t-2 border-border/60 z-0 transition-colors group-hover:border-primary/40" />
                      )}

                      <MatchResultForm 
                        match={match} 
                        onSave={onSaveMatch} 
                        className={cn(
                          "relative z-10",
                          match.isDummy && "opacity-40 grayscale pointer-events-none border-dashed"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {status.status === 'completed' && status.winner && (
            <div className="flex flex-col justify-center flex-1 min-w-[200px] pl-2 md:pl-4">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 border border-amber-300 dark:border-amber-700/50 rounded-xl p-3 md:p-4 text-center shadow-lg transform transition-transform hover:scale-105 duration-300 w-full">
                <Trophy className="w-6 h-6 md:w-8 md:h-8 mx-auto text-amber-600 dark:text-amber-400 mb-2 md:mb-3" />
                <h4 className="text-[10px] md:text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-widest mb-1">Vainqueur</h4>
                <p className="text-sm md:text-lg font-black text-amber-900 dark:text-amber-100 truncate">{cleanTeamName(status.winner)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnockoutBracketDisplay;
