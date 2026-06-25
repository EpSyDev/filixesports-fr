
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
import { Trophy, Network, ArrowLeft, Calendar, Lock, Unlock, ListOrdered, ClipboardList } from 'lucide-react';
import ClubBadge from '@/components/ClubBadge.jsx';
import StandingsTable from '@/components/StandingsTable.jsx';
import { cn } from '@/lib/utils.js';

const CompetitionDetail = () => {
  const { id } = useParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);

  const [leagueMatches, setLeagueMatches] = useState([]);

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
          setPoolStandings((pStandings.data || []).map(s => ({ ...s, teamName: s.teamName || s.team })));
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
      const ch = supabase.channel(`comp-detail-league-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'league_matches', filter: `competitionId=eq.${id}` }, async () => {
          const m = await supabase.from('league_matches').select('*').eq('competitionId', id).order('matchday', { ascending: true });
          setLeagueMatches(m.data || []);
        })
        .subscribe();
      channels.push(ch);
    } else {
      const refreshTournament = async () => {
        const [pMatches, pStandings, kMatches] = await Promise.all([
          supabase.from('pool_matches').select('*').eq('competitionId', id),
          supabase.from('pool_standings').select('*').eq('competitionId', id).order('rank', { ascending: true }),
          supabase.from('knockout_matches').select('*').eq('competitionId', id).order('matchNumber', { ascending: true }),
        ]);
        setPoolMatches(pMatches.data || []);
        setPoolStandings((pStandings.data || []).map(s => ({ ...s, teamName: s.teamName || s.team })));
        setKnockoutMatches(kMatches.data || []);
      };
      const ch = supabase.channel(`comp-detail-tournament-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pool_matches', filter: `competitionId=eq.${id}` }, refreshTournament)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pool_standings', filter: `competitionId=eq.${id}` }, refreshTournament)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'knockout_matches', filter: `competitionId=eq.${id}` }, refreshTournament)
        .subscribe();
      channels.push(ch);
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

  // ── Données tournoi ───────────────────────────────────────────────────────
  const knockoutRoundLabel = { '16': 'Huitièmes', '8': 'Quarts de finale', '4': 'Demi-finales', '2': 'Finale', '1': '3e place' };
  const mainKnockoutRounds = ['16', '8', '4', '2', '1'].filter(r =>
    knockoutMatches.some(m => m.round === r && (m.homeTeam || m.awayTeam))
  );
  const playedPoolMatches = poolMatches.filter(m => m.status === 'played');
  const playedKnockoutMatches = knockoutMatches.filter(m => m.status === 'played' && (m.homeTeam || m.awayTeam));

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

            {/* Hero */}
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

            {/* ── LIGUE ──────────────────────────────────────────────────────── */}
            {competition.type === 'LIGUE' && (
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
            )}

            {/* ── TOURNOI ────────────────────────────────────────────────────── */}
            {competition.type === 'TOURNOI' && (
              <Tabs defaultValue="classements" className="w-full">
                <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="classements" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5" /> Classements
                  </TabsTrigger>
                  <TabsTrigger value="resultats" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Résultats
                  </TabsTrigger>
                  <TabsTrigger value="knockout" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                    <Network className="w-3.5 h-3.5" /> Phase Finale
                  </TabsTrigger>
                </TabsList>

                {/* ── Classements ── */}
                <TabsContent value="classements">
                  {pools.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
                      Les classements seront disponibles après la génération des poules.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pools.map(pool => {
                        const standings = poolStandings
                          .filter(s => s.poolId === pool.poolId)
                          .sort((a, b) => a.rank - b.rank);
                        return (
                          <Card key={pool.id} className="bg-card border-border shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b py-4">
                              <CardTitle className="text-center text-lg">{pool.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-8 text-center">#</TableHead>
                                    <TableHead>Équipe</TableHead>
                                    <TableHead className="text-center">J</TableHead>
                                    <TableHead className="text-center">V</TableHead>
                                    <TableHead className="text-center">N</TableHead>
                                    <TableHead className="text-center">D</TableHead>
                                    <TableHead className="text-center">Diff</TableHead>
                                    <TableHead className="text-center font-bold">Pts</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {standings.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={8} className="text-center text-muted-foreground py-6 text-sm">Aucun résultat encore.</TableCell>
                                    </TableRow>
                                  ) : standings.map((s, idx) => (
                                    <TableRow key={s.id} className={cn(idx < 2 && 'bg-primary/5')}>
                                      <TableCell className="text-center font-bold text-muted-foreground">{s.rank}</TableCell>
                                      <TableCell className={cn('font-medium', idx < 2 && 'font-semibold')}>
                                        <ClubBadge teamName={s.teamName} />
                                        {idx < 2 && <Badge className="ml-2 text-[9px] py-0 px-1.5 h-4 bg-emerald-500/20 text-emerald-700 border-0">Qualifié</Badge>}
                                      </TableCell>
                                      <TableCell className="text-center text-muted-foreground">{(s.wins ?? 0) + (s.draws ?? 0) + (s.losses ?? 0)}</TableCell>
                                      <TableCell className="text-center text-emerald-600 font-medium">{s.wins ?? 0}</TableCell>
                                      <TableCell className="text-center text-muted-foreground">{s.draws ?? 0}</TableCell>
                                      <TableCell className="text-center text-destructive/70">{s.losses ?? 0}</TableCell>
                                      <TableCell className="text-center text-muted-foreground">{(s.goalsFor ?? 0) - (s.goalsAgainst ?? 0)}</TableCell>
                                      <TableCell className="text-center font-bold text-primary">{s.points ?? 0}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* ── Résultats ── */}
                <TabsContent value="resultats">
                  {playedPoolMatches.length === 0 && playedKnockoutMatches.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
                      Aucun résultat disponible pour le moment.
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Phase de Poules */}
                      {playedPoolMatches.length > 0 && (
                        <section>
                          <h3 className="font-display uppercase text-xl mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary rounded-full inline-block" />
                            Phase de Poules
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pools.map(pool => {
                              const matches = playedPoolMatches.filter(m => m.poolId === pool.poolId);
                              if (matches.length === 0) return null;
                              return (
                                <Card key={pool.id} className="bg-card border-border shadow-sm overflow-hidden">
                                  <CardHeader className="bg-muted/30 border-b py-3">
                                    <CardTitle className="text-sm text-center">{pool.name}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-0">
                                    {matches.map(match => (
                                      <div key={match.id} className="flex items-center px-3 py-2.5 border-b last:border-0 gap-2 text-sm">
                                        <span className={cn('flex-1 truncate text-right', match.homeScore > match.awayScore && 'font-bold')}>
                                          <ClubBadge teamName={match.homeTeam} />
                                        </span>
                                        <span className="font-mono font-bold bg-muted px-2.5 py-1 rounded text-xs shrink-0">
                                          {match.homeScore} – {match.awayScore}
                                        </span>
                                        <span className={cn('flex-1 truncate', match.awayScore > match.homeScore && 'font-bold')}>
                                          <ClubBadge teamName={match.awayTeam} />
                                        </span>
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      {/* Phase Finale */}
                      {playedKnockoutMatches.length > 0 && (
                        <section>
                          <h3 className="font-display uppercase text-xl mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary rounded-full inline-block" />
                            Phase Finale
                          </h3>
                          <div className="space-y-4">
                            {mainKnockoutRounds.map(round => {
                              const matches = playedKnockoutMatches.filter(m => m.round === round);
                              if (matches.length === 0) return null;
                              return (
                                <Card key={round} className="bg-card border-border shadow-sm overflow-hidden">
                                  <CardHeader className="bg-muted/30 border-b py-3">
                                    <CardTitle className="text-sm">{knockoutRoundLabel[round]}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-0">
                                    {matches.map(match => (
                                      <div key={match.id} className="flex items-center px-4 py-3 border-b last:border-0 gap-3 text-sm">
                                        <span className={cn('flex-1 truncate text-right', match.winner === match.homeTeam && 'font-bold text-primary')}>
                                          <ClubBadge teamName={match.homeTeam} />
                                        </span>
                                        <span className="font-mono font-bold bg-muted px-3 py-1 rounded shrink-0">
                                          {match.homeScore} – {match.awayScore}
                                        </span>
                                        <span className={cn('flex-1 truncate', match.winner === match.awayTeam && 'font-bold text-primary')}>
                                          <ClubBadge teamName={match.awayTeam} />
                                        </span>
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ── Phase Finale (bracket) ── */}
                <TabsContent value="knockout">
                  {knockoutMatches.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
                      La phase finale n'a pas encore été générée.
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-2xl p-6 overflow-x-auto">
                      <div className="flex gap-10 min-w-max p-4 justify-center">
                        {['16', '8', '4', '2'].map((roundNum) => {
                          const roundMatches = knockoutMatches.filter(m => m.round === roundNum);
                          if (roundMatches.length === 0) return null;
                          const roundName = knockoutRoundLabel[roundNum];
                          return (
                            <div key={roundNum} className="flex flex-col gap-8 w-64">
                              <h3 className="font-bold text-center text-sm mb-4 text-muted-foreground uppercase tracking-wider">{roundName}</h3>
                              <div className="flex flex-col justify-around h-full gap-6">
                                {roundMatches.map(match => (
                                  <div key={match.id} className="bg-background border shadow-sm rounded-xl overflow-hidden">
                                    <div className={cn('flex justify-between items-center px-4 py-3 border-b border-border/50', match.winner === match.homeTeam && 'bg-primary/5')}>
                                      <span className={cn('truncate text-sm', match.winner === match.homeTeam ? 'font-bold text-primary' : 'text-foreground')}>
                                        <ClubBadge teamName={match.homeTeam || 'À définir'} />
                                      </span>
                                      <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded ml-2 text-sm shrink-0">{match.homeScore ?? '–'}</span>
                                    </div>
                                    <div className={cn('flex justify-between items-center px-4 py-3', match.winner === match.awayTeam && 'bg-primary/5')}>
                                      <span className={cn('truncate text-sm', match.winner === match.awayTeam ? 'font-bold text-primary' : 'text-foreground')}>
                                        <ClubBadge teamName={match.awayTeam || 'À définir'} />
                                      </span>
                                      <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded ml-2 text-sm shrink-0">{match.awayScore ?? '–'}</span>
                                    </div>
                                    {roundNum === '2' && match.winner && (
                                      <div className="bg-primary/10 text-primary text-center py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                                        <Trophy className="w-3 h-3" /> Vainqueur
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 3e place */}
                      {knockoutMatches.filter(m => m.round === '1' && (m.homeTeam || m.awayTeam)).map(match => (
                        <div key={match.id} className="mt-6 pt-5 border-t border-dashed border-border/40">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Match pour la 3e place</p>
                          <div className="max-w-xs bg-background border shadow-sm rounded-xl overflow-hidden">
                            <div className={cn('flex justify-between items-center px-4 py-3 border-b border-border/50', match.winner === match.homeTeam && 'bg-primary/5')}>
                              <span className={cn('truncate text-sm', match.winner === match.homeTeam ? 'font-bold text-primary' : '')}><ClubBadge teamName={match.homeTeam || 'À définir'} /></span>
                              <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded ml-2 shrink-0">{match.homeScore ?? '–'}</span>
                            </div>
                            <div className={cn('flex justify-between items-center px-4 py-3', match.winner === match.awayTeam && 'bg-primary/5')}>
                              <span className={cn('truncate text-sm', match.winner === match.awayTeam ? 'font-bold text-primary' : '')}><ClubBadge teamName={match.awayTeam || 'À définir'} /></span>
                              <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded ml-2 shrink-0">{match.awayScore ?? '–'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
