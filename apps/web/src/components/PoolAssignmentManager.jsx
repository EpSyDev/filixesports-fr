
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, RotateCcw, Lock } from 'lucide-react';
import ClubBadge from './ClubBadge';

const POOL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const generateInitialPools = (numPools) =>
  Array.from({ length: numPools }, (_, i) => ({
    id: i + 1,
    name: `Poule ${POOL_LETTERS[i] ?? i + 1}`,
    teams: []
  }));

const PoolAssignmentManager = ({ teams, onAssignmentsChange, qualifiedTeams, setQualifiedTeams, isLocked = false }) => {
  const numPools = Math.floor(teams.length / 4);

  const [availableTeams, setAvailableTeams] = useState([]);
  const [pools, setPools] = useState(() => generateInitialPools(numPools));

  // Si le nombre d'équipes change (reset), on réinitialise les poules
  useEffect(() => {
    setPools(generateInitialPools(numPools));
    setAvailableTeams(teams);
  }, [numPools]);

  useEffect(() => {
    const assignedTeamIds = new Set(pools.flatMap(p => p.teams.map(t => t.id)));
    setAvailableTeams(teams.filter(t => !assignedTeamIds.has(t.id)));
  }, [teams]);

  useEffect(() => {
    onAssignmentsChange(pools);
  }, [pools, onAssignmentsChange]);

  const handleDragStart = (e, team, sourcePoolId = null) => {
    if (isLocked) return;
    e.dataTransfer.setData('teamId', team.id);
    e.dataTransfer.setData('sourcePoolId', sourcePoolId || '');
  };

  const handleDragOver = (e) => {
    if (isLocked) return;
    e.preventDefault();
  };

  const handleDropToPool = (e, targetPoolId) => {
    if (isLocked) return;
    e.preventDefault();
    const teamId = e.dataTransfer.getData('teamId');
    const sourcePoolId = e.dataTransfer.getData('sourcePoolId');

    const targetPool = pools.find(p => p.id === targetPoolId);
    if (targetPool.teams.length >= 4 && sourcePoolId !== String(targetPoolId)) return;

    let teamToMove;
    if (sourcePoolId) {
      const sourcePool = pools.find(p => p.id === parseInt(sourcePoolId));
      teamToMove = sourcePool.teams.find(t => t.id === teamId);
      if (!teamToMove) return;

      setPools(prev => prev.map(p => {
        if (p.id === parseInt(sourcePoolId)) return { ...p, teams: p.teams.filter(t => t.id !== teamId) };
        if (p.id === targetPoolId) return { ...p, teams: [...p.teams, teamToMove] };
        return p;
      }));
    } else {
      teamToMove = availableTeams.find(t => t.id === teamId);
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
  };

  const clearAll = () => {
    if (isLocked) return;
    setPools(generateInitialPools(numPools));
    setAvailableTeams(teams);
  };

  const assignedCount = pools.reduce((acc, p) => acc + p.teams.length, 0);
  const progress = teams.length > 0 ? (assignedCount / teams.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl flex items-center gap-3 border border-destructive/20">
          <Lock className="w-5 h-5" />
          <p className="text-sm font-medium">Les sélections sont verrouillées. Vous ne pouvez pas modifier la répartition des poules.</p>
        </div>
      )}

      <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="space-y-1 flex-1 max-w-md">
          <div className="flex justify-between text-sm font-medium">
            <span>Progression de la répartition</span>
            <span>{assignedCount} / {teams.length} équipes — {numPools} poule{numPools > 1 ? 's' : ''} de 4</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <Button
          variant="outline"
          onClick={clearAll}
          disabled={isLocked}
          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <RotateCcw className="w-4 h-4" /> Réinitialiser
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pools.map(pool => (
            <Card
              key={pool.id}
              className={`border-2 transition-colors ${pool.teams.length === 4 ? 'border-primary/50 bg-primary/5' : 'border-dashed border-border bg-card'} ${isLocked ? 'opacity-90' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropToPool(e, pool.id)}
            >
              <CardHeader className="py-3 px-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                <CardTitle className="text-base">{pool.name}</CardTitle>
                <Badge variant={pool.teams.length === 4 ? 'default' : 'secondary'}>
                  {pool.teams.length}/4
                </Badge>
              </CardHeader>
              <CardContent className="p-3 min-h-[180px] space-y-2">
                {pool.teams.map(team => (
                  <div
                    key={team.id}
                    draggable={!isLocked}
                    onDragStart={(e) => handleDragStart(e, team, pool.id)}
                    className={`flex items-center justify-between bg-background border shadow-sm p-2 rounded-md transition-colors ${!isLocked ? 'cursor-grab active:cursor-grabbing hover:border-primary/50' : 'cursor-default'}`}
                  >
                    <ClubBadge teamName={team.teamName} className="text-sm" />
                    {!isLocked && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeTeamFromPool(team, pool.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {pool.teams.length === 0 && (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground opacity-50 pt-8">
                    {isLocked ? 'Poule vide' : 'Glissez une équipe ici'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-4">
          <Card
            className={`h-full border-border bg-muted/10 ${isLocked ? 'opacity-90' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDropToAvailable}
          >
            <CardHeader className="py-4 border-b bg-card">
              <CardTitle className="text-lg flex justify-between items-center">
                Équipes disponibles
                <Badge variant="outline">{availableTeams.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-[600px] overflow-y-auto space-y-2 custom-scrollbar">
              {availableTeams.map(team => (
                <div
                  key={team.id}
                  draggable={!isLocked}
                  onDragStart={(e) => handleDragStart(e, team)}
                  className={`bg-card border shadow-sm p-3 rounded-lg transition-colors flex items-center gap-2 ${!isLocked ? 'cursor-grab active:cursor-grabbing hover:border-primary' : 'cursor-default'}`}
                >
                  {!isLocked && <div className="w-2 h-8 bg-muted rounded-full cursor-grab shrink-0" />}
                  <ClubBadge teamName={team.teamName} />
                </div>
              ))}
              {availableTeams.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
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
