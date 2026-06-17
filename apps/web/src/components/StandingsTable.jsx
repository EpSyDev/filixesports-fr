
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClubBadge from '@/components/ClubBadge.jsx';

const StandingsTable = ({ standings = [], loading = false }) => {
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
    <Card className="bg-card shadow-sm border-border animate-in fade-in duration-300">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
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
                        rank <= 3 && "bg-primary/5 border-l-4 border-l-primary"
                      )}
                    >
                      <TableCell className="text-center font-bold text-muted-foreground">{rank}</TableCell>
                      <TableCell className="font-semibold text-foreground">
                        <ClubBadge teamName={s.teamName} />
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{s.played || 0}</TableCell>
                      <TableCell className="text-center">{s.won || 0}</TableCell>
                      <TableCell className="text-center">{s.drawn || 0}</TableCell>
                      <TableCell className="text-center">{s.lost || 0}</TableCell>
                      <TableCell className="text-center text-muted-foreground hidden sm:table-cell">{s.goalsFor || 0}</TableCell>
                      <TableCell className="text-center text-muted-foreground hidden sm:table-cell">{s.goalsAgainst || 0}</TableCell>
                      <TableCell className={cn(
                        "text-center font-semibold",
                        diff > 0 ? "text-emerald-500" : diff < 0 ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {diff > 0 ? `+${diff}` : diff}
                      </TableCell>
                      <TableCell className="text-center font-black text-primary text-lg">{s.points || 0}</TableCell>
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
