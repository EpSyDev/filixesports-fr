
import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw, CheckCircle2, PlayCircle, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getKnockoutBracketStatus, checkIfRoundComplete, cleanTeamName } from '@/utils/competitionUtils';
import { cn } from '@/lib/utils';

// ── Carte compacte d'un match dans le bracket ──────────────────────────────
const BracketMatchCard = ({ match, onSave, isDummy = false, showMeta = false }) => {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('scheduled');

  useEffect(() => {
    setHomeScore(match.homeScore != null ? String(match.homeScore) : '');
    setAwayScore(match.awayScore != null ? String(match.awayScore) : '');
    setDate(match.date ? match.date.split('T')[0] : '');
    setStatus(match.status || 'scheduled');
  }, [match.id, match.homeScore, match.awayScore, match.status, match.date]);

  const save = () => {
    if (!onSave || isDummy) return;
    const hs = homeScore !== '' ? Number(homeScore) : null;
    const as = awayScore !== '' ? Number(awayScore) : null;
    // Attendre que les deux scores soient renseignés (ou les deux vides pour reset)
    if ((hs === null) !== (as === null)) return;
    const isPlayed = hs !== null && as !== null;
    const winner = isPlayed
      ? (hs > as ? match.homeTeam : as > hs ? match.awayTeam : match.winner ?? null)
      : null;
    onSave({
      id: match.id,
      competitionId: match.competitionId,
      round: match.round,
      matchNumber: match.matchNumber,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: hs,
      awayScore: as,
      status: isPlayed ? 'played' : 'scheduled',
      winner,
      ...(match.date !== undefined && { date: date ? new Date(date).toISOString() : null }),
    });
  };

  const homeWon = match.winner && match.winner === match.homeTeam;
  const awayWon = match.winner && match.winner === match.awayTeam;
  const noTeams = !match.homeTeam && !match.awayTeam;
  const disabled = isDummy || noTeams;

  // BYE
  if (match.homeTeam && !match.awayTeam && match.status === 'played') {
    return (
      <div className="rounded-lg border border-dashed border-border/40 bg-muted/10 px-3 py-2 text-center opacity-50 w-full select-none">
        <p className="text-xs font-semibold">{match.homeTeam}</p>
        <Badge variant="secondary" className="text-[9px] mt-0.5 py-0 px-1.5">BYE</Badge>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg border bg-card shadow-sm overflow-hidden w-full",
      isDummy && "opacity-20 pointer-events-none border-dashed",
      !disabled && "hover:shadow-md hover:border-primary/30 transition-all duration-150"
    )}>
      {/* Équipe domicile */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 border-b border-border/40 transition-colors",
        homeWon && "bg-primary/10"
      )}>
        <span className={cn(
          "flex-1 text-sm truncate min-w-0",
          !match.homeTeam ? "text-muted-foreground/30 italic" : homeWon ? "font-bold text-primary" : "font-medium"
        )}>
          {match.homeTeam || '—'}
        </span>
        {!disabled && (
          <input
            type="number" min="0"
            value={homeScore}
            onChange={e => setHomeScore(e.target.value)}
            onBlur={save}
            placeholder="—"
            className={cn(
              "w-8 h-6 text-center text-sm font-bold rounded bg-muted/40 border border-transparent focus:outline-none focus:border-primary/60 transition-colors",
              homeWon && "text-primary bg-primary/10"
            )}
          />
        )}
        {disabled && <span className="w-8 text-center text-muted-foreground/30 text-sm">—</span>}
      </div>

      {/* Équipe extérieure */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 transition-colors",
        awayWon && "bg-primary/10"
      )}>
        <span className={cn(
          "flex-1 text-sm truncate min-w-0",
          !match.awayTeam ? "text-muted-foreground/30 italic" : awayWon ? "font-bold text-primary" : "font-medium"
        )}>
          {match.awayTeam || '—'}
        </span>
        {!disabled && (
          <input
            type="number" min="0"
            value={awayScore}
            onChange={e => setAwayScore(e.target.value)}
            onBlur={save}
            placeholder="—"
            className={cn(
              "w-8 h-6 text-center text-sm font-bold rounded bg-muted/40 border border-transparent focus:outline-none focus:border-primary/60 transition-colors",
              awayWon && "text-primary bg-primary/10"
            )}
          />
        )}
        {disabled && <span className="w-8 text-center text-muted-foreground/30 text-sm">—</span>}
      </div>

      {/* Date + statut (3e place uniquement) */}
      {showMeta && !noTeams && (
        <div className="flex gap-1.5 px-3 py-1.5 border-t border-border/30 bg-muted/20">
          <input
            type="date" value={date}
            onChange={e => setDate(e.target.value)}
            onBlur={save}
            className="flex-1 h-6 text-[10px] px-1.5 bg-transparent border border-border/40 rounded focus:outline-none focus:border-primary/50"
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            onBlur={save}
            className="h-6 text-[10px] px-1 bg-muted/40 border border-border/40 rounded focus:outline-none"
          >
            <option value="scheduled">Planifié</option>
            <option value="played">Joué</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      )}
    </div>
  );
};

// ── Composant principal ───────────────────────────────────────────────────────
const KnockoutBracketDisplay = ({ matches, onSaveMatch, onResetBracket }) => {
  const rounds = {
    '16': matches.filter(m => m.round === '16').sort((a, b) => a.matchNumber - b.matchNumber),
    '8':  matches.filter(m => m.round === '8').sort((a, b) => a.matchNumber - b.matchNumber),
    '4':  matches.filter(m => m.round === '4').sort((a, b) => a.matchNumber - b.matchNumber),
    '2':  matches.filter(m => m.round === '2').sort((a, b) => a.matchNumber - b.matchNumber),
    '1':  matches.filter(m => m.round === '1').sort((a, b) => a.matchNumber - b.matchNumber),
  };

  const getRoundName = (r) => ({ '16': '8èmes', '8': 'Quarts', '4': 'Demis', '2': 'Finale' }[r] ?? `Tour ${r}`);

  const startingRound = ['16', '8', '4', '2'].find(r => rounds[r]?.length > 0);
  let mainRounds = [];
  if (startingRound === '16') mainRounds = ['16', '8', '4', '2'];
  else if (startingRound === '8') mainRounds = ['8', '4', '2'];
  else if (startingRound === '4') mainRounds = ['4', '2'];
  else if (startingRound === '2') mainRounds = ['2'];

  const expectedCount = { '16': 8, '8': 4, '4': 2, '2': 1, '1': 1 };

  const getPaddedMatches = (roundKey) => {
    const actual = rounds[roundKey] || [];
    const expected = expectedCount[roundKey] ?? 0;
    if (actual.length >= expected) return actual;
    const padded = [...actual];
    for (let i = actual.length; i < expected; i++) {
      padded.push({ id: `dummy-${roundKey}-${i}`, isDummy: true, round: roundKey, matchNumber: i + 1, homeTeam: '', awayTeam: '', status: 'scheduled' });
    }
    return padded.sort((a, b) => a.matchNumber - b.matchNumber);
  };

  const status = getKnockoutBracketStatus(matches);
  const thirdPlaceMatch = rounds['1']?.[0];

  const activeRoundKey = mainRounds
    .filter(k => !checkIfRoundComplete(matches[0]?.competitionId, k, matches))
    .sort((a, b) => Number(b) - Number(a))[0] ?? null;

  if (mainRounds.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Aucun match disponible pour la phase finale.</div>;
  }

  return (
    <div className="w-full flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/20 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-sm">Arbre Final</h3>
          {status.status === 'completed' && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] gap-1 py-0 px-2 h-5">
              <Trophy className="w-3 h-3" /> Terminé
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] gap-1 py-0 px-2 h-5 text-muted-foreground">
            Sauvegarde auto au blur
          </Badge>
        </div>
        {onResetBracket && (
          <Button variant="outline" size="sm" onClick={onResetBracket} className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/20 shrink-0">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Réinitialiser
          </Button>
        )}
      </div>

      {/* Bracket principal */}
      <div className="w-full p-3 md:p-5 bg-background overflow-x-auto">
        <div className="flex flex-row gap-3 md:gap-5 pt-10 pb-2 min-w-[520px]">
          {mainRounds.map((roundKey, colIndex) => {
            const roundMatches = getPaddedMatches(roundKey);
            const isComplete = !roundMatches.some(m => m.isDummy) && checkIfRoundComplete(matches[0]?.competitionId, roundKey, matches);
            const isActive = roundKey === activeRoundKey;

            return (
              <div key={roundKey} className="flex flex-col justify-around flex-1 relative gap-3 min-w-[140px] max-w-[240px]">
                {/* Label de round */}
                <div className="absolute top-0 left-0 right-0 flex justify-center -mt-9">
                  <div className={cn(
                    "flex items-center gap-1 py-1 px-2.5 rounded-md border text-[10px] font-bold uppercase tracking-wider",
                    isComplete && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                    isActive && "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/20",
                    !isComplete && !isActive && "bg-muted/30 border-border text-muted-foreground"
                  )}>
                    {getRoundName(roundKey)}
                    {isComplete && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {isActive && <PlayCircle className="w-2.5 h-2.5" />}
                  </div>
                </div>

                {roundMatches.map((match) => (
                  <div key={match.id} className="relative w-full flex items-center group">
                    {/* Connecteur droite */}
                    {colIndex < mainRounds.length - 1 && (
                      <div className="absolute top-1/2 -right-3 md:-right-5 w-3 md:w-5 border-t border-border/50 z-0" />
                    )}
                    {/* Connecteur gauche */}
                    {colIndex > 0 && (
                      <div className="absolute top-1/2 -left-3 md:-left-5 w-3 md:w-5 border-t border-border/50 z-0" />
                    )}
                    <div className="relative z-10 w-full">
                      <BracketMatchCard
                        match={match}
                        onSave={onSaveMatch}
                        isDummy={match.isDummy}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Trophée vainqueur */}
          {status.status === 'completed' && status.winner && (
            <div className="flex flex-col justify-center flex-none w-[120px] pl-2">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 border border-amber-300 dark:border-amber-700/50 rounded-xl p-3 text-center shadow-lg">
                <Trophy className="w-6 h-6 mx-auto text-amber-600 dark:text-amber-400 mb-1.5" />
                <p className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-widest mb-1">Vainqueur</p>
                <p className="text-xs font-black text-amber-900 dark:text-amber-100 leading-tight">{cleanTeamName(status.winner)}</p>
              </div>
            </div>
          )}
        </div>

        {/* 3e Place — séparée sous le bracket */}
        {thirdPlaceMatch && (
          <div className="mt-5 pt-4 border-t border-dashed border-border/40">
            <div className="flex items-center gap-2 mb-2.5">
              <Medal className="w-4 h-4 text-amber-600/70" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Match pour la 3e place</span>
            </div>
            <div className="max-w-[260px]">
              <BracketMatchCard
                match={thirdPlaceMatch}
                onSave={onSaveMatch}
                showMeta={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnockoutBracketDisplay;
