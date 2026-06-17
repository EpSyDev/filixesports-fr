
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

const PlayerCard = ({ player, stats }) => {
  const photoUrl = player.photo || null;

  return (
    <Card className="bg-card border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
      <CardContent className="p-0">
        <div className="aspect-square relative overflow-hidden rounded-t-xl bg-muted">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={player.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-24 h-24 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl shadow-md">
            {player.number}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-sm sm:text-lg mb-1 truncate">{player.name}</h3>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded bg-primary text-primary-foreground">
              {player.position}
            </span>
            {player.secondaryPosition && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-secondary text-secondary-foreground">
                {player.secondaryPosition}
              </span>
            )}
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border/50">
              <div>
                <div className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{stats.totalGoals}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide font-semibold">Buts</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-foreground group-hover:text-accent transition-colors">{stats.totalAssists}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide font-semibold">Passes</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-foreground group-hover:text-muted-foreground transition-colors">{stats.totalMatches}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide font-semibold">Matchs</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
