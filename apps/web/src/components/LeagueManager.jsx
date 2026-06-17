
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import InlineMatchScoreInput from './InlineMatchScoreInput.jsx';
import ClubBadge from './ClubBadge';
import { generateRoundRobinMatches, calculateLeagueStandings } from '@/utils/competitionUtils';
import { toast } from 'sonner';
import { Trash2, Calendar, Trophy, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const LeagueManager = ({ competition }) => {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [newTeam, setNewTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isUpdatingStandings, setIsUpdatingStandings] = useState(false);

  useEffect(() => {
    fetchLeagueData();
  }, [competition.id]);

  const fetchLeagueData = async () => {
    setLoading(true);
    try {
      const [teamsRes, matchesRes, standingsRes] = await Promise.all([
        pb.collection('league_teams').getFullList({ filter: `competitionId="${competition.id}"`, $autoCancel: false }),
        pb.collection('league_matches').getFullList({ filter: `competitionId="${competition.id}"`, sort: 'matchday', $autoCancel: false }),
        pb.collection('league_standings').getFullList({ filter: `competitionId="${competition.id}"`, sort: 'rank', $autoCancel: false })
      ]);
      setTeams(teamsRes);
      setMatches(matchesRes);
      setStandings(standingsRes);
    } catch (error) {
      console.error("Error fetching league data:", error);
      toast.error('Erreur lors du chargement des données de la ligue');
    } finally {
      setLoading(false);
    }
  };

  const refreshStandings = async () => {
    setIsUpdatingStandings(true);
    try {
      const standingsRes = await pb.collection('league_standings').getFullList({ filter: `competitionId="${competition.id}"`, sort: 'rank', $autoCancel: false });
      setStandings(standingsRes);
    } catch (error) {
      console.error("Error refreshing standings:", error);
    } finally {
      setIsUpdatingStandings(false);
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.trim()) return;
    
    try {
      const record = await pb.collection('league_teams').create({
        competitionId: competition.id,
        teamName: newTeam.trim()
      }, { $autoCancel: false });
      
      setTeams([...teams, record]);
      setNewTeam('');
      toast.success('Équipe ajoutée');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'équipe');
    }
  };

  const handleDeleteTeam = async (id) => {
    try {
      await pb.collection('league_teams').delete(id, { $autoCancel: false });
      setTeams(teams.filter(t => t.id !== id));
      toast.success('Équipe supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleGenerateCalendar = async () => {
    if (teams.length < 2) {
      toast.error('Il faut au moins 2 équipes pour générer un calendrier');
      return;
    }
    
    setGenerating(true);
    try {
      const existingMatches = await pb.collection('league_matches').getFullList({ filter: `competitionId="${competition.id}"`, $autoCancel: false });
      const existingStandings = await pb.collection('league_standings').getFullList({ filter: `competitionId="${competition.id}"`, $autoCancel: false });
      
      for (const m of existingMatches) {
        await pb.collection('league_matches').delete(m.id, { $autoCancel: false });
      }
      for (const s of existingStandings) {
        await pb.collection('league_standings').delete(s.id, { $autoCancel: false });
      }

      const newMatches = generateRoundRobinMatches(teams);
      const createdMatches = [];
      
      for (const m of newMatches) {
        const rec = await pb.collection('league_matches').create({
          competitionId: competition.id,
          matchday: m.matchday,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          status: 'scheduled'
        }, { $autoCancel: false });
        createdMatches.push(rec);
      }

      const initialStandings = teams.map((t, i) => ({
        competitionId: competition.id,
        teamName: t.teamName,
        played: 0, won: 0, drawn: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, rank: i + 1
      }));
      
      const createdStandings = [];
      for (const s of initialStandings) {
        const rec = await pb.collection('league_standings').create(s, { $autoCancel: false });
        createdStandings.push(rec);
      }

      setMatches(createdMatches.sort((a,b) => a.matchday - b.matchday));
      setStandings(createdStandings);
      toast.success('Calendrier généré avec succès');
      
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la génération du calendrier');
    } finally {
      setGenerating(false);
    }
  };

  const updateStandingsInDb = async (newMatches) => {
    const newStandingsData = calculateLeagueStandings(newMatches, teams);
    
    for (const ns of newStandingsData) {
      const existingRec = standings.find(s => s.teamName === ns.teamName);
      if (existingRec) {
        await pb.collection('league_standings').update(existingRec.id, {
          played: ns.played,
          won: ns.won,
          drawn: ns.drawn,
          lost: ns.lost,
          points: ns.points,
          goalsFor: ns.goalsFor,
          goalsAgainst: ns.goalsAgainst,
          rank: ns.rank
        }, { $autoCancel: false });
      }
    }
    await refreshStandings();
  };

  const handleSaveMatchScore = async (matchId, homeScore, awayScore) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const isPlayed = homeScore !== '' && awayScore !== '' && homeScore !== null && awayScore !== null;
    const status = isPlayed ? 'played' : 'scheduled';
    const hScore = isPlayed ? Number(homeScore) : null;
    const aScore = isPlayed ? Number(awayScore) : null;

    try {
      const saved = await pb.collection('league_matches').update(matchId, {
        homeScore: hScore,
        awayScore: aScore,
        status
      }, { $autoCancel: false });
      
      const newMatches = matches.map(m => m.id === saved.id ? saved : m);
      setMatches(newMatches);
      
      await updateStandingsInDb(newMatches);
      // We rely on InlineMatchScoreInput to show the success indication to avoid spamming toasts
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de l\'enregistrement du score');
      throw error;
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce match ?')) return;

    try {
      await pb.collection('league_matches').delete(matchId, { $autoCancel: false });
      
      const newMatches = matches.filter(m => m.id !== matchId);
      setMatches(newMatches);
      
      await updateStandingsInDb(newMatches);
      toast.success('Match supprimé');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la suppression du match');
      throw error;
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-96 w-full rounded-xl" /></div>;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
          <div>
            <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Trophy className="text-primary w-5 h-5 md:w-6 md:h-6" /> {competition.name}
            </CardTitle>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Gestion de la ligue - Saison {competition.season || 'N/A'}</p>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-1">LIGUE</Badge>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Équipes Participantes ({teams.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddTeam} className="flex gap-2">
                <Input 
                  placeholder="Nom de l'équipe" 
                  value={newTeam} 
                  onChange={(e) => setNewTeam(e.target.value)}
                  className="bg-background text-foreground min-h-[44px]"
                />
                <Button type="submit" size="icon" disabled={!newTeam.trim()} className="shrink-0 min-h-[44px] min-w-[44px]"><Plus className="w-5 h-5" /></Button>
              </form>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center justify-between bg-muted/50 p-2.5 rounded-lg border border-border/50">
                    <ClubBadge teamName={team.teamName} />
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.id)} className="h-10 w-10 text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
                {teams.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Aucune équipe ajoutée.</p>}
              </div>

              <div className="pt-4 border-t border-border">
                <Button 
                  onClick={handleGenerateCalendar} 
                  disabled={teams.length < 2 || generating}
                  className="w-full gap-2 min-h-[44px]"
                >
                  <Calendar className="w-4 h-4" />
                  {generating ? 'Génération...' : 'Générer le calendrier'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {standings.length > 0 && (
            <Card className="bg-card border-border shadow-md relative overflow-hidden">
              {isUpdatingStandings && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                  <Skeleton className="w-full h-full opacity-20" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">Classement</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto custom-scrollbar">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Équipe</TableHead>
                        <TableHead className="text-center w-12">J</TableHead>
                        <TableHead className="text-center w-12">V</TableHead>
                        <TableHead className="text-center w-12">N</TableHead>
                        <TableHead className="text-center w-12">D</TableHead>
                        <TableHead className="text-center w-16 text-primary font-bold">PTS</TableHead>
                        <TableHead className="text-center w-16">Diff</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((s, index) => (
                        <TableRow key={s.id} className={cn(index < 3 && "bg-primary/5")}>
                          <TableCell className="text-center font-bold">{s.rank}</TableCell>
                          <TableCell className="font-semibold">
                            <ClubBadge teamName={s.teamName} />
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">{s.played}</TableCell>
                          <TableCell className="text-center">{s.won}</TableCell>
                          <TableCell className="text-center">{s.drawn}</TableCell>
                          <TableCell className="text-center">{s.lost}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{s.points}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{(s.goalsFor - s.goalsAgainst) > 0 ? `+${s.goalsFor - s.goalsAgainst}` : (s.goalsFor - s.goalsAgainst)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {matches.length > 0 && (
            <Card className="bg-card border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Calendrier des matchs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {Object.entries(
                    matches.reduce((acc, match) => {
                      acc[match.matchday] = acc[match.matchday] || [];
                      acc[match.matchday].push(match);
                      return acc;
                    }, {})
                  ).map(([day, dayMatches]) => (
                    <div key={day} className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Journée {day}</h4>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {dayMatches.map(match => (
                          <InlineMatchScoreInput
                            key={match.id}
                            match={match}
                            onSave={handleSaveMatchScore}
                            onDelete={handleDeleteMatch}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueManager;
