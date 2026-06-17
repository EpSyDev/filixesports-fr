
import React, { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Trash2, CalendarDays, Loader2, Sparkles } from 'lucide-react';
import InlineMatchScoreInput from './InlineMatchScoreInput.jsx';
import { generateRoundRobinMatches, calculateLeagueStandings } from '@/utils/competitionUtils';

const MatchManager = ({ competitionId }) => {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generateType, setGenerateType] = useState('single');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [newMatch, setNewMatch] = useState({
    homeTeam: '',
    awayTeam: ''
  });

  useEffect(() => {
    if (competitionId) {
      fetchData();
    }
  }, [competitionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, matchesRes, standingsRes] = await Promise.all([
        supabase.from('league_teams').select('*').eq('competitionId', competitionId).order('teamName', { ascending: true }),
        supabase.from('league_matches').select('*').eq('competitionId', competitionId).order('created_at', { ascending: false }),
        supabase.from('league_standings').select('*').eq('competitionId', competitionId).order('rank', { ascending: true })
      ]);
      if (teamsRes.error) throw teamsRes.error;
      if (matchesRes.error) throw matchesRes.error;
      if (standingsRes.error) throw standingsRes.error;
      setTeams(teamsRes.data);
      setMatches(matchesRes.data);
      setStandings(standingsRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  const updateStandingsInDb = async (newMatches) => {
    // Calculates updated standings array based on the new match results and teams
    const newStandingsData = calculateLeagueStandings(newMatches, teams);
    
    await Promise.all(newStandingsData.map(ns => {
      const existingRec = standings.find(s => s.teamName === ns.teamName);
      if (!existingRec) return Promise.resolve();
      return supabase.from('league_standings').update({
        played: ns.played, won: ns.won, drawn: ns.drawn, lost: ns.lost,
        points: ns.points, goalsFor: ns.goalsFor, goalsAgainst: ns.goalsAgainst, rank: ns.rank
      }).eq('id', existingRec.id);
    }));

    const { data: refreshed } = await supabase.from('league_standings').select('*').eq('competitionId', competitionId).order('rank', { ascending: true });
    setStandings(refreshed || []);
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    if (!newMatch.homeTeam || !newMatch.awayTeam) {
      toast.error('Veuillez sélectionner les deux équipes.');
      return;
    }
    if (newMatch.homeTeam === newMatch.awayTeam) {
      toast.error('Une équipe ne peut pas jouer contre elle-même.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: created, error } = await supabase.from('league_matches').insert({
        competitionId, homeTeam: newMatch.homeTeam, awayTeam: newMatch.awayTeam, status: 'scheduled'
      }).select().single();
      if (error) throw error;
      setMatches([created, ...matches]);
      setNewMatch({ homeTeam: '', awayTeam: '' });
      toast.success('Match créé avec succès.');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la création du match.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateCalendar = async () => {
    if (teams.length < 2) {
      toast.error("Il faut au moins 2 équipes pour générer un calendrier.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const baseMatches = generateRoundRobinMatches(teams);
      let finalMatches = [...baseMatches];
      
      if (generateType === 'double') {
        const maxMatchday = Math.max(...baseMatches.map(m => m.matchday));
        const returnMatches = baseMatches.map(m => ({
          ...m,
          matchday: m.matchday + maxMatchday,
          homeTeam: m.awayTeam,
          awayTeam: m.homeTeam
        }));
        finalMatches = [...finalMatches, ...returnMatches];
      }

      const toInsert = finalMatches.map(m => ({
        competitionId, matchday: m.matchday, homeTeam: m.homeTeam, awayTeam: m.awayTeam, status: 'scheduled'
      }));
      const { data: createdMatches, error: insertErr } = await supabase.from('league_matches').insert(toInsert).select();
      if (insertErr) throw insertErr;

      const { data: newMatchesRes } = await supabase.from('league_matches').select('*').eq('competitionId', competitionId).order('created_at', { ascending: false });
      setMatches(newMatchesRes || []);
      
      setIsGenerateDialogOpen(false);
      toast.success(`${createdMatches.length} matchs générés avec succès.`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération du calendrier.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateMatch = async (matchId, homeScore, awayScore) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const isPlayed = homeScore !== '' && awayScore !== '' && homeScore !== null && awayScore !== null;
    const status = isPlayed ? 'played' : 'scheduled';
    const hScore = isPlayed ? Number(homeScore) : null;
    const aScore = isPlayed ? Number(awayScore) : null;

    try {
      const payload = {
        homeScore: hScore,
        awayScore: aScore,
        status: status
      };
      
      const { data: saved, error: updateErr } = await supabase.from('league_matches').update(payload).eq('id', matchId).select().single();
      if (updateErr) throw updateErr;
      const newMatches = matches.map(m => m.id === saved.id ? saved : m);
      
      setMatches(newMatches);
      
      // Update the standings using the updated matches array
      await updateStandingsInDb(newMatches);
      
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la mise à jour du match.');
      throw error; // Rethrow to inform InlineMatchScoreInput of the failure
    }
  };

  const handleDeleteMatch = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce match ?')) return;

    try {
      const { error: delErr } = await supabase.from('league_matches').delete().eq('id', id);
      if (delErr) throw delErr;
      const newMatches = matches.filter(m => m.id !== id);
      setMatches(newMatches);
      
      // Update standings after a match is deleted as well
      await updateStandingsInDb(newMatches);
      
      toast.success('Match supprimé.');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la suppression.');
      throw error;
    }
  };

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="bg-card shadow-sm border-border">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" /> Nouveau Match
          </CardTitle>
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="min-h-[44px] gap-2 shrink-0">
                <Sparkles className="w-4 h-4" /> Générer le calendrier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Générer le calendrier</DialogTitle>
                <DialogDescription>
                  Générez automatiquement tous les matchs entre les {teams.length} équipes de cette compétition.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <RadioGroup value={generateType} onValueChange={setGenerateType} className="space-y-3">
                  <div className="flex items-center space-x-3 bg-muted/50 p-4 rounded-xl border border-border/50 transition-colors hover:border-border">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single" className="flex-1 cursor-pointer font-medium leading-snug">
                      <div className="text-foreground">Matchs aller uniquement</div>
                      <div className="text-sm text-muted-foreground font-normal mt-1">Chaque équipe affronte les autres une seule fois.</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 bg-muted/50 p-4 rounded-xl border border-border/50 transition-colors hover:border-border">
                    <RadioGroupItem value="double" id="double" />
                    <Label htmlFor="double" className="flex-1 cursor-pointer font-medium leading-snug">
                      <div className="text-foreground">Matchs aller-retour</div>
                      <div className="text-sm text-muted-foreground font-normal mt-1">Chaque équipe affronte les autres deux fois (domicile et extérieur).</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)} disabled={isGenerating} className="min-h-[44px]">
                  Annuler
                </Button>
                <Button onClick={handleGenerateCalendar} disabled={isGenerating || teams.length < 2} className="min-h-[44px]">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...</> : 'Générer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateMatch} className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Domicile</label>
              <Select value={newMatch.homeTeam} onValueChange={(v) => setNewMatch(prev => ({...prev, homeTeam: v}))}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Équipe Domicile" /></SelectTrigger>
                <SelectContent>
                  {teams.map(t => <SelectItem key={t.id} value={t.teamName}>{t.teamName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center font-bold text-muted-foreground pb-3 px-2 hidden sm:flex">VS</div>
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Extérieur</label>
              <Select value={newMatch.awayTeam} onValueChange={(v) => setNewMatch(prev => ({...prev, awayTeam: v}))}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Équipe Extérieur" /></SelectTrigger>
                <SelectContent>
                  {teams.map(t => <SelectItem key={t.id} value={t.teamName}>{t.teamName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting || !newMatch.homeTeam || !newMatch.awayTeam} className="w-full sm:w-auto min-h-[44px] mt-2 sm:mt-0">
              <Plus className="w-4 h-4 mr-2" /> Ajouter manuellement
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Liste des Matchs ({matches.length})</h3>
        </div>
        {matches.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-xl bg-muted/20 text-muted-foreground">
            Aucun match n'a encore été créé pour cette compétition. Générez un calendrier ou ajoutez-en manuellement.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {matches.map(match => (
              <InlineMatchScoreInput
                key={match.id}
                match={match}
                onSave={handleUpdateMatch}
                onDelete={handleDeleteMatch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchManager;
