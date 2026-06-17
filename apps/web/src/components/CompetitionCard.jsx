
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

const CompetitionCard = ({ competition }) => {
  const getStatusBadge = () => {
    switch (competition.status) {
      case 'ongoing':
        return <Badge className="bg-green-600 text-white">En cours</Badge>;
      case 'completed':
        return <Badge variant="secondary">Terminée</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-card border-border hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{competition.name}</CardTitle>
          {getStatusBadge()}
        </div>
        {competition.season && (
          <p className="text-sm text-muted-foreground">Saison {competition.season}</p>
        )}
      </CardHeader>
      <CardContent>
        {competition.description && (
          <p className="text-sm text-muted-foreground mb-4">{competition.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {competition.startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(competition.startDate), 'dd/MM/yyyy')}</span>
            </div>
          )}
          {competition.endDate && (
            <>
              <span>-</span>
              <span>{format(new Date(competition.endDate), 'dd/MM/yyyy')}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitionCard;
