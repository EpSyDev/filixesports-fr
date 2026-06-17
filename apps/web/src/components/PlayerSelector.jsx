
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const PlayerSelector = ({ players, availablePlayerIds, onDragStart, selectedPlayer, onPlayerSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = players.filter(player => {
    if (!availablePlayerIds.includes(player.id)) return false;
    const term = searchTerm.toLowerCase();
    
    return player.name.toLowerCase().includes(term) || 
           player.number.toString().includes(term) ||
           player.position.toLowerCase().includes(term) ||
           (player.secondaryPosition && player.secondaryPosition.toLowerCase().includes(term));
  });

  return (
    <Card className="flex flex-col h-full bg-card shadow-lg border-border overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-bold text-lg mb-3">Joueurs disponibles</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par nom, numéro, poste..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background min-h-[44px]"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Aucun joueur disponible trouvé.</p>
          </div>
        ) : (
          filteredPlayers.map(player => (
            <div
              key={player.id}
              draggable
              onDragStart={(e) => onDragStart(e, player)}
              onClick={() => onPlayerSelect?.(player)}
              className={cn(
                "draggable-player flex items-center p-3 gap-3 bg-background border rounded-xl shadow-sm hover:border-primary/50 cursor-grab active:cursor-grabbing",
                selectedPlayer?.id === player.id ? "border-primary bg-primary/10 ring-1 ring-primary/40" : ""
              )}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-border">
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm md:text-base truncate">{player.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded leading-none">
                    {player.position}
                  </span>
                  {player.secondaryPosition && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded leading-none">
                      {player.secondaryPosition}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm md:text-base shrink-0 shadow-sm">
                {player.number}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default PlayerSelector;
