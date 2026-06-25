
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const MatchCard = ({ match }) => {
  const matchDate = new Date(match.date);
  const isPlayed = match.status === 'played';
  const homeScore = match.homeScore ?? '-';
  const awayScore = match.awayScore ?? '-';

  const getResultBadge = () => {
    if (!isPlayed || match.homeScore === null || match.awayScore === null) {
      return <Badge variant="secondary">À venir</Badge>;
    }
    if (match.homeScore > match.awayScore) {
      return <Badge className="bg-green-600 text-white">Victoire</Badge>;
    }
    if (match.homeScore < match.awayScore) {
      return <Badge variant="destructive">Défaite</Badge>;
    }
    return <Badge variant="outline">Nul</Badge>;
  };

  return (
    <Card className="bg-card border-primary/15 hover:border-primary/40 hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="font-stat">{format(matchDate, 'dd/MM/yyyy')}</span>
          </div>
          {getResultBadge()}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">KOTIYA FC</div>
            <div className="font-stat text-5xl font-extrabold text-foreground">{homeScore}</div>
          </div>
          <div className="px-4 font-stat text-2xl font-bold text-muted-foreground">:</div>
          <div className="flex-1 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 truncate">{match.opponent}</div>
            <div className="font-stat text-5xl font-extrabold text-foreground/70">{awayScore}</div>
          </div>
        </div>

        {match.expand?.competition && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{match.expand.competition.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchCard;
