
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

const PlayerCard = ({ player, stats }) => {
  const photoUrl = player.image || player.photo || null;
  const backUrl = player.imageBack || null;

  return (
    <Card className="group relative overflow-hidden bg-card border-primary/15 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1.5">
      <CardContent className="p-4 md:p-5">
        {/* Numéro de maillot, signature dorée */}
        <span
          aria-hidden="true"
          className="font-stat pointer-events-none absolute top-1 right-2 z-10 select-none text-4xl sm:text-5xl md:text-7xl font-extrabold text-primary leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] group-hover:scale-110 transition-transform origin-top-right"
        >
          {player.number}
        </span>

        {/* Photo hexagonale */}
        <div className="relative mx-auto w-full max-w-[200px] aspect-square">
          <div className="hex-clip w-full h-full overflow-hidden bg-muted ring-1 ring-primary/20">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={player.name}
                loading="lazy"
                className={cn(
                  'w-full h-full object-cover object-top transition-opacity duration-300',
                  backUrl && 'group-hover:opacity-0'
                )}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-20 h-20 text-muted-foreground/30" />
              </div>
            )}
            {backUrl && (
              <img
                src={backUrl}
                alt={`${player.name} (dos)`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:animate-card-bounce-in"
              />
            )}
          </div>
        </div>

        <div className="mt-4 text-center">
          <h3 className="font-display uppercase text-xl sm:text-2xl text-foreground truncate">{player.name}</h3>

          <div className="flex items-center justify-center gap-2 mt-2 mb-4">
            <span className="inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded bg-primary text-primary-foreground">
              {player.position}
            </span>
            {player.secondaryPosition && (
              <span className="inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded border border-primary/30 text-primary">
                {player.secondaryPosition}
              </span>
            )}
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-primary/10">
            <div>
              <div className="font-stat text-2xl md:text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">{stats.totalGoals}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Buts</div>
            </div>
            <div>
              <div className="font-stat text-2xl md:text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">{stats.totalAssists}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Passes</div>
            </div>
            <div>
              <div className="font-stat text-2xl md:text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">{stats.totalMatches}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Matchs</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
