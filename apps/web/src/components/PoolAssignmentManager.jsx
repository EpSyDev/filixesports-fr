
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, RotateCcw, Lock, MousePointerClick } from 'lucide-react';
import ClubBadge from './ClubBadge';
import { cn } from '@/lib/utils';

const POOL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const generateInitialPools = (numPools) =>
  Array.from({ length: numPools }, (_, i) => ({
    id: i + 1,
    name: `Poule ${POOL_LETTERS[i] ?? i + 1}`,
    teams: []
  }));

const PoolAssignmentManager = ({ teams, onAssignmentsChange, isLocked = false }) => {
  const numPools = Math.floor(teams.length / 4);

  const [availableTeams, setAvailableTeams] = useState([]);
  const [pools, setPools] = useState(() => generateInitialPools(numPools));
  // team sélectionnée en attente de placement : { id, teamName, sourcePoolId: number|null }
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    setPools(generateInitialPools(numPools));
    setAvailableTeams(teams);
    setSelectedTeam(null);
  }, [numPools]);

  useEffect(() => {
    const assignedIds = new Set(pools.flatMap(p => p.teams.map(t => t.id)));
    setAvailableTeams(teams.filter(t => !assignedIds.has(t.id)));
  }, [teams]);

  useEffect(() => {
    onAssignmentsChange(pools);
  }, [pools, onAssignmentsChange]);

  // ── SÉLECTION par clic ──────────────────────────────────────────────────────

  const handleTeamClick = (team, sourcePoolId = null) => {
    if (isLocked) return;
    setSelectedTeam(prev =>
      prev?.id === team.id ? null : { ...team, sourcePoolId }
    );
  };

  const handlePoolClick = (targetPoolId) => {
    if (isLocked || !selectedTeam) return;
    const targetPool = pools.find(p => p.id === targetPoolId);

    // Clic sur la poule source → désélectionner
    if (selectedTeam.sourcePoolId === targetPoolId) {
      setSelectedTeam(null);
      return;
    }
    // Poule pleine (pas de déplacement intra-poule)
    if (targetPool.teams.length >= 4) return;

    if (selectedTeam.sourcePoolId !== null) {
      // Déplacer d'une poule vers une autre
      setPools(prev => prev.map(p => {
        if (p.id === selectedTeam.sourcePoolId) return { ...p, teams: p.teams.filter(t => t.id !== selectedTeam.id) };
        if (p.id === targetPoolId) return { ...p, teams: [...p.teams, { id: selectedTeam.id, teamName: selectedTeam.teamName }] };
        return p;
      }));
    } else {
      // Depuis la liste disponible vers une poule
      setAvailableTeams(prev => prev.filter(t => t.id !== selectedTeam.id));
      setPools(prev => prev.map(p =>
        p.id === targetPoolId
          ? { ...p, teams: [...p.teams, { id: selectedTeam.id, teamName: selectedTeam.teamName }] }
          : p
      ));
    }
    setSelectedTeam(null);
  };

  const handleAvailableAreaClick = () => {
    if (isLocked || !selectedTeam || selectedTeam.sourcePoolId === null) return;
    // Retirer d'une poule vers la liste disponible
    setPools(prev => prev.map(p =>
      p.id === selectedTeam.sourcePoolId
        ? { ...p, teams: p.teams.filter(t => t.id !== selectedTeam.id) }
        : p
    ));
    setAvailableTeams(prev => [...prev, { id: selectedTeam.id, teamName: selectedTeam.teamName }]);
    setSelectedTeam(null);
  };

  // ── DRAG & DROP (desktop) ───────────────────────────────────────────────────

  const handleDragStart = (e, team, sourcePoolId = null) => {
    if (isLocked) return;
    e.dataTransfer.setData('teamId', team.id);
    e.dataTransfer.setData('sourcePoolId', sourcePoolId ?? '');
    setSelectedTeam(null);
  };

  const handleDragOver = (e) => { if (!isLocked) e.preventDefault(); };

  const handleDropToPool = (e, targetPoolId) => {
    if (isLocked) return;
    e.preventDefault();
    const teamId = e.dataTransfer.getData('teamId');
    const sourcePoolId = e.dataTransfer.getData('sourcePoolId');
    const targetPool = pools.find(p => p.id === targetPoolId);
    if (targetPool.teams.length >= 4 && sourcePoolId !== String(targetPoolId)) return;

    if (sourcePoolId) {
      const sourcePool = pools.find(p => p.id === parseInt(sourcePoolId));
      const teamToMove = sourcePool.teams.find(t => t.id === teamId);
      if (!teamToMove) return;
      setPools(prev => prev.map(p => {
        if (p.id === parseInt(sourcePoolId)) return { ...p, teams: p.teams.filter(t => t.id !== teamId) };
        if (p.id === targetPoolId) return { ...p, teams: [...p.teams, teamToMove] };
        return p;
      }));
    } else {
      const teamToMove = availableTeams.find(t => t.id === teamId);
      if (!teamToMove) return;
      setAvailableTeams(prev => prev.filter(t => t.id !== teamId));
      setPools(prev => prev.map(p => p.id === targetPoolId ? { ...p, teams: [...p.teams, teamToMove] } : p));
    }
  };

  const handleDropToAvailable = (e) => {
    if (isLocked) return;
    e.preventDefault();
    const teamId = e.dataTransfer.getData('teamId');
    const sourcePoolId = e.dataTransfer.getData('sourcePoolId');
    if (!sourcePoolId) return;
    const sourcePool = pools.find(p => p.id === parseInt(sourcePoolId));
    const teamToMove = sourcePool.teams.find(t => t.id === teamId);
    if (teamToMove) {
      setPools(prev => prev.map(p => p.id === parseInt(sourcePoolId) ? { ...p, teams: p.teams.filter(t => t.id !== teamId) } : p));
      setAvailableTeams(prev => [...prev, teamToMove]);
    }
  };

  const removeTeamFromPool = (team, poolId) => {
    if (isLocked) return;
    setPools(prev => prev.map(p => p.id === poolId ? { ...p, teams: p.teams.filter(t => t.id !== team.id) } : p));
    setAvailableTeams(prev => [...prev, team]);
    if (selectedTeam?.id === team.id) setSelectedTeam(null);
  };

  const clearAll = () => {
    if (isLocked) return;
    setPools(generateInitialPools(numPools));
    setAvailableTeams(teams);
    setSelectedTeam(null);
  };

  const assignedCount = pools.reduce((acc, p) => acc + p.teams.length, 0);
  const progress = teams.length > 0 ? (assignedCount / teams.length) * 100 : 0;
  const hasSelection = !!selectedTeam;

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl flex items-center gap-3 border border-destructive/20">
          <Lock className="w-5 h-5" />
          <p className="text-sm font-medium">Les sélections sont verrouillées. Vous ne pouvez pas modifier la répartition des poules.</p>
        </div>
      )}

      {/* Barre de progression */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm gap-4">
        <div className="space-y-1 flex-1 max-w-md">
          <div className="flex justify-between text-sm font-medium">
            <span>Progression</span>
            <span>{assignedCount} / {teams.length} équipes — {numPools} poule{numPools > 1 ? 's' : ''} de 4</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <Button
          variant="outline"
          onClick={clearAll}
          disabled={isLocked}
          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
        >
          <RotateCcw className="w-4 h-4" /> Réinitialiser
        </Button>
      </div>

      {/* Indication contextuelle si une équipe est sélectionnée */}
      {hasSelection && (
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 px-4 py-3 rounded-xl text-sm font-medium text-primary animate-in fade-in slide-in-from-top-1 duration-200">
          <MousePointerClick className="w-4 h-4 shrink-0" />
          <span>
            <strong>{selectedTeam.teamName}</strong> sélectionnée —
            {selectedTeam.sourcePoolId !== null
              ? ' cliquez sur une poule pour la déplacer, ou sur "Disponibles" pour la retirer'
              : ' cliquez sur une poule pour la placer'}
          </span>
          <button
            onClick={() => setSelectedTeam(null)}
            className="ml-auto text-primary/60 hover:text-primary"
            aria-label="Annuler la sélection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grille des poules */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pools.map(pool => {
            const isFull = pool.teams.length >= 4;
            const isTargetable = hasSelection && !isFull;

            return (
              <Card
                key={pool.id}
                onClick={() => handlePoolClick(pool.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropToPool(e, pool.id)}
                className={cn(
                  'border-2 transition-all duration-150',
                  isFull ? 'border-primary/50 bg-primary/5' : 'border-dashed border-border bg-card',
                  isTargetable && 'border-primary cursor-pointer ring-2 ring-primary/20 shadow-md',
                  hasSelection && isFull && 'opacity-60',
                  isLocked && 'opacity-90 cursor-default',
                  !isLocked && !hasSelection && 'cursor-default'
                )}
              >
                <CardHeader className="py-3 px-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{pool.name}</CardTitle>
                  <Badge variant={isFull ? 'default' : 'secondary'}>{pool.teams.length}/4</Badge>
                </CardHeader>
                <CardContent className="p-3 min-h-[160px] space-y-2">
                  {pool.teams.map(team => {
                    const isThisSelected = selectedTeam?.id === team.id;
                    return (
                      <div
                        key={team.id}
                        draggable={!isLocked}
                        onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, team, pool.id); }}
                        onClick={(e) => { e.stopPropagation(); handleTeamClick(team, pool.id); }}
                        className={cn(
                          'flex items-center justify-between bg-background border shadow-sm p-2 rounded-md transition-all',
                          !isLocked && 'cursor-pointer hover:border-primary/50',
                          isThisSelected && 'border-primary bg-primary/10 ring-2 ring-primary/30 scale-[1.02]'
                        )}
                      >
                        <ClubBadge teamName={team.teamName} className="text-sm" />
                        {!isLocked && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={(e) => { e.stopPropagation(); removeTeamFromPool(team, pool.id); }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {pool.teams.length === 0 && (
                    <div className={cn(
                      'h-full flex items-center justify-center text-sm text-muted-foreground pt-8',
                      isTargetable ? 'text-primary font-medium' : 'opacity-50'
                    )}>
                      {isLocked ? 'Poule vide' : isTargetable ? '→ Placer ici' : 'Glissez ou cliquez'}
                    </div>
                  )}

                  {/* Indicateur "placer ici" quand poule non vide et targetable */}
                  {isTargetable && pool.teams.length > 0 && pool.teams.length < 4 && (
                    <div className="border border-dashed border-primary/40 rounded-md p-2 text-center text-xs text-primary/70">
                      + Placer ici
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Liste des équipes disponibles */}
        <div className="lg:col-span-4">
          <Card
            onClick={handleAvailableAreaClick}
            onDragOver={handleDragOver}
            onDrop={handleDropToAvailable}
            className={cn(
              'h-full border-border bg-muted/10 transition-all duration-150',
              hasSelection && selectedTeam?.sourcePoolId !== null && 'border-primary/40 cursor-pointer ring-1 ring-primary/20',
              isLocked && 'opacity-90'
            )}
          >
            <CardHeader className="py-4 border-b bg-card">
              <CardTitle className="text-lg flex justify-between items-center">
                Équipes disponibles
                <Badge variant="outline">{availableTeams.length}</Badge>
              </CardTitle>
              {hasSelection && selectedTeam?.sourcePoolId !== null && (
                <p className="text-xs text-primary mt-1">Cliquez ici pour retirer de la poule</p>
              )}
            </CardHeader>
            <CardContent className="p-4 max-h-[500px] overflow-y-auto space-y-2 custom-scrollbar">
              {availableTeams.map(team => {
                const isThisSelected = selectedTeam?.id === team.id;
                return (
                  <div
                    key={team.id}
                    draggable={!isLocked}
                    onDragStart={(e) => handleDragStart(e, team)}
                    onClick={(e) => { e.stopPropagation(); handleTeamClick(team, null); }}
                    className={cn(
                      'bg-card border shadow-sm p-3 rounded-lg transition-all flex items-center gap-2',
                      !isLocked && 'cursor-pointer hover:border-primary',
                      isThisSelected && 'border-primary bg-primary/10 ring-2 ring-primary/30 scale-[1.01]'
                    )}
                  >
                    {!isLocked && !isThisSelected && (
                      <div className="w-2 h-8 bg-muted rounded-full shrink-0" />
                    )}
                    {isThisSelected && (
                      <MousePointerClick className="w-4 h-4 text-primary shrink-0" />
                    )}
                    <ClubBadge teamName={team.teamName} />
                  </div>
                );
              })}
              {availableTeams.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Toutes les équipes sont assignées !
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PoolAssignmentManager;
