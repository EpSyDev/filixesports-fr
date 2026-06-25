
import React, { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClubBadge from '@/components/ClubBadge.jsx';

const StandingsTable = ({ standings: standingsProp = [], loading: loadingProp = false, competitionId }) => {
  // Mode autonome : quand un competitionId est fourni (dashboard Résultats),
  // le composant récupère lui-même le classement et se met à jour en temps réel
  // dès qu'un score / classement change.
  const [fetched, setFetched] = useState([]);
  const [fetching, setFetching] = useState(!!competitionId);

  useEffect(() => {
    if (!competitionId) return;

    const load = async () => {
      const { data: matches } = await supabase
        .from('league_matches')
        .select('*')
        .eq('competitionId', competitionId);

      const map = {};
      (matches || []).forEach(m => {
        [m.homeTeam, m.awayTeam].forEach(team => {
          if (team && !map[team]) map[team] = { teamName: team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
        });
        if (!m.homeTeam || !m.awayTeam || m.status !== 'played') return;
        const hs = Number(m.homeScore) || 0;
        const as = Number(m.awayScore) || 0;
        map[m.homeTeam].played++; map[m.homeTeam].goalsFor += hs; map[m.homeTeam].goalsAgainst += as;
        map[m.awayTeam].played++; map[m.awayTeam].goalsFor += as; map[m.awayTeam].goalsAgainst += hs;
        if (hs > as) { map[m.homeTeam].won++; map[m.homeTeam].points += 3; map[m.awayTeam].lost++; }
        else if (hs < as) { map[m.awayTeam].won++; map[m.awayTeam].points += 3; map[m.homeTeam].lost++; }
        else { map[m.homeTeam].drawn++; map[m.homeTeam].points++; map[m.awayTeam].drawn++; map[m.awayTeam].points++; }
      });

      setFetched(Object.values(map));
      setFetching(false);
    };
    load();

    const channel = supabase.channel(`standings-${competitionId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'league_matches',
        filter: `competitionId=eq.${competitionId}`
      }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [competitionId]);

  const standings = competitionId ? fetched : standingsProp;
  const loading = competitionId ? fetching : loadingProp;

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  // Sort dynamically based on standard tie-breakers
  const sortedStandings = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = (a.goalsFor || 0) - (a.goalsAgainst || 0);
    const diffB = (b.goalsFor || 0) - (b.goalsAgainst || 0);
    if (diffB !== diffA) return diffB - diffA;
    return (b.goalsFor || 0) - (a.goalsFor || 0);
  });

  return (
    <Card className="bg-card shadow-sm border-primary/15 animate-in fade-in duration-300">
      <CardHeader className="bg-muted/30 border-b border-primary/15 pb-4">
        <CardTitle className="font-display uppercase text-2xl tracking-wide flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Classement de la Ligue
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-muted/10 border-border">
                <TableHead className="w-12 text-center font-bold">RANG</TableHead>
                <TableHead className="font-bold">ÉQUIPE</TableHead>
                <TableHead className="text-center w-12" title="Joués">J</TableHead>
                <TableHead className="text-center w-12" title="Victoires">V</TableHead>
                <TableHead className="text-center w-12" title="Nuls">N</TableHead>
                <TableHead className="text-center w-12" title="Défaites">D</TableHead>
                <TableHead className="text-center w-12 hidden sm:table-cell" title="Buts Pour">BP</TableHead>
                <TableHead className="text-center w-12 hidden sm:table-cell" title="Buts Contre">BC</TableHead>
                <TableHead className="text-center w-16" title="Différence">DIFF</TableHead>
                <TableHead className="text-center w-16 text-primary font-bold">PTS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStandings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    Aucun classement disponible. Les équipes et les matchs n'ont pas encore été enregistrés.
                  </TableCell>
                </TableRow>
              ) : (
                sortedStandings.map((s, index) => {
                  const diff = (s.goalsFor || 0) - (s.goalsAgainst || 0);
                  const rank = index + 1;
                  return (
                    <TableRow
                      key={s.id}
                      className={cn(
                        "transition-colors hover:bg-muted/50",
                        rank <= 3 && "bg-primary/5"
                      )}
                    >
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-stat font-extrabold text-base",
                          rank <= 3 ? "text-primary" : "text-muted-foreground"
                        )}>{rank}</span>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        <ClubBadge teamName={s.teamName} />
                      </TableCell>
                      <TableCell className="text-center font-stat text-muted-foreground">{s.played || 0}</TableCell>
                      <TableCell className="text-center font-stat">{s.won || 0}</TableCell>
                      <TableCell className="text-center font-stat">{s.drawn || 0}</TableCell>
                      <TableCell className="text-center font-stat">{s.lost || 0}</TableCell>
                      <TableCell className="text-center font-stat text-muted-foreground hidden sm:table-cell">{s.goalsFor || 0}</TableCell>
                      <TableCell className="text-center font-stat text-muted-foreground hidden sm:table-cell">{s.goalsAgainst || 0}</TableCell>
                      <TableCell className={cn(
                        "text-center font-stat font-semibold",
                        diff > 0 ? "text-emerald-500" : diff < 0 ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {diff > 0 ? `+${diff}` : diff}
                      </TableCell>
                      <TableCell className="text-center font-stat font-extrabold text-primary text-xl">{s.points || 0}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StandingsTable;
