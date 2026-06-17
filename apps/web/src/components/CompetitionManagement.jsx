
import React, { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trophy, Plus, Settings, Users, CalendarDays, BarChart3, Loader2, Trash2 } from 'lucide-react';
import CompetitionTeamsManager from './CompetitionTeamsManager';
import MatchManager from './MatchManager';
import StandingsTable from './StandingsTable';

const CompetitionManagement = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCompId, setSelectedCompId] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [createData, setCreateData] = useState({
    name: '', season: new Date().getFullYear().toString(), type: 'LIGUE', status: 'draft', description: ''
  });

  const [editData, setEditData] = useState({
    name: '', season: '', type: 'LIGUE', status: 'draft', description: ''
  });

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCompetitions(data);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les compétitions.');
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();

    const channel = supabase.channel('comp-management')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, () => {
        fetchCompetitions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const selectedComp = competitions.find(c => c.id === selectedCompId);

  useEffect(() => {
    if (selectedComp) {
      setEditData({
        name: selectedComp.name || '',
        season: selectedComp.season || '',
        type: selectedComp.type || 'LIGUE',
        status: selectedComp.status || 'draft',
        description: selectedComp.description || ''
      });
    }
  }, [selectedComp]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createData.name.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: newComp, error } = await supabase.from('competitions').insert({ ...createData, locked: false }).select().single();
      if (error) throw error;
      toast.success('Compétition créée avec succès');
      setIsCreateOpen(false);
      setCreateData({ name: '', season: new Date().getFullYear().toString(), type: 'LIGUE', status: 'draft', description: '' });
      setSelectedCompId(newComp.id);
    } catch (err) {
      toast.error('Erreur lors de la création de la compétition');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCompId || !editData.name.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('competitions').update(editData).eq('id', selectedCompId);
      if (error) throw error;
      toast.success('Paramètres mis à jour');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCompId) return;
    if (!window.confirm('Supprimer cette compétition et toutes ses données associées ? Cette action est irréversible.')) return;
    setIsDeleting(true);
    try {
      toast.loading('Suppression en cours...', { id: 'delete-toast' });
      // Les FK ON DELETE CASCADE suppriment automatiquement les données liées
      const { error } = await supabase.from('competitions').delete().eq('id', selectedCompId);
      if (error) throw error;
      toast.success('Compétition supprimée', { id: 'delete-toast' });
      setSelectedCompId('');
    } catch (err) {
      toast.error('Erreur lors de la suppression', { id: 'delete-toast' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-center">
        <p className="font-semibold">{error}</p>
        <Button onClick={fetchCompetitions} variant="outline" className="mt-4 border-destructive/30 hover:bg-destructive/20 text-destructive">Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card shadow-sm border-border sticky top-6 z-10">
        <CardHeader className="bg-muted/20 border-b pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Sélecteur de Compétition
            </CardTitle>
            <div className="flex w-full sm:w-auto items-center gap-2">
              {loading ? (
                <Skeleton className="w-full sm:w-[250px] h-11 rounded-md" />
              ) : (
                <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                  <SelectTrigger className="w-full sm:w-[250px] min-h-[44px]">
                    <SelectValue placeholder="Sélectionner une compétition..." />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.length === 0 ? (
                      <SelectItem value="none" disabled>Aucune compétition trouvée</SelectItem>
                    ) : (
                      competitions.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} {c.season && `(${c.season})`}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="min-h-[44px] shrink-0" title="Nouvelle compétition">
                    <Plus className="w-5 h-5 sm:mr-2" /><span className="hidden sm:inline">Nouvelle</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader><DialogTitle>Créer une compétition</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nom de la compétition</label>
                      <Input placeholder="Ex: Ligue FC25" value={createData.name} onChange={e => setCreateData({...createData, name: e.target.value})} required className="min-h-[44px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Saison</label>
                        <Input placeholder="2026" value={createData.season} onChange={e => setCreateData({...createData, season: e.target.value})} className="min-h-[44px]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={createData.type} onValueChange={v => setCreateData({...createData, type: v})}>
                          <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LIGUE">Ligue</SelectItem>
                            <SelectItem value="TOURNOI">Tournoi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input placeholder="Description optionnelle..." value={createData.description} onChange={e => setCreateData({...createData, description: e.target.value})} className="min-h-[44px]" />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full min-h-[44px] mt-2">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!selectedCompId && !loading && (
        <div className="text-center py-16 px-4 bg-card rounded-xl border border-dashed border-border flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Aucune compétition sélectionnée</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">Sélectionnez une compétition existante ou créez-en une nouvelle.</p>
          </div>
        </div>
      )}

      {selectedCompId && selectedComp && (
        <Tabs defaultValue="teams" className="w-full">
          <div className="overflow-x-auto pb-2 mb-6 custom-scrollbar">
            <TabsList className="inline-flex w-max min-w-full h-auto p-1 bg-muted/50">
              <TabsTrigger value="teams" className="py-2.5 px-6 min-h-[44px] flex items-center gap-2"><Users className="w-4 h-4" /> Équipes</TabsTrigger>
              <TabsTrigger value="matches" className="py-2.5 px-6 min-h-[44px] flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Matchs</TabsTrigger>
              <TabsTrigger value="results" className="py-2.5 px-6 min-h-[44px] flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Résultats</TabsTrigger>
              <TabsTrigger value="settings" className="py-2.5 px-6 min-h-[44px] flex items-center gap-2 ml-auto"><Settings className="w-4 h-4" /> Paramètres</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="teams" className="animate-in fade-in duration-300">
            <CompetitionTeamsManager competitionId={selectedCompId} />
          </TabsContent>
          <TabsContent value="matches" className="animate-in fade-in duration-300">
            <MatchManager competitionId={selectedCompId} />
          </TabsContent>
          <TabsContent value="results" className="animate-in fade-in duration-300">
            <StandingsTable competitionId={selectedCompId} />
          </TabsContent>
          <TabsContent value="settings" className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card shadow-sm border-border">
                <CardHeader><CardTitle>Paramètres de la compétition</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nom</label>
                      <Input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} required className="min-h-[44px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Saison</label>
                        <Input value={editData.season} onChange={e => setEditData({...editData, season: e.target.value})} className="min-h-[44px]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Statut</label>
                        <Select value={editData.status} onValueChange={v => setEditData({...editData, status: v})}>
                          <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Brouillon</SelectItem>
                            <SelectItem value="active">En cours</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="min-h-[44px]" />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full min-h-[44px] mt-4">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer les modifications'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <Card className="bg-destructive/5 border-destructive/20 shadow-sm h-fit">
                <CardHeader><CardTitle className="text-destructive">Zone de danger</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-6">La suppression entraînera la perte définitive de toutes les équipes, matchs et classements associés.</p>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="w-full min-h-[44px]">
                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
                    Supprimer la compétition
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CompetitionManagement;
