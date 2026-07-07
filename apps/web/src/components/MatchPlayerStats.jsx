
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import supabase from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Minus, Plus, Save, Trophy, Target, ArrowRightLeft, Shield, Hand } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const GK_POSITION = 'GB';

const EMPTY_STAT = {
  rating: '', isMotm: false, notes: '',
  // joueurs de champ
  goals: 0, assists: 0, shots: 0, passes: 0, tackles: 0,
  offsides: 0, balls_recovered: 0, balls_lost: 0,
  pass_accuracy: '', shot_accuracy: '',
  // gardiens
  shots_faced: 0, shots_on_target_faced: 0, saves: 0,
  goals_conceded: 0, penalties_saved: 0, penalty_goals_conceded: 0,
};

// Champs (steppers) pour joueurs de champ
const OUTFIELD_COUNTERS = [
  { field: 'goals', label: '⚽ Buts' },
  { field: 'assists', label: '🎯 Passes D.' },
];
const OUTFIELD_TRIO = [
  { field: 'shots', icon: <Target className="w-3 h-3" />, label: 'Tirs' },
  { field: 'passes', icon: <ArrowRightLeft className="w-3 h-3" />, label: 'Passes' },
  { field: 'tackles', icon: <Shield className="w-3 h-3" />, label: 'Tacles' },
];
const OUTFIELD_TRIO_2 = [
  { field: 'offsides', label: 'Hors-jeu' },
  { field: 'balls_recovered', label: 'Ballons réc.' },
  { field: 'balls_lost', label: 'Ballons perdus' },
];

// Champs (steppers) pour gardiens
const GK_COUNTERS = [
  { field: 'shots_faced', label: '🥅 Tirs subis' },
  { field: 'shots_on_target_faced', label: '🎯 Tirs cadrés' },
  { field: 'saves', label: '🧤 Arrêts' },
  { field: 'goals_conceded', label: '❌ Buts encaissés' },
  { field: 'penalties_saved', label: '🛑 Pénos arrêtés' },
  { field: 'penalty_goals_conceded', label: '⚠️ Buts encaissés (péno)' },
];

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
        const [playersRes, statsRes] = await Promise.all([
          supabase.from('players').select('*').order('number', { ascending: true }),
          supabase.from('player_stats').select('*').eq('matchId', matchId)
        ]);
        if (playersRes.error) throw playersRes.error;
        if (statsRes.error) throw statsRes.error;

        setPlayers(playersRes.data);

        const map = {};
        statsRes.data.forEach(r => {
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
            offsides: r.offsides || 0,
            balls_recovered: r.balls_recovered || 0,
            balls_lost: r.balls_lost || 0,
            pass_accuracy: r.pass_accuracy ?? '',
            shot_accuracy: r.shot_accuracy ?? '',
            shots_faced: r.shots_faced || 0,
            shots_on_target_faced: r.shots_on_target_faced || 0,
            saves: r.saves || 0,
            goals_conceded: r.goals_conceded || 0,
            penalties_saved: r.penalties_saved || 0,
            penalty_goals_conceded: r.penalty_goals_conceded || 0,
            isMotm,
            notes: plainNotes
          };
        });
        setStatsMap(map);
      } catch (err) {
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
      [playerId]: { ...EMPTY_STAT, ...(prev[playerId] || {}), [field]: value }
    }));
  };

  const handleMotmChange = async (playerId, checked) => {
    try {
      const currentMotmPlayerId = Object.keys(statsMap).find(key => statsMap[key]?.isMotm);

      setStatsMap(prev => {
        const newMap = { ...prev };
        if (checked) Object.keys(newMap).forEach(key => { if (newMap[key]) newMap[key] = { ...newMap[key], isMotm: false }; });
        newMap[playerId] = { ...EMPTY_STAT, ...(newMap[playerId] || {}), isMotm: checked };
        return newMap;
      });

      const currentStat = statsMap[playerId] || {};
      const promises = [];

      if (checked && currentMotmPlayerId && currentMotmPlayerId !== playerId) {
        const oldStat = statsMap[currentMotmPlayerId];
        if (oldStat?.id) {
          promises.push(supabase.from('player_stats').update({ notes: oldStat.notes || '' }).eq('id', oldStat.id));
        }
      }

      const notesToSave = ((checked ? 'MOTM ' : '') + (currentStat.notes || '')).trim();

      if (checked) {
        if (currentStat.id) {
          promises.push(supabase.from('player_stats').update({ notes: notesToSave }).eq('id', currentStat.id));
        } else {
          const { data: newRecord, error } = await supabase.from('player_stats').insert({
            matchId, playerId, notes: notesToSave
          }).select().single();
          if (error) throw error;
          setStatsMap(prev => ({ ...prev, [playerId]: { ...prev[playerId], id: newRecord.id, isMotm: true } }));
        }
        toast.success('Homme du match défini avec succès');
      } else {
        if (currentStat.id) {
          promises.push(supabase.from('player_stats').update({ notes: notesToSave }).eq('id', currentStat.id));
          toast.success('Homme du match retiré');
        }
      }

      if (promises.length > 0) await Promise.all(promises);
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde de l\'homme du match');
    }
  };

  const incrementStat = (playerId, field) => handleStatChange(playerId, field, (statsMap[playerId]?.[field] || 0) + 1);
  const decrementStat = (playerId, field) => {
    const current = statsMap[playerId]?.[field] || 0;
    if (current > 0) handleStatChange(playerId, field, current - 1);
  };

  const buildPayload = (player, stat) => {
    const combinedNotes = ((stat.isMotm ? 'MOTM ' : '') + (stat.notes || '')).trim();
    const isGk = player.position === GK_POSITION;
    return {
      matchId, playerId: player.id,
      rating: stat.rating !== '' ? parseFloat(stat.rating) : null,
      notes: combinedNotes,
      // joueurs de champ
      goals: isGk ? 0 : (stat.goals || 0),
      assists: isGk ? 0 : (stat.assists || 0),
      shots: isGk ? 0 : (stat.shots || 0),
      passes: isGk ? 0 : (stat.passes || 0),
      tackles: isGk ? 0 : (stat.tackles || 0),
      offsides: isGk ? 0 : (stat.offsides || 0),
      balls_recovered: isGk ? 0 : (stat.balls_recovered || 0),
      balls_lost: isGk ? 0 : (stat.balls_lost || 0),
      pass_accuracy: !isGk && stat.pass_accuracy !== '' ? parseInt(stat.pass_accuracy, 10) : null,
      shot_accuracy: !isGk && stat.shot_accuracy !== '' ? parseInt(stat.shot_accuracy, 10) : null,
      // gardiens
      shots_faced: isGk ? (stat.shots_faced || 0) : 0,
      shots_on_target_faced: isGk ? (stat.shots_on_target_faced || 0) : 0,
      saves: isGk ? (stat.saves || 0) : 0,
      goals_conceded: isGk ? (stat.goals_conceded || 0) : 0,
      penalties_saved: isGk ? (stat.penalties_saved || 0) : 0,
      penalty_goals_conceded: isGk ? (stat.penalty_goals_conceded || 0) : 0,
    };
  };

  const hasAnyData = (stat, isGk) => {
    if (stat.rating !== '' || stat.isMotm || stat.notes?.trim()) return true;
    if (isGk) {
      return stat.shots_faced > 0 || stat.shots_on_target_faced > 0 || stat.saves > 0 ||
        stat.goals_conceded > 0 || stat.penalties_saved > 0 || stat.penalty_goals_conceded > 0;
    }
    return stat.goals > 0 || stat.assists > 0 || stat.shots > 0 || stat.passes > 0 || stat.tackles > 0 ||
      stat.offsides > 0 || stat.balls_recovered > 0 || stat.balls_lost > 0 ||
      stat.pass_accuracy !== '' || stat.shot_accuracy !== '';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = players.map(async (player) => {
        const stat = { ...EMPTY_STAT, ...(statsMap[player.id] || {}) };
        const isGk = player.position === GK_POSITION;
        if (!hasAnyData(stat, isGk) && !stat.id) return null;

        const data = buildPayload(player, stat);

        if (stat.id) {
          return supabase.from('player_stats').update(data).eq('id', stat.id);
        } else {
          const { data: newRecord, error } = await supabase.from('player_stats').insert(data).select().single();
          if (error) throw error;
          setStatsMap(prev => ({ ...prev, [player.id]: { ...prev[player.id], id: newRecord.id } }));
          return newRecord;
        }
      });
      await Promise.all(promises.filter(Boolean));
      toast.success('Toutes les statistiques ont été enregistrées avec succès');
    } catch (err) {
      toast.error(`Erreur lors de l'enregistrement des statistiques : ${err.message || 'erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-8" id="match-stats-section">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // ── Sous-composants de saisie ─────────────────────────────────────────────
  const Stepper = ({ playerId, field, size = 'md' }) => {
    const small = size === 'sm';
    return (
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" className={small ? 'h-5 w-5 rounded-md' : 'h-6 w-6 rounded-lg'} onClick={() => decrementStat(playerId, field)}>
          <Minus className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        </Button>
        <span className={`font-bold text-center text-foreground ${small ? 'text-sm w-5' : 'text-base w-6'}`}>{statsMap[playerId]?.[field] ?? 0}</span>
        <Button variant="outline" size="icon" className={small ? 'h-5 w-5 rounded-md' : 'h-6 w-6 rounded-lg'} onClick={() => incrementStat(playerId, field)}>
          <Plus className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        </Button>
      </div>
    );
  };

  const PlayerHeader = ({ player, stat, isGk }) => (
    <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${stat.isMotm ? 'bg-yellow-500 text-yellow-950' : isGk ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground'}`}>
            {player.number}
          </div>
          <div>
            <CardTitle className="text-base flex items-center gap-1.5">
              {isGk && <Hand className="w-3.5 h-3.5 text-emerald-500" />}{player.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{player.position}</p>
          </div>
        </div>
        <label htmlFor={`motm-${player.id}`} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all border select-none ${stat.isMotm ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-muted/50 border-transparent hover:border-border hover:bg-muted'}`}>
          <Checkbox id={`motm-${player.id}`} checked={stat.isMotm} onCheckedChange={(checked) => handleMotmChange(player.id, checked)} className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 data-[state=checked]:text-yellow-950" />
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${stat.isMotm ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground'}`}>
            <Trophy className={`w-3.5 h-3.5 ${stat.isMotm ? 'text-yellow-600 dark:text-yellow-500' : ''}`} /> MOTM
          </span>
        </label>
      </div>
    </CardHeader>
  );

  const RatingAndNotes = ({ player, stat }) => (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Note (0-10)</Label>
        <Input type="number" min="0" max="10" step="0.1" value={stat.rating} onChange={(e) => handleStatChange(player.id, 'rating', e.target.value)} className="w-full text-center font-bold bg-background text-foreground" placeholder="-" />
      </div>
      <div className="space-y-1.5 pt-2 border-t border-border/50">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes complémentaires</Label>
        <Input value={stat.notes} onChange={(e) => handleStatChange(player.id, 'notes', e.target.value)} className="w-full bg-background text-foreground text-sm" placeholder="Blessure, remplacement..." />
      </div>
    </>
  );

  const gkPlayers = players.filter(p => p.position === GK_POSITION);
  const outfieldPlayers = players.filter(p => p.position !== GK_POSITION);

  return (
    <div className="mt-12 space-y-8 scroll-mt-24" id="match-stats-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">Statistiques de l'Effectif</h2>
          <p className="text-sm text-muted-foreground mt-1">Saisissez les performances individuelles des joueurs pour ce match</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all">
          <Save className="w-5 h-5" />
          {saving ? 'Enregistrement...' : 'Enregistrer les statistiques'}
        </Button>
      </div>

      {/* ── Gardiens ──────────────────────────────────────────────────────── */}
      {gkPlayers.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
            <Hand className="w-4 h-4" /> Gardiens de but
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {gkPlayers.map(player => {
              const stat = { ...EMPTY_STAT, ...(statsMap[player.id] || {}) };
              return (
                <Card key={player.id} className={`bg-card overflow-hidden transition-all duration-200 ${stat.isMotm ? 'ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/10' : 'border-emerald-500/30 hover:shadow-md'}`}>
                  <PlayerHeader player={player} stat={stat} isGk />
                  <CardContent className="p-4 space-y-4">
                    <RatingAndNotes player={player} stat={stat} />
                    <div className="grid grid-cols-2 gap-3">
                      {GK_COUNTERS.map(({ field, label }) => (
                        <div key={field} className="space-y-2 bg-background p-2.5 rounded-xl border border-border/50 shadow-sm">
                          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium mb-1 text-foreground text-center leading-tight">{label}</div>
                          <Stepper playerId={player.id} field={field} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Joueurs de champ ──────────────────────────────────────────────── */}
      {outfieldPlayers.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <Shield className="w-4 h-4" /> Joueurs de champ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {outfieldPlayers.map(player => {
              const stat = { ...EMPTY_STAT, ...(statsMap[player.id] || {}) };
              return (
                <Card key={player.id} className={`bg-card border-border overflow-hidden transition-all duration-200 ${stat.isMotm ? 'ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/10' : 'hover:shadow-md'}`}>
                  <PlayerHeader player={player} stat={stat} isGk={false} />
                  <CardContent className="p-4 space-y-4">
                    <RatingAndNotes player={player} stat={stat} />
                    <div className="grid grid-cols-2 gap-3">
                      {OUTFIELD_COUNTERS.map(({ field, label }) => (
                        <div key={field} className="space-y-2 bg-background p-2.5 rounded-xl border border-border/50 shadow-sm">
                          <div className="flex items-center justify-center gap-2 text-xs font-medium mb-1 text-foreground">{label}</div>
                          <Stepper playerId={player.id} field={field} />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {OUTFIELD_TRIO.map(({ field, icon, label }) => (
                        <div key={field} className="space-y-2 bg-background p-2 rounded-xl border border-border/50 shadow-sm">
                          <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium mb-1 text-muted-foreground uppercase tracking-wider">{icon} {label}</div>
                          <Stepper playerId={player.id} field={field} size="sm" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {OUTFIELD_TRIO_2.map(({ field, label }) => (
                        <div key={field} className="space-y-2 bg-background p-2 rounded-xl border border-border/50 shadow-sm">
                          <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium mb-1 text-muted-foreground uppercase tracking-wider text-center leading-tight">{label}</div>
                          <Stepper playerId={player.id} field={field} size="sm" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { field: 'pass_accuracy', label: 'Préc. passes %' },
                        { field: 'shot_accuracy', label: 'Préc. tirs %' },
                      ].map(({ field, label }) => (
                        <div key={field} className="space-y-1.5 bg-background p-2.5 rounded-xl border border-border/50 shadow-sm">
                          <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center block">{label}</Label>
                          <Input type="number" min="0" max="100" value={stat[field]} onChange={(e) => handleStatChange(player.id, field, e.target.value)} className="w-full text-center font-bold bg-background text-foreground h-8" placeholder="-" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default MatchPlayerStats;
