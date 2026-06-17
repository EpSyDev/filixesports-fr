
import React, { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2, Edit2, Plus, X } from 'lucide-react';

const CompetitionTeamsManager = ({ competitionId }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (competitionId) fetchTeams();
  }, [competitionId]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('league_teams')
        .select('*')
        .eq('competitionId', competitionId)
        .order('teamName', { ascending: true });
      if (error) throw error;
      setTeams(data);
    } catch (err) {
      toast.error('Erreur lors du chargement des équipes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        const { data: updated, error } = await supabase
          .from('league_teams').update({ teamName: teamName.trim() }).eq('id', editingId).select().single();
        if (error) throw error;
        setTeams(teams.map(t => t.id === editingId ? updated : t));
        toast.success('Équipe mise à jour.');
      } else {
        const { data: created, error } = await supabase
          .from('league_teams').insert({ competitionId, teamName: teamName.trim() }).select().single();
        if (error) throw error;
        setTeams([...teams, created]);
        toast.success('Équipe ajoutée.');
      }
      resetForm();
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement de l\'équipe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette équipe ?')) return;
    try {
      const { error } = await supabase.from('league_teams').delete().eq('id', id);
      if (error) throw error;
      setTeams(teams.filter(t => t.id !== id));
      toast.success('Équipe supprimée.');
    } catch (err) {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const resetForm = () => { setTeamName(''); setEditingId(null); };
  const startEdit = (team) => { setTeamName(team.teamName); setEditingId(team.id); };

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      <Card className="bg-card shadow-sm border-border">
        <CardHeader><CardTitle className="text-lg">{editingId ? 'Modifier l\'équipe' : 'Ajouter une équipe'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="Nom de l'équipe" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="flex-1 min-h-[44px]" required />
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || !teamName.trim()} className="min-h-[44px] flex-1 sm:flex-none">
                {editingId ? 'Mettre à jour' : <><Plus className="w-4 h-4 mr-2" /> Ajouter</>}
              </Button>
              {editingId && <Button type="button" variant="outline" onClick={resetForm} className="min-h-[44px]"><X className="w-4 h-4" /></Button>}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-card shadow-sm border-border">
        <CardHeader><CardTitle className="text-lg">Équipes ({teams.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {teams.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune équipe enregistrée.</p>
            ) : (
              teams.map(team => (
                <div key={team.id} className="flex justify-between items-center p-3 bg-muted/30 border border-border/50 rounded-lg hover:bg-muted/60 transition-colors">
                  <span className="font-semibold text-foreground">{team.teamName}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(team)} className="text-primary hover:text-primary hover:bg-primary/10"><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionTeamsManager;
