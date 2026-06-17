
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { Minus, Plus, Save, Trophy, Target, ArrowRightLeft, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const MatchPlayerStats = ({ matchId }) => {
  const [players, setPlayers] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!matchId) return;
      setLoading(true);
      try {
        // Fetch all players directly from the collection
        const playersList = await pb.collection('players').getFullList({
          sort: 'number',
          $autoCancel: false
        });
        setPlayers(playersList);

        // Fetch existing stats for this match using getList as requested
        const statsList = await pb.collection('player_stats').getList(1, 500, {
          filter: `matchId="${matchId}"`,
          $autoCancel: false
        });
        
        const map = {};
        statsList.items.forEach(r => {
          const notesStr = r.notes || '';
          const isMotm = notesStr.includes('MOTM');
          const plainNotes = notesStr.replace('MOTM', '').trim();

          map[r.playerId] = {
            id: r.id,
            rating: r.rating ?? '',
            goals: r.goals || 0,
            assists: r.assists || 0,
            shots: r.shots || 0,
            passes: r.passes || 0,
            tackles: r.tackles || 0,
            yellowCard: r.yellowCards > 0,
            redCard: r.redCards > 0,
            isMotm: isMotm,
            notes: plainNotes
          };
        });
        
        setStatsMap(map);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données des joueurs');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchId]);

  const handleStatChange = (playerId, field, value) => {
    setStatsMap(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { goals: 0, assists: 0, shots: 0, passes: 0, tackles: 0, rating: '', yellowCard: false, redCard: false, isMotm: false, notes: '' }),
        [field]: value
      }
    }));
  };

  const handleMotmChange = async (playerId, checked) => {
    try {
      // Find existing MOTM player ID to clear it from the database if needed
      const currentMotmPlayerId = Object.keys(statsMap).find(key => statsMap[key]?.isMotm);

      // 1. Optimistic UI Update for immediate feedback
      setStatsMap(prev => {
        const newMap = { ...prev };
        if (checked) {
          Object.keys(newMap).forEach(key => {
            if (newMap[key]) {
              newMap[key] = { ...newMap[key], isMotm: false };
            }
          });
        }
        newMap[playerId] = {
          ...(newMap[playerId] || { goals: 0, assists: 0, shots: 0, passes: 0, tackles: 0, rating: '', yellowCard: false, redCard: false, isMotm: false, notes: '' }),
          isMotm: checked
        };
        return newMap;
      });

      // 2. Database Synchronization
      const promises = [];
      const currentStat = statsMap[playerId] || {};

      // If checking a new player, uncheck the old one in DB
      if (checked && currentMotmPlayerId && currentMotmPlayerId !== playerId) {
        const oldStatId = statsMap[currentMotmPlayerId]?.id;
        const oldNotes = statsMap[currentMotmPlayerId]?.notes || '';
        if (oldStatId) {
          promises.push(pb.collection('player_stats').update(oldStatId, { notes: oldNotes }, { $autoCancel: false }));
        }
      }

      const notesToSave = (checked ? 'MOTM ' : '') + (currentStat.notes || '');

      // Update or create the new record
      if (checked) {
        if (currentStat.id) {
          promises.push(pb.collection('player_stats').update(currentStat.id, { notes: notesToSave.trim() }, { $autoCancel: false }));
        } else {
          // If no stat row exists yet, create it immediately to save MOTM status
          const newRecord = await pb.collection('player_stats').create({
            matchId,
            playerId,
            notes: notesToSave.trim(),
            goals: currentStat.goals || 0,
            assists: currentStat.assists || 0,
            shots: currentStat.shots || 0,
            passes: currentStat.passes || 0,
            tackles: currentStat.tackles || 0,
            yellowCards: currentStat.yellowCard ? 1 : 0,
            redCards: currentStat.redCard ? 1 : 0,
          }, { $autoCancel: false });
          
          // Sync ID locally
          setStatsMap(prev => ({
            ...prev,
            [playerId]: { ...prev[playerId], id: newRecord.id, isMotm: true }
          }));
        }
        toast.success('Homme du match défini avec succès');
      } else {
        // If unchecking
        if (currentStat.id) {
          promises.push(pb.collection('player_stats').update(currentStat.id, { notes: notesToSave.trim() }, { $autoCancel: false }));
          toast.success('Homme du match retiré');
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Error saving MOTM:', error);
      toast.error('Erreur lors de la sauvegarde de l\'homme du match');
    }
  };

  const incrementStat = (playerId, field) => {
    const current = statsMap[playerId]?.[field] || 0;
    handleStatChange(playerId, field, current + 1);
  };

  const decrementStat = (playerId, field) => {
    const current = statsMap[playerId]?.[field] || 0;
    if (current > 0) {
      handleStatChange(playerId, field, current - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = players.map(async (player) => {
        const stat = statsMap[player.id] || {};
        
        const hasData = 
          stat.rating !== '' || 
          stat.goals > 0 || 
          stat.assists > 0 || 
          stat.shots > 0 ||
          stat.passes > 0 ||
          stat.tackles > 0 ||
          stat.yellowCard || 
          stat.redCard || 
          (stat.notes && stat.notes.trim() !== '') ||
          stat.isMotm;

        // If no data and it doesn't exist in DB, skip it
        if (!hasData && !stat.id) return null;

        const combinedNotes = ((stat.isMotm ? 'MOTM ' : '') + (stat.notes || '')).trim();

        const data = {
          matchId,
          playerId: player.id,
          rating: stat.rating !== '' ? parseFloat(stat.rating) : null,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          shots: stat.shots || 0,
          passes: stat.passes || 0,
          tackles: stat.tackles || 0,
          yellowCards: stat.yellowCard ? 1 : 0,
          redCards: stat.redCard ? 1 : 0,
          notes: combinedNotes
        };

        if (stat.id) {
          return pb.collection('player_stats').update(stat.id, data, { $autoCancel: false });
        } else {
          const newRecord = await pb.collection('player_stats').create(data, { $autoCancel: false });
          // Update local state with the new ID
          setStatsMap(prev => ({
            ...prev,
            [player.id]: { ...prev[player.id], id: newRecord.id }
          }));
          return newRecord;
        }
      });

      await Promise.all(promises.filter(Boolean));
      toast.success('Toutes les statistiques ont été enregistrées avec succès');
    } catch (error) {
      console.error('Error saving stats:', error);
      toast.error('Erreur lors de l\'enregistrement des statistiques');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-8" id="match-stats-section">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-6 scroll-mt-24" id="match-stats-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Statistiques de l'Effectif
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Saisissez les performances individuelles des joueurs pour ce match</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all">
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer les statistiques'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {players.map(player => {
          const stat = statsMap[player.id] || { goals: 0, assists: 0, shots: 0, passes: 0, tackles: 0, rating: '', yellowCard: false, redCard: false, isMotm: false, notes: '' };

          return (
            <Card key={player.id} className={`bg-card border-border overflow-hidden transition-all duration-200 ${stat.isMotm ? 'ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/10' : 'hover:shadow-md'}`}>
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${stat.isMotm ? 'bg-yellow-500 text-yellow-950' : 'bg-primary text-primary-foreground'}`}>
                      {player.number}
                    </div>
                    <div>
                      <CardTitle className="text-base">{player.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{player.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label 
                      htmlFor={`motm-${player.id}`} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all border select-none ${
                        stat.isMotm 
                          ? 'bg-yellow-500/10 border-yellow-500/50' 
                          : 'bg-muted/50 border-transparent hover:border-border hover:bg-muted'
                      }`}
                    >
                      <Checkbox 
                        id={`motm-${player.id}`} 
                        checked={stat.isMotm}
                        onCheckedChange={(checked) => handleMotmChange(player.id, checked)}
                        className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 data-[state=checked]:text-yellow-950"
                      />
                      <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${stat.isMotm ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground'}`}>
                        <Trophy className={`w-3.5 h-3.5 ${stat.isMotm ? 'text-yellow-600 dark:text-yellow-500' : ''}`} /> 
                        MOTM
                      </span>
                    </label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Note (0-10)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="10" 
                    step="0.1"
                    value={stat.rating}
                    onChange={(e) => handleStatChange(player.id, 'rating', e.target.value)}
                    className="w-full text-center font-bold bg-background text-foreground"
                    placeholder="-"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 bg-background p-2.5 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium mb-1 text-foreground">
                      <span>⚽</span> Buts
                    </div>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-lg" onClick={() => decrementStat(player.id, 'goals')}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-bold text-base w-6 text-center text-foreground">{stat.goals}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-lg" onClick={() => incrementStat(player.id, 'goals')}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 bg-background p-2.5 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium mb-1 text-foreground">
                      <span>🎯</span> Passes D.
                    </div>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-lg" onClick={() => decrementStat(player.id, 'assists')}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-bold text-base w-6 text-center text-foreground">{stat.assists}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-lg" onClick={() => incrementStat(player.id, 'assists')}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2 bg-background p-2 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium mb-1 text-muted-foreground uppercase tracking-wider">
                      <Target className="w-3 h-3" /> Tirs
                    </div>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="icon" className="h-5 w-5 rounded-md" onClick={() => decrementStat(player.id, 'shots')}>
                        <Minus className="w-2.5 h-2.5" />
                      </Button>
                      <span className="font-bold text-sm w-5 text-center text-foreground">{stat.shots}</span>
                      <Button variant="outline" size="icon" className="h-5 w-5 rounded-md" onClick={() => incrementStat(player.id, 'shots')}>
                        <Plus className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 bg-background p-2 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium mb-1 text-muted-foreground uppercase tracking-wider">
                      <ArrowRightLeft className="w-3 h-3" /> Passes
                    </div>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="icon" className="h-5 w-5 rounded-md" onClick={() => decrementStat(player.id, 'passes')}>
                        <Minus className="w-2.5 h-2.5" />
                      </Button>
                      <span className="font-bold text-sm w-5 text-center text-foreground">{stat.passes}</span>
                      <Button variant="outline" size="icon" className="h-5 w-5 rounded-md" onClick={() => incrementStat(player.id, 'passes')}>
                        <Plus className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 bg-background p-2 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium mb-1 text-muted-foreground uppercase tracking-wider">
                      <Shield className="w-3 h-3" /> Tacles
                    </div>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="icon" className="h-5 w-5 rounded-md" onClick={() => decrementStat(player.id, 'tackles')}>
                        <Minus className="w-2.5 h-2.5" />
                      </Button>
                      <span className="font-bold text-sm w-5 text-center text-foreground">{stat.tackles}</span>
                      <Button variant="outline" size="icon" className="h-5 w-5 rounded-md" onClick={() => incrementStat(player.id, 'tackles')}>
                        <Plus className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="flex items-center justify-center">
                    <label htmlFor={`yellow-${player.id}`} className="flex items-center gap-2 cursor-pointer w-full justify-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox 
                        id={`yellow-${player.id}`} 
                        checked={stat.yellowCard}
                        onCheckedChange={(checked) => handleStatChange(player.id, 'yellowCard', checked)}
                        className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                      />
                      <span className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                        <span>🟨</span> Jaune
                      </span>
                    </label>
                  </div>
                  <div className="flex items-center justify-center">
                    <label htmlFor={`red-${player.id}`} className="flex items-center gap-2 cursor-pointer w-full justify-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox 
                        id={`red-${player.id}`} 
                        checked={stat.redCard}
                        onCheckedChange={(checked) => handleStatChange(player.id, 'redCard', checked)}
                        className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />
                      <span className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                        <span>🟥</span> Rouge
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes complémentaires</Label>
                  <Input 
                    value={stat.notes}
                    onChange={(e) => handleStatChange(player.id, 'notes', e.target.value)}
                    className="w-full bg-background text-foreground text-sm"
                    placeholder="Blessure, remplacement..."
                  />
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MatchPlayerStats;
