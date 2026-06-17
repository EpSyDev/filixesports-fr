
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import supabase from '@/lib/supabaseClient';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMatches } from '@/hooks/useMatches';
import { usePlayers } from '@/hooks/usePlayers';
import { useTrophies } from '@/hooks/useTrophies';
import { useMedia } from '@/hooks/useMedia';
import MediaUpload from '@/components/MediaUpload';
import MatchPlayerStats from '@/components/MatchPlayerStats';
import CompetitionManagement from '@/components/CompetitionManagement';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const { matches, createMatch, updateMatch, deleteMatch } = useMatches();
  const { players, createPlayer, updatePlayer, deletePlayer } = usePlayers();
  const { trophies, createTrophy, deleteTrophy } = useTrophies();
  const { media, createMedia, deleteMedia } = useMedia();

  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const [matchForm, setMatchForm] = useState({
    id: null, date: '', opponent: '', homeScore: '', awayScore: '', competition: '', formation: '', status: 'scheduled', notes: ''
  });

  const [playerForm, setPlayerForm] = useState({
    id: null, name: '', number: '', position: 'GB', secondaryPosition: 'none'
  });

  const [trophyForm, setTrophyForm] = useState({
    name: '', year: '', competition: '', image: null, description: ''
  });

  const handleMatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        date: matchForm.date,
        opponent: matchForm.opponent,
        homeScore: matchForm.homeScore !== '' ? Number(matchForm.homeScore) : null,
        awayScore: matchForm.awayScore !== '' ? Number(matchForm.awayScore) : null,
        competition: matchForm.competition || null,
        formation: matchForm.formation,
        status: matchForm.status,
        notes: matchForm.notes
      };

      let savedMatch;
      if (matchForm.id) {
        savedMatch = await updateMatch(matchForm.id, data);
        toast.success('Match mis à jour');
      } else {
        savedMatch = await createMatch(data);
        toast.success('Match créé');
      }
      setSelectedMatchId(savedMatch.id);
      setMatchForm(prev => ({ ...prev, id: savedMatch.id }));
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleEditMatch = (match) => {
    setMatchForm({
      id: match.id,
      date: match.date ? match.date.split('T')[0] : '',
      opponent: match.opponent || '',
      homeScore: match.homeScore ?? '',
      awayScore: match.awayScore ?? '',
      competition: match.competition || '',
      formation: match.formation || '',
      status: match.status || 'scheduled',
      notes: match.notes || ''
    });
    setSelectedMatchId(match.id);
  };

  const handleNewMatch = () => {
    setMatchForm({ id: null, date: '', opponent: '', homeScore: '', awayScore: '', competition: '', formation: '', status: 'scheduled', notes: '' });
    setSelectedMatchId(null);
  };

  const handleDeleteMatch = async (match) => {
    if (window.confirm('Supprimer ce match ?')) {
      await deleteMatch(match.id);
      if (selectedMatchId === match.id) handleNewMatch();
      toast.success('Match supprimé');
    }
  };

  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { 
        name: playerForm.name, 
        number: Number(playerForm.number), 
        position: playerForm.position,
        secondaryPosition: playerForm.secondaryPosition === 'none' ? '' : playerForm.secondaryPosition
      };
      
      if (playerForm.id) {
        await updatePlayer(playerForm.id, data);
        toast.success('Joueur mis à jour');
      } else {
        await createPlayer(data);
        toast.success('Joueur créé');
      }
      setPlayerForm({ id: null, name: '', number: '', position: 'GB', secondaryPosition: 'none' });
    } catch (error) {
      toast.error(`Erreur enregistrement joueur: ${error.message || ''}`);
    }
  };

  const handleDeletePlayer = async (id) => {
    if (window.confirm('Supprimer ce joueur ?')) {
      try {
        await deletePlayer(id);
        toast.success('Joueur supprimé avec succès');
      } catch (error) {
        console.error("Delete player failed:", error);
        toast.error(`Échec de la suppression: ${error.message || 'Erreur inconnue'}`);
      }
    }
  };

  const handleTrophySubmit = async (e) => {
    e.preventDefault();
    try {
      await createTrophy({ ...trophyForm, year: Number(trophyForm.year) });
      toast.success('Trophée créé');
      setTrophyForm({ name: '', year: '', competition: '', image: null, description: '' });
    } catch (error) {
      toast.error('Erreur trophée');
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - FC25 Esport</title>
      </Helmet>
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <Header />
        <main className="flex-1 py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Tableau de bord</h1>
              <p className="text-muted-foreground mt-2 text-base md:text-lg">Gérez les compétitions, les matchs et les effectifs.</p>
            </div>
            
            <Tabs defaultValue="competitions" className="w-full">
              <div className="overflow-x-auto pb-2 mb-4 md:mb-8 custom-scrollbar">
                <TabsList className="inline-flex w-max min-w-full h-auto p-1 bg-muted/50">
                  <TabsTrigger value="competitions" className="py-2.5 px-4 min-h-[44px]">Compétitions</TabsTrigger>
                  <TabsTrigger value="matches" className="py-2.5 px-4 min-h-[44px]">Matchs Simples</TabsTrigger>
                  <TabsTrigger value="players" className="py-2.5 px-4 min-h-[44px]">Joueurs</TabsTrigger>
                  <TabsTrigger value="trophies" className="py-2.5 px-4 min-h-[44px]">Trophées</TabsTrigger>
                  <TabsTrigger value="media" className="py-2.5 px-4 min-h-[44px]">Média</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="competitions" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CompetitionManagement />
              </TabsContent>

              <TabsContent value="matches" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5">
                    <Card className="bg-card border-border shadow-sm">
                      <CardHeader>
                        <CardTitle>{matchForm.id ? 'Modifier match' : 'Nouveau match'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleMatchSubmit} className="space-y-4">
                          <Input type="date" value={matchForm.date} onChange={e => setMatchForm(p => ({...p, date: e.target.value}))} required className="min-h-[44px]" />
                          <Input placeholder="Adversaire" value={matchForm.opponent} onChange={e => setMatchForm(p => ({...p, opponent: e.target.value}))} required className="min-h-[44px]" />
                          <div className="flex flex-col sm:flex-row gap-4">
                            <Input type="number" placeholder="Score Domicile" value={matchForm.homeScore} onChange={e => setMatchForm(p => ({...p, homeScore: e.target.value}))} className="min-h-[44px]" />
                            <Input type="number" placeholder="Score Extérieur" value={matchForm.awayScore} onChange={e => setMatchForm(p => ({...p, awayScore: e.target.value}))} className="min-h-[44px]" />
                          </div>
                          <Select value={matchForm.status} onValueChange={v => setMatchForm(p => ({...p, status: v}))}>
                            <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Planifié</SelectItem>
                              <SelectItem value="played">Joué</SelectItem>
                              <SelectItem value="cancelled">Annulé</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="submit" className="w-full transition-all duration-200 active:scale-[0.98] min-h-[44px]">Enregistrer</Button>
                          {matchForm.id && <Button type="button" variant="outline" className="w-full transition-all duration-200 min-h-[44px]" onClick={handleNewMatch}>Annuler</Button>}
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="lg:col-span-7">
                    <Card className="bg-card shadow-sm border-border">
                      <CardHeader><CardTitle>Historique des matchs</CardTitle></CardHeader>
                      <CardContent className="space-y-2 max-h-[600px] overflow-auto custom-scrollbar">
                        {matches.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">Aucun match enregistré.</p>
                        ) : (
                          matches.map(m => (
                            <div key={m.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/60 cursor-pointer transition-colors" onClick={() => handleEditMatch(m)}>
                              <div>
                                <div className="font-semibold">{m.opponent}</div>
                                <div className="text-sm text-muted-foreground">{m.date.split('T')[0]}</div>
                              </div>
                              <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-colors min-h-[44px] min-w-[44px]" onClick={(e) => { e.stopPropagation(); handleDeleteMatch(m); }}>
                                <Trash2 className="w-5 h-5"/>
                              </Button>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
                {selectedMatchId && (
                  <div className="mt-8">
                    <MatchPlayerStats matchId={selectedMatchId} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="players" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-border">
                    <CardHeader><CardTitle>Nouveau joueur</CardTitle></CardHeader>
                    <CardContent>
                      <form onSubmit={handlePlayerSubmit} className="space-y-5">
                        <div className="space-y-1">
                          <Label>Nom du joueur</Label>
                          <Input placeholder="Ex: Mbappé" value={playerForm.name} onChange={e=>setPlayerForm(p=>({...p, name: e.target.value}))} required className="min-h-[44px]"/>
                        </div>
                        
                        <div className="space-y-1">
                          <Label>Numéro de maillot</Label>
                          <Input type="number" placeholder="Ex: 9" value={playerForm.number} onChange={e=>setPlayerForm(p=>({...p, number: e.target.value}))} required className="min-h-[44px]"/>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label>Poste principal <span className="text-destructive">*</span></Label>
                            <Select value={playerForm.position} onValueChange={v=>setPlayerForm(p=>({...p, position: v}))} required>
                              <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir un poste" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GB">GB</SelectItem>
                                <SelectItem value="DC">DC</SelectItem>
                                <SelectItem value="MDC">MDC</SelectItem>
                                <SelectItem value="MOC">MOC</SelectItem>
                                <SelectItem value="BU">BU</SelectItem>
                                <SelectItem value="MG">MG</SelectItem>
                                <SelectItem value="MD">MD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-1">
                            <Label>Poste secondaire</Label>
                            <Select value={playerForm.secondaryPosition} onValueChange={v=>setPlayerForm(p=>({...p, secondaryPosition: v}))}>
                              <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Optionnel" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Aucun</SelectItem>
                                <SelectItem value="GB">GB</SelectItem>
                                <SelectItem value="DC">DC</SelectItem>
                                <SelectItem value="MDC">MDC</SelectItem>
                                <SelectItem value="MOC">MOC</SelectItem>
                                <SelectItem value="BU">BU</SelectItem>
                                <SelectItem value="MG">MG</SelectItem>
                                <SelectItem value="MD">MD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button type="submit" className="w-full transition-all duration-200 active:scale-[0.98] min-h-[44px] mt-2">
                          Sauvegarder
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border-border">
                    <CardHeader><CardTitle>Effectif</CardTitle></CardHeader>
                    <CardContent className="max-h-[500px] overflow-auto space-y-2 custom-scrollbar">
                      {players.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Aucun joueur enregistré.</p>
                      ) : (
                        players.map(p=>(
                          <div key={p.id} className="flex justify-between items-center p-3 bg-muted/30 border rounded-lg hover:bg-muted/60 transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold">{p.number} - {p.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {p.position} {p.secondaryPosition && ` / ${p.secondaryPosition}`}
                              </span>
                            </div>
                            <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-colors min-h-[44px] min-w-[44px]" onClick={() => handleDeletePlayer(p.id)}>
                              <Trash2 className="w-5 h-5"/>
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="trophies" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-border">
                    <CardHeader><CardTitle>Nouveau Trophée</CardTitle></CardHeader>
                    <CardContent>
                      <form onSubmit={handleTrophySubmit} className="space-y-4">
                        <Input placeholder="Nom du trophée" value={trophyForm.name} onChange={e=>setTrophyForm(p=>({...p, name: e.target.value}))} required className="min-h-[44px]"/>
                        <Input type="number" placeholder="Année" value={trophyForm.year} onChange={e=>setTrophyForm(p=>({...p, year: e.target.value}))} required className="min-h-[44px]"/>
                        <Button type="submit" className="w-full transition-all duration-200 active:scale-[0.98] min-h-[44px]">Ajouter</Button>
                      </form>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border-border">
                    <CardHeader><CardTitle>Palmarès</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {trophies.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Aucun trophée enregistré.</p>
                      ) : (
                        trophies.map(t=>(
                          <div key={t.id} className="flex justify-between items-center p-3 bg-muted/30 border rounded-lg hover:bg-muted/60 transition-colors">
                            <span className="font-medium">{t.year} - {t.name}</span>
                            <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-colors min-h-[44px] min-w-[44px]" onClick={()=>deleteTrophy(t.id)}>
                              <Trash2 className="w-5 h-5"/>
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="media" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MediaUpload onUpload={createMedia} />
                  <Card className="shadow-sm border-border">
                    <CardHeader><CardTitle>Médias</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {media.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Aucun média enregistré.</p>
                      ) : (
                        media.map(m=>(
                          <div key={m.id} className="flex justify-between items-center p-3 bg-muted/30 border rounded-lg hover:bg-muted/60 transition-colors">
                            <span className="font-medium truncate pr-4">{m.title}</span>
                            <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0 min-h-[44px] min-w-[44px]" onClick={()=>deleteMedia(m.id)}>
                              <Trash2 className="w-5 h-5"/>
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
