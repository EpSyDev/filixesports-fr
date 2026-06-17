
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ClubBadge from './ClubBadge';

const KnockoutQualificationZone = ({
  availableTeams,
  onRemoveTeam,
  disabled,
  onLock,
  onUnlock
}) => {
  const [locked, setLocked] = useState(disabled);

  useEffect(() => {
    setLocked(disabled);
  }, [disabled]);

  const handleToggleLock = () => {
    if (locked) {
      setLocked(false);
      if (onUnlock) onUnlock();
    } else {
      if (availableTeams.length < 2) {
        toast.error("Il faut au moins 2 équipes pour générer l'arbre.");
        return;
      }
      setLocked(true);
      if (onLock) onLock(availableTeams);
    }
  };

  return (
    <Card className="h-full border-border bg-muted/20">
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Sélectionnés
            <Badge variant="outline" className={cn(availableTeams.length >= 2 && "border-emerald-500/30 text-emerald-600")}>
              {availableTeams.length} équipe{availableTeams.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <div className="inline-block">
            <Button 
              variant={locked ? "secondary" : "default"} 
              size="sm" 
              onClick={handleToggleLock}
              className="gap-2 transition-all"
            >
              {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {locked ? "Déverrouiller" : "Verrouiller & Générer"}
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          {locked 
            ? "Les sélections sont verrouillées. L'arbre final est généré." 
            : "Sélectionnez les équipes qualifiées dans les poules puis verrouillez pour générer l'arbre."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 max-h-[600px] overflow-y-auto space-y-2 custom-scrollbar">
        {locked && (
          <div className="bg-primary/10 text-primary-foreground px-3 py-2 rounded-lg text-xs flex items-center gap-2 mb-3 font-medium">
            <Lock className="w-3 h-3 shrink-0" />
            <span>Sélections figées pour l'arbre final</span>
          </div>
        )}
        
        {availableTeams.map(team => (
          <div
            key={team.id}
            className={cn(
              "bg-card border shadow-sm p-3 rounded-lg flex items-center justify-between group",
              !locked 
                ? "hover:border-primary transition-all border-emerald-500/20 bg-green-100/10 dark:bg-emerald-950/20" 
                : "opacity-80"
            )}
          >
            <div className="flex items-center gap-3 truncate">
              <div className="flex flex-col">
                <ClubBadge teamName={team.teamName} className="font-medium text-sm truncate" />
                <span className="text-xs text-muted-foreground mt-0.5">Poule {team.poolId}</span>
              </div>
            </div>
            {!locked && onRemoveTeam && (
              <button
                onClick={() => onRemoveTeam(team)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"
                title="Retirer la sélection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {availableTeams.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm opacity-60">
            {locked 
              ? "Les équipes sont placées." 
              : "Aucune équipe sélectionnée dans les poules."}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KnockoutQualificationZone;
