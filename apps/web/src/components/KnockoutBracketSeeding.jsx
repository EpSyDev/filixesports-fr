
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Network, Shuffle, Trophy, ArrowRight } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { generateKnockoutBracketWithSeeding, advanceWinnerToNextRound } from '@/utils/competitionUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const KnockoutBracketSeeding = ({ competitionId, qualifiedTeams, onMatchesGenerated }) => {
  const numTeams = qualifiedTeams.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(numTeams, 2))));
  const numByes = bracketSize - numTeams;

  const [seeds, setSeeds] = useState(Array(numTeams).fill(null));
  const [isGenerating, setIsGenerating] = useState(false);

  const placedTeams = seeds.filter(Boolean);

  // Équipes disponibles = qualifiées non encore placées
  const availableTeams = qualifiedTeams.filter(t => !placedTeams.includes(t.teamName));

  // Paires du premier tour : seed[i] affronte seed[bracketSize-1-i]
  // Les positions numTeams..bracketSize-1 sont des BYE
  const firstRoundMatchups = useMemo(() => {
    const allSeeds = [...seeds];
    while (allSeeds.length < bracketSize) allSeeds.push('BYE');
    const matchups = [];
    for (let i = 0; i < bracketSize / 2; i++) {
      const home = allSeeds[i] || null;
      const away = allSeeds[bracketSize - 1 - i];
      matchups.push({ home, away: away === 'BYE' ? 'BYE' : (away || null) });
    }
    return matchups;
  }, [seeds, bracketSize]);

  const setSeed = (index, teamName) => {
    setSeeds(prev => {
      const next = [...prev];
      // Si cette équipe est déjà placée ailleurs, on libère cet emplacement
      const existingIdx = next.findIndex(s => s === teamName);
      if (existingIdx !== -1 && existingIdx !== index) next[existingIdx] = null;
      next[index] = teamName || null;
      return next;
    });
  };

  const handleShuffle = () => {
    const shuffled = [...qualifiedTeams]
      .sort(() => Math.random() - 0.5)
      .map(t => t.teamName);
    setSeeds(shuffled);
  };

  const handleGenerate = async () => {
    if (placedTeams.length < numTeams) {
      toast.error(`Placez les ${numTeams} équipes qualifiées avant de générer.`);
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading("Génération de l'arbre en cours...");

    try {
      const matches = generateKnockoutBracketWithSeeding(firstRoundMatchups, competitionId);
      const { data: insertedMatches, error } = await supabase
        .from('knockout_matches')
        .insert(matches)
        .select();
      if (error) throw error;

      // Auto-jouer les matchs BYE et avancer les gagnants
      const firstRoundKey = String(bracketSize);
      const byeMatches = insertedMatches.filter(
        m => m.round === firstRoundKey && m.homeTeam && !m.awayTeam
      );

      for (const byeMatch of byeMatches) {
        await supabase.from('knockout_matches').update({
          status: 'played',
          winner: byeMatch.homeTeam
        }).eq('id', byeMatch.id);

        const advancement = advanceWinnerToNextRound(
          byeMatch.homeTeam, byeMatch.round, byeMatch.matchNumber, insertedMatches
        );
        if (advancement && !advancement.isNew) {
          await supabase.from('knockout_matches')
            .update(advancement.updates)
            .eq('id', advancement.matchId);
        }
      }

      toast.dismiss(loadingToast);
      toast.success("Arbre généré avec succès !");
      onMatchesGenerated();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Erreur lors de la génération de l'arbre.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getRoundName = () => {
    if (bracketSize === 16) return '8èmes de finale';
    if (bracketSize === 8) return 'Quarts de finale';
    if (bracketSize === 4) return 'Demi-finales';
    return `Tour (${bracketSize / 2} matchs)`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {numTeams < 2 && (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            Sélectionnez au moins 2 équipes qualifiées dans l'onglet "Poules".
          </CardContent>
        </Card>
      )}

      {numTeams >= 2 && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" /> Tirage au sort — Phase finale
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {numTeams} équipes qualifiées → bracket de {bracketSize}
                {numByes > 0 && ` (${numByes} exemption${numByes > 1 ? 's' : ''} BYE)`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShuffle}
              className="gap-2 min-h-[44px] self-start sm:self-auto"
            >
              <Shuffle className="w-4 h-4" /> Tirage aléatoire
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sélection des têtes de série */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Têtes de série
                </h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {Array.from({ length: numTeams }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-7 text-right text-sm font-bold text-muted-foreground shrink-0">
                        {i + 1}.
                      </span>
                      <Select
                        value={seeds[i] || ''}
                        onValueChange={(v) => setSeed(i, v === '_clear_' ? null : v)}
                      >
                        <SelectTrigger className={cn(
                          "flex-1 min-h-[40px]",
                          seeds[i] && "border-primary/40 bg-primary/5"
                        )}>
                          <SelectValue placeholder="Choisir une équipe..." />
                        </SelectTrigger>
                        <SelectContent>
                          {seeds[i] && (
                            <SelectItem value="_clear_" className="text-muted-foreground italic">
                              — Effacer
                            </SelectItem>
                          )}
                          {seeds[i] && (
                            <SelectItem value={seeds[i]}>{seeds[i]}</SelectItem>
                          )}
                          {availableTeams.map(t => (
                            <SelectItem key={t.id} value={t.teamName}>{t.teamName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {numByes > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-1">
                    {Array.from({ length: numByes }, (_, i) => (
                      <div key={i} className="flex items-center gap-3 opacity-40">
                        <span className="w-7 text-right text-sm font-bold text-muted-foreground shrink-0">
                          {numTeams + i + 1}.
                        </span>
                        <div className="flex-1 min-h-[40px] flex items-center px-3 rounded-md border border-dashed text-sm text-muted-foreground">
                          BYE (exemption)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Aperçu des matchs du premier tour */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Aperçu — {getRoundName()}
                </h4>
                <div className="space-y-2">
                  {firstRoundMatchups.map((m, i) => {
                    const isByeMatch = m.away === 'BYE';
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-sm",
                          isByeMatch
                            ? "opacity-50 bg-muted/10 border-dashed"
                            : "bg-muted/20 border-border/60"
                        )}
                      >
                        <span className="text-xs text-muted-foreground w-4 shrink-0 font-mono">
                          {i + 1}
                        </span>
                        <span className={cn(
                          "flex-1 text-right truncate font-medium",
                          !m.home && "text-muted-foreground italic text-xs"
                        )}>
                          {m.home || '— À définir'}
                        </span>
                        <span className="text-muted-foreground font-bold text-xs px-1 shrink-0">vs</span>
                        <span className={cn(
                          "flex-1 text-left truncate font-medium",
                          isByeMatch && "text-muted-foreground"
                        )}>
                          {isByeMatch ? 'BYE' : (m.away || '— À définir')}
                        </span>
                        {isByeMatch && (
                          <Badge variant="secondary" className="text-[10px] shrink-0 py-0 px-1.5">
                            Auto
                          </Badge>
                        )}
                        {!isByeMatch && m.home && m.away && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>
                  <span className={cn(
                    "font-semibold",
                    placedTeams.length === numTeams ? "text-emerald-600" : "text-primary"
                  )}>
                    {placedTeams.length}
                  </span>
                  {' '}/ {numTeams} équipes placées
                </p>
                {numByes > 0 && (
                  <p className="text-xs">
                    Les {numByes} équipe{numByes > 1 ? 's' : ''} en tête de série bénéficieront d'une exemption au premier tour.
                  </p>
                )}
              </div>
              <Button
                onClick={handleGenerate}
                disabled={placedTeams.length < numTeams || isGenerating}
                className="gap-2 min-h-[44px] w-full sm:w-auto"
              >
                <Trophy className="w-4 h-4" />
                {isGenerating ? 'Génération...' : "Générer l'arbre final"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KnockoutBracketSeeding;
