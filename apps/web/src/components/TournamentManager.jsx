
import React, { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import InlineMatchScoreInput from './InlineMatchScoreInput';
import PoolAssignmentManager from './PoolAssignmentManager';
import PoolGenerationHandler from './PoolGenerationHandler';
import KnockoutBracketManager from './KnockoutBracketManager';
import ClubBadge from './ClubBadge';
import { useCompetitionLock } from '@/hooks/useCompetitionLock';
import { calculatePoolStandings } from '@/utils/competitionUtils';
import { toast } from 'sonner';
import { Trash2, Network, Plus, ArrowRight, Edit, RotateCcw, Lock, Unlock, CheckSquare, Square, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const TournamentManager = ({ competition }) => {
  const [teams, setTeams] = useState([]);
  const [pools, setPools] = useState([]);
  const [poolMatches, setPoolMatches] = useState([]);
  const [poolStandings, setPoolStandings] = useState([]);
  const [knockoutMatches, setKnockoutMatches] = useState([]);
  const [qualifiedTeams, setQualifiedTeams] = useState([]);

  const [newTeam, setNewTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams');
  const [isUpdatingStandings, setIsUpdatingStandings] = useState(false);

  const [draftPools, setDraftPools] = useState([]);
  const [isModifyingPools, setIsModifyingPools] = useState(false);

  const { isLocked, toggleLock, loading: lockLoading } = useCompetitionLock(competition.id);

  useEffect(() => {
    fetchTournamentData();
  }, [competition.id]);

  const fetchTournamentData = async () => {
    setLoading(true);
    try {
      const [teamsRes, poolsRes, pMatchesRes, pStandingsRes, kMatchesRes] = await Promise.all([
        supabase.from('tournament_teams').select('*').eq('competitionId', competition.id),
        supabase.from('tournament_pools').select('*').eq('competitionId', competition.id).order('poolId', { ascending: true }),
        supabase.from('pool_matches').select('*').eq('competitionId', competition.id).order('matchday', { ascending: true }),
        supabase.from('pool_standings').select('*').eq('competitionId', competition.id).order('rank', { ascending: true }),
        supabase.from('knockout_matches').select('*').eq('competitionId', competition.id).order('matchNumber', { ascending: true })
      ]);
      const t = teamsRes.data || [], p = poolsRes.data || [], pm = pMatchesRes.data || [],
            km = kMatchesRes.data || [];
      // Normalise team → teamName pour tout le code aval
      const ps = (pStandingsRes.data || []).map(s => ({ ...s, teamName: s.teamName || s.team }));
      setTeams(t);
      setPools(p);
      setPoolMatches(pm);
      setPoolStandings(ps);
      setKnockoutMatches(km);
      setQualifiedTeams(ps.filter(s => s.qualified));

      if (km.length > 0) {
        setActiveTab('knockout');
      } else if (p.length > 0) {
        setActiveTab('pools');
      } else if (t.length === 24) {
        setActiveTab('assignment');
      } else {
        setActiveTab('teams');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du tournoi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async () => {
    try {
      const newState = await toggleLock();
      // Après verrouillage, naviguer directement vers la phase finale
      if (newState && knockoutMatches.length === 0) {
        setActiveTab('knockout');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshStandings = async () => {
    setIsUpdatingStandings(true);
    try {
      const { data } = await supabase.from('pool_standings').select('*').eq('competitionId', competition.id).order('rank', { ascending: true });
      const ps = data || [];
      setPoolStandings(ps);
      setQualifiedTeams(ps.filter(s => s.qualified));
    } finally {
      setIsUpdatingStandings(false);
    }
  };

  const allPoolMatchesPlayed = poolMatches.length > 0 && poolMatches.every(m => m.status === 'played');

  const toggleTeamSelection = async (team) => {
    if (isLocked) {
      toast.error("Les sélections sont verrouillées. Déverrouillez pour modifier.");
      return;
    }
    const isSelected = qualifiedTeams.some(t => t.id === team.id);
    setQualifiedTeams(prev => isSelected ? prev.filter(t => t.id !== team.id) : [...prev, team]);
    try {
      await supabase.from('pool_standings').update({ qualified: !isSelected }).eq('id', team.id);
    } catch {
      toast.error("Erreur de synchronisation.");
    }
  };

  const handleClearSelection = async () => {
    if (isLocked) return;
    const previouslySelected = [...qualifiedTeams];
    setQualifiedTeams([]);
    try {
      await Promise.all(previouslySelected.map(t =>
        supabase.from('pool_standings').update({ qualified: false }).eq('id', t.id)
      ));
      toast.success("Sélection réinitialisée.");
    } catch (err) {
      console.error(err);
    }
  };

  const isReadyForPools = teams.length >= 4 && teams.length % 4 === 0;

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.trim()) return;
    try {
      const { data: record, error } = await supabase.from('tournament_teams').insert({
        competitionId: competition.id, teamName: newTeam.trim()
      }).select().single();
      if (error) throw error;
      setTeams([...teams, record]);
      setNewTeam('');
      toast.success('Équipe ajoutée');
    } catch {
      toast.error("Erreur lors de l'ajout de l'équipe");
    }
  };

  const handleDeleteTeam = async (id) => {
    try {
      await supabase.from('tournament_teams').delete().eq('id', id);
      setTeams(teams.filter(t => t.id !== id));
      toast.success('Équipe supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Sauvegarde inline d'un match de poule (signature InlineMatchScoreInput)
  const handleSavePoolMatch = async (matchId, homeScore, awayScore) => {
    const hs = homeScore !== '' ? Number(homeScore) : null;
    const as_ = awayScore !== '' ? Number(awayScore) : null;
    const status = hs !== null && as_ !== null ? 'played' : 'scheduled';

    const { data: saved, error } = await supabase.from('pool_matches').update({
      homeScore: hs, awayScore: as_, status
    }).eq('id', matchId).select().single();
    if (error) throw error;

    const newPoolMatches = poolMatches.map(m => m.id === saved.id ? saved : m);
    setPoolMatches(newPoolMatches);

    const matchesInPool = newPoolMatches.filter(m => m.poolId === saved.poolId);
    const teamsInPool = poolStandings
      .filter(s => s.poolId === saved.poolId)
      .map(s => ({ teamName: s.teamName }));
    const newStandings = calculatePoolStandings(matchesInPool, teamsInPool);

    for (const ns of newStandings) {
      const existingRec = poolStandings.find(s => s.poolId === saved.poolId && s.teamName === ns.teamName);
      if (existingRec) {
        await supabase.from('pool_standings').update({
          played: ns.played, won: ns.won, drawn: ns.drawn, lost: ns.lost,
          points: ns.points, goalsFor: ns.goalsFor, goalsAgainst: ns.goalsAgainst, rank: ns.rank
        }).eq('id', existingRec.id);
      }
    }

    await refreshStandings();
  };

  const handleResetPools = async () => {
    if (isLocked) {
      toast.error("Impossible de réinitialiser les poules quand les sélections sont verrouillées.");
      return;
    }
    if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser les poules ? Tous les matchs planifiés seront supprimés.')) return;

    try {
      const poolMatchIds = poolMatches.map(m => m.id);
      const poolStandingIds = poolStandings.map(s => s.id);
      const poolIds = pools.map(p => p.id);
      const knockoutIds = knockoutMatches.map(k => k.id);

      await Promise.all([
        poolMatchIds.length > 0 ? supabase.from('pool_matches').delete().in('id', poolMatchIds) : Promise.resolve(),
        poolStandingIds.length > 0 ? supabase.from('pool_standings').delete().in('id', poolStandingIds) : Promise.resolve(),
        poolIds.length > 0 ? supabase.from('tournament_pools').delete().in('id', poolIds) : Promise.resolve(),
        knockoutIds.length > 0 ? supabase.from('knockout_matches').delete().in('id', knockoutIds) : Promise.resolve()
      ]);

      const teamsWithPool = teams.filter(t => t.poolId);
      if (teamsWithPool.length > 0) {
        await Promise.all(teamsWithPool.map(t =>
          supabase.from('tournament_teams').update({ poolId: null }).eq('id', t.id)
        ));
      }

      setIsModifyingPools(true);
      setActiveTab('assignment');
      await fetchTournamentData();
      toast.success('Poules réinitialisées');
    } catch {
      toast.error('Erreur lors de la réinitialisation');
    }
  };

  const handleTabChange = (value) => {
    if (value === 'knockout' && !isLocked && knockoutMatches.length === 0) {
      toast.error("Verrouillez d'abord les sélections pour accéder à la phase finale.");
      return;
    }
    setActiveTab(value);
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
          <div>
            <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Network className="text-primary w-5 h-5 md:w-6 md:h-6" /> {competition.name}
            </CardTitle>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Saison {competition.season || 'N/A'}</p>
          </div>
          <div className="flex items-center gap-3">
            {isLocked && (
              <Badge variant="secondary" className="gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 py-1 px-3">
                <Lock className="w-3 h-3" /> Bracket verrouillé
              </Badge>
            )}
            <Badge variant="default" className="bg-accent hover:bg-accent/80 text-sm px-4 py-1">TOURNOI</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="overflow-x-auto pb-2 mb-4 md:mb-6 custom-scrollbar">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full min-w-[500px]">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-auto">
            <TabsTrigger value="teams" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 min-h-[44px]">1. Équipes</TabsTrigger>
            <TabsTrigger value="assignment" disabled={!isReadyForPools && pools.length === 0} className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 min-h-[44px]">2. Répartition</TabsTrigger>
            <TabsTrigger value="pools" disabled={pools.length === 0} className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 min-h-[44px]">3. Poules</TabsTrigger>
            <TabsTrigger
              value="knockout"
              className={cn(
                "data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all py-2.5 min-h-[44px]",
                (!isLocked && knockoutMatches.length === 0) && "opacity-50 cursor-not-allowed"
              )}
            >
              4. Phase Finale
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* === ÉQUIPES === */}
        <TabsContent value="teams" className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                Inscrire des équipes
                <Badge variant={isReadyForPools ? 'default' : 'secondary'}>
                  {teams.length} équipe{teams.length !== 1 ? 's' : ''}
                  {teams.length >= 4 && teams.length % 4 !== 0 && (
                    <span className="ml-1 text-destructive">— pas un multiple de 4</span>
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <form onSubmit={handleAddTeam} className="flex gap-2">
                    <Input
                      placeholder="Nom de l'équipe"
                      value={newTeam}
                      onChange={(e) => setNewTeam(e.target.value)}
                      className="bg-background min-h-[44px]"
                      disabled={isLocked}
                    />
                    <Button type="submit" disabled={!newTeam.trim() || isLocked} className="min-h-[44px]">
                      <Plus className="w-4 h-4 mr-2" /> Ajouter
                    </Button>
                  </form>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {teams.map(team => (
                      <div key={team.id} className="flex items-center justify-between bg-muted p-2 rounded-lg border">
                        <ClubBadge teamName={team.teamName} className="font-medium text-sm truncate" />
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.id)} className="h-10 w-10 text-destructive" disabled={pools.length > 0 || isLocked} title="Supprimer l'équipe">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full lg:w-64 space-y-4 lg:border-l lg:pl-8 flex flex-col justify-center">
                  {teams.length > 0 && teams.length % 4 !== 0 ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                      Le nombre d'équipes doit être un multiple de 4.<br />
                      Il manque <strong>{4 - (teams.length % 4)}</strong> équipe{4 - (teams.length % 4) > 1 ? 's' : ''}.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {teams.length >= 4
                        ? `${teams.length} équipes → ${teams.length / 4} poule${teams.length / 4 > 1 ? 's' : ''} de 4`
                        : 'Ajoutez au moins 4 équipes (multiple de 4) pour créer les poules.'}
                    </p>
                  )}
                  <Button
                    onClick={() => setActiveTab('assignment')}
                    disabled={!isReadyForPools}
                    className="w-full py-6 min-h-[44px]"
                  >
                    Répartir les Poules <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === RÉPARTITION === */}
        <TabsContent value="assignment" className="space-y-6">
          {pools.length > 0 && !isModifyingPools ? (
            <Card className="bg-card border-border shadow-sm text-center py-12">
              <CardContent className="space-y-4">
                <Network className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                <h3 className="text-xl font-bold">Les poules ont déjà été générées</h3>
                <p className="text-muted-foreground">Vous pouvez consulter les matchs dans l'onglet "Poules".</p>
                {poolMatches.every(m => m.status === 'scheduled') && (
                  <Button variant="outline" onClick={handleResetPools} disabled={isLocked} className="mt-4 gap-2 min-h-[44px]">
                    <Edit className="w-4 h-4" /> Modifier la répartition
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <PoolAssignmentManager
                teams={teams}
                onAssignmentsChange={setDraftPools}
                qualifiedTeams={qualifiedTeams}
                setQualifiedTeams={setQualifiedTeams}
                isLocked={isLocked}
              />
              <PoolGenerationHandler
                competitionId={competition.id}
                pools={draftPools}
                onSuccess={() => {
                  setIsModifyingPools(false);
                  fetchTournamentData();
                }}
              />
            </div>
          )}
        </TabsContent>

        {/* === POULES === */}
        <TabsContent value="pools" className="space-y-6">
          {pools.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
              Répartissez les équipes dans l'onglet "Répartition" pour commencer.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl font-bold text-foreground">Phase de Poules</h3>
                </div>

                {/* Bandeau de sélection / CTA Phase Finale */}
                {!isLocked && knockoutMatches.length === 0 && (
                  <div className={cn(
                    "rounded-xl p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors",
                    qualifiedTeams.length >= 2
                      ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/50"
                      : "bg-card border-border"
                  )}>
                    <div className="space-y-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        Sélectionner les équipes qualifiées
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Cliquez sur les cases <Square className="w-3.5 h-3.5 inline mx-1 -mt-0.5" /> dans le classement pour cocher les équipes qui passent en phase finale.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                      {qualifiedTeams.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSelection}
                          className="text-destructive hover:bg-destructive/10 min-h-[44px] shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Tout décocher
                        </Button>
                      )}
                      <Button
                        onClick={handleToggleLock}
                        disabled={lockLoading || qualifiedTeams.length < 2}
                        className={cn(
                          "gap-2 min-h-[44px] flex-1 sm:flex-none",
                          qualifiedTeams.length >= 2 && "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                      >
                        <Trophy className="w-4 h-4" />
                        {qualifiedTeams.length < 2
                          ? `Sélectionner au moins 2 équipes`
                          : `Verrouiller (${qualifiedTeams.length} équipes) et créer le bracket`
                        }
                        {qualifiedTeams.length >= 2 && <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bandeau quand verrouillé */}
                {isLocked && (
                  <div className="rounded-xl p-4 border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-semibold">{qualifiedTeams.length} équipes qualifiées — sélections verrouillées</p>
                        <p className="text-sm text-muted-foreground">Déverrouillez pour modifier la sélection.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Button variant="outline" size="sm" onClick={handleToggleLock} disabled={lockLoading} className="gap-2 min-h-[44px]">
                        <Unlock className="w-4 h-4" /> Déverrouiller
                      </Button>
                      <Button size="sm" onClick={() => setActiveTab('knockout')} className="gap-2 min-h-[44px] flex-1 sm:flex-none">
                        <Trophy className="w-4 h-4" />
                        {knockoutMatches.length > 0 ? 'Voir le bracket' : 'Créer le bracket'}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                {pools.map(pool => {
                  const matchesForPool = poolMatches.filter(m => m.poolId === pool.poolId);
                  const matchdays = [...new Set(matchesForPool.map(m => m.matchday || 1))].sort((a, b) => a - b);

                  return (
                    <Card key={pool.id} className="bg-card border-border shadow-sm overflow-hidden flex flex-col relative">
                      {isUpdatingStandings && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                          <Skeleton className="w-full h-full opacity-20" />
                        </div>
                      )}
                      <CardHeader className="bg-muted/30 pb-3 border-b">
                        <CardTitle className="text-lg">{pool.name || pool.poolId}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 flex-1 flex flex-col">
                        {/* Classement */}
                        <div className="overflow-x-auto custom-scrollbar">
                          <Table className="min-w-[400px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-8">#</TableHead>
                                <TableHead>Équipe</TableHead>
                                <TableHead className="text-center">J</TableHead>
                                <TableHead className="text-center">Pts</TableHead>
                                <TableHead className="text-center">Diff</TableHead>
                                {!isLocked && (
                                  <TableHead className="text-center text-xs text-emerald-600 font-semibold w-24">Qualifier</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {poolStandings.filter(s => s.poolId === pool.poolId).map((s) => {
                                const isSelected = qualifiedTeams.some(qt => qt.id === s.id);
                                return (
                                  <TableRow
                                    key={s.id}
                                    onClick={() => !isLocked && toggleTeamSelection(s)}
                                    className={cn(
                                      "transition-colors",
                                      !isLocked ? "cursor-pointer hover:bg-muted/60" : "cursor-default",
                                      isSelected
                                        ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-l-emerald-500"
                                        : ""
                                    )}
                                  >
                                    <TableCell className="font-mono text-sm">{s.rank}</TableCell>
                                    <TableCell className="font-medium">
                                      <ClubBadge teamName={s.teamName} />
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">{s.played}</TableCell>
                                    <TableCell className="text-center font-bold text-primary">{s.points}</TableCell>
                                    <TableCell className="text-center text-muted-foreground">{(s.goalsFor - s.goalsAgainst)}</TableCell>
                                    {!isLocked && (
                                      <TableCell className="text-center">
                                        {isSelected
                                          ? <CheckSquare className="w-5 h-5 text-emerald-500 mx-auto" />
                                          : <Square className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                                        }
                                      </TableCell>
                                    )}
                                    {isLocked && isSelected && (
                                      <TableCell className="text-center">
                                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                          Qualifié
                                        </Badge>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Matchs groupés par journée */}
                        <div className="p-4 bg-muted/10 border-t mt-auto space-y-1">
                          {matchdays.map(day => (
                            <div key={day}>
                              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-2 pb-2">
                                Journée {day}
                              </h5>
                              <div className="space-y-1.5">
                                {matchesForPool
                                  .filter(m => (m.matchday || 1) === day)
                                  .map(match => (
                                    <InlineMatchScoreInput
                                      key={match.id}
                                      match={match}
                                      onSave={handleSavePoolMatch}
                                    />
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* === PHASE FINALE === */}
        <TabsContent value="knockout" className="space-y-6">
          <KnockoutBracketManager
            competitionId={competition.id}
            existingMatches={knockoutMatches}
            onMatchesGenerated={fetchTournamentData}
            qualifiedTeams={qualifiedTeams}
            isLocked={isLocked}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentManager;
