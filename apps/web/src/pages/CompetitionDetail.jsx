
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import supabase from '@/lib/supabaseClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy, Network, ArrowLeft, Calendar, Lock, Unlock } from 'lucide-react';
import ClubBadge from '@/components/ClubBadge.jsx';
import StandingsTable from '@/components/StandingsTable.jsx';
import { cn } from '@/lib/utils.js';

const CompetitionDetail = () => {
  const { id } = useParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);

  const [leagueMatches, setLeagueMatches] = useState([]);
  const [leagueStandings, setLeagueStandings] = useState([]);

  const [pools, setPools] = useState([]);
  const [poolMatches, setPoolMatches] = useState([]);
  const [poolStandings, setPoolStandings] = useState([]);
  const [knockoutMatches, setKnockoutMatches] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: comp, error } = await supabase.from('competitions').select('*').eq('id', id).single();
        if (error) throw error;
        setCompetition(comp);

        if (comp.type === 'LIGUE') {
          const matchesRes = await supabase.from('league_matches').select('*').eq('competitionId', id).order('matchday', { ascending: true });
          setLeagueMatches(matchesRes.data || []);
        } else {
          const [poolsRes, pMatches, pStandings, kMatches] = await Promise.all([
            supabase.from('tournament_pools').select('*').eq('competitionId', id).order('poolId', { ascending: true }),
            supabase.from('pool_matches').select('*').eq('competitionId', id),
            supabase.from('pool_standings').select('*').eq('competitionId', id).order('rank', { ascending: true }),
            supabase.from('knockout_matches').select('*').eq('competitionId', id).order('matchNumber', { ascending: true })
          ]);
          setPools(poolsRes.data || []);
          setPoolMatches(pMatches.data || []);
          setPoolStandings(pStandings.data || []);
          setKnockoutMatches(kMatches.data || []);
        }
      } catch (err) {
        console.error('Error fetching competition details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!competition) return;

    const channels = [];

    if (competition.type === 'LIGUE') {
      const channel = supabase.channel(`comp-detail-league-${id}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'league_matches',
          filter: `competitionId=eq.${id}`
        }, async () => {
          const [m, s] = await Promise.all([
            supabase.from('league_matches').select('*').eq('competitionId', id).order('matchday', { ascending: true }),
            supabase.from('league_standings').select('*').eq('competitionId', id).order('rank', { ascending: true })
          ]);
          setLeagueMatches(m.data || []);
          setLeagueStandings(s.data || []);
        })
        .subscribe();
      channels.push(channel);
    }

    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [competition, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 space-y-8">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!competition) return null;

  return (
    <>
      <Helmet><title>{`${competition.name} - KOTIYA FC`}</title></Helmet>
      <div className="min-h-screen bg-transparent flex flex-col">
        <Header />
        <main className="flex-1 py-12 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/competition" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux compétitions
            </Link>

            <div className="hex-panel border border-primary/20 shadow-sm rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                {competition.type === 'LIGUE' ? <Trophy className="w-48 h-48" /> : <Network className="w-48 h-48" />}
              </div>
              <div className="relative z-10 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border bg-muted text-muted-foreground">
                    {competition.type} • Saison {competition.season || 'N/A'}
                  </div>
                  {competition.type === 'TOURNOI' && (
                    <Badge variant="outline" className={cn('px-3 py-1 text-xs gap-1.5', competition.locked ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30')}>
                      {competition.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      {competition.locked ? 'Sélections Verrouillées' : 'Sélections Ouvertes'}
                    </Badge>
                  )}
                </div>
                <h1 className="font-display uppercase text-4xl md:text-6xl text-foreground">{competition.name}</h1>
                {competition.description && <p className="mt-4 text-muted-foreground max-w-2xl">{competition.description}</p>}
              </div>
            </div>

            {competition.type === 'LIGUE' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                  <StandingsTable competitionId={id} />
                </div>
                <div className="lg:col-span-4 space-y-6">
                  <h3 className="font-display uppercase text-2xl flex items-center gap-2 mb-6"><Calendar className="text-primary w-6 h-6" /> Calendrier</h3>
                  <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
                    {leagueMatches.length === 0 ? (
                      <div className="text-center p-8 border border-dashed rounded-xl bg-muted/20 text-muted-foreground">Aucun match programmé.</div>
                    ) : (
                      Object.entries(leagueMatches.reduce((acc, m) => { acc[m.matchday] = acc[m.matchday] || []; acc[m.matchday].push(m); return acc; }, {})).map(([day, dayMatches]) => (
                        <Card key={day} className="bg-card border-border shadow-sm">
                          <CardHeader className="py-3 bg-muted/30 border-b"><CardTitle className="text-sm">Journée {day}</CardTitle></CardHeader>
                          <CardContent className="p-0">
                            {dayMatches.map(match => (
                              <div key={match.id} className="flex justify-between items-center p-3 border-b last:border-0 text-sm">
                                <span className={cn('flex-1 truncate', match.status === 'played' && match.homeScore > match.awayScore && 'font-bold')}>
                                  <ClubBadge teamName={match.homeTeam} />
                                </span>
                                <div className="px-3 font-mono font-bold bg-muted rounded py-1 mx-2 text-foreground">
                                  {match.status === 'played' ? `${match.homeScore} - ${match.awayScore}` : 'VS'}
                                </div>
                                <span className={cn('flex-1 text-right truncate', match.status === 'played' && match.awayScore > match.homeScore && 'font-bold')}>
                                  <ClubBadge teamName={match.awayTeam} />
                                </span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="pools" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="pools" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Phase de Poules</TabsTrigger>
                  <TabsTrigger value="knockout" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Phase Finale</TabsTrigger>
                </TabsList>

                <TabsContent value="pools">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pools.map(pool => (
                      <Card key={pool.id} className="bg-card border-border shadow-sm overflow-hidden flex flex-col h-full">
                        <CardHeader className="bg-muted/30 border-b py-4"><CardTitle className="text-center text-lg">{pool.name}</CardTitle></CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-8">#</TableHead>
                                <TableHead>Équipe</TableHead>
                                <TableHead className="text-center">Pts</TableHead>
                                <TableHead className="text-center">Diff</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {poolStandings.filter(s => s.poolId === pool.poolId).map((s, idx) => (
                                <TableRow key={s.id} className={idx < 2 ? 'bg-primary/5' : ''}>
                                  <TableCell className="font-bold">{s.rank}</TableCell>
                                  <TableCell className={idx < 2 ? 'font-semibold' : ''}><ClubBadge teamName={s.teamName} /></TableCell>
                                  <TableCell className="text-center font-bold text-primary">{s.points}</TableCell>
                                  <TableCell className="text-center text-muted-foreground">{s.goalsFor - s.goalsAgainst}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <div className="p-4 mt-auto border-t bg-muted/10 space-y-2">
                            {poolMatches.filter(m => m.poolId === pool.poolId).map(match => (
                              <div key={match.id} className="flex justify-between text-xs items-center py-1">
                                <span className="flex-1 truncate"><ClubBadge teamName={match.homeTeam} /></span>
                                <span className="font-mono bg-background border px-2 py-0.5 rounded shadow-sm mx-2">
                                  {match.status === 'played' ? `${match.homeScore}-${match.awayScore}` : 'VS'}
                                </span>
                                <span className="flex-1 text-right truncate"><ClubBadge teamName={match.awayTeam} /></span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="knockout">
                  {knockoutMatches.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl bg-muted/20">La phase finale n'a pas encore été générée.</div>
                  ) : (
                    <div className="bg-card border border-border rounded-2xl p-6 overflow-x-auto">
                      <div className="flex gap-16 min-w-max p-4 justify-center">
                        {['16', '8', '4', '2'].map((roundNum) => {
                          const roundMatches = knockoutMatches.filter(m => m.round === roundNum);
                          if (roundMatches.length === 0) return null;
                          const roundName = roundNum === '16' ? 'Huitièmes' : roundNum === '8' ? 'Quarts' : roundNum === '4' ? 'Demies' : 'Finale';
                          return (
                            <div key={roundNum} className="flex flex-col gap-8 w-72">
                              <h3 className="font-bold text-center text-xl mb-6 text-muted-foreground uppercase tracking-wider">{roundName}</h3>
                              <div className="flex flex-col justify-around h-full gap-8">
                                {roundMatches.map(match => (
                                  <div key={match.id} className="bg-background border shadow-md rounded-xl overflow-hidden">
                                    <div className="p-4 space-y-3">
                                      <div className={`flex justify-between items-center text-base ${match.winner === match.homeTeam ? 'font-bold text-primary' : ''}`}>
                                        <span className="truncate"><ClubBadge teamName={match.homeTeam || 'À définir'} /></span>
                                        <span className="font-mono bg-muted px-2 py-1 rounded">{match.homeScore ?? '-'}</span>
                                      </div>
                                      <div className="h-px bg-border/50 w-full" />
                                      <div className={`flex justify-between items-center text-base ${match.winner === match.awayTeam ? 'font-bold text-primary' : ''}`}>
                                        <span className="truncate"><ClubBadge teamName={match.awayTeam || 'À définir'} /></span>
                                        <span className="font-mono bg-muted px-2 py-1 rounded">{match.awayScore ?? '-'}</span>
                                      </div>
                                    </div>
                                    {match.round === '2' && match.winner && (
                                      <div className="bg-accent text-accent-foreground text-center py-1.5 text-xs font-bold uppercase tracking-wider">Vainqueur !</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default CompetitionDetail;
