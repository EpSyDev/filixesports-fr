
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

const TrophyCard = ({ trophy }) => {
  const imageUrl = trophy.image || null;

  return (
    <Card className="bg-card border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="aspect-square relative overflow-hidden rounded-t-xl bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={trophy.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy className="w-24 h-24 text-primary" />
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="text-3xl font-bold text-primary mb-2">{trophy.year}</div>
          <h3 className="font-bold text-lg mb-2">{trophy.name}</h3>
          {trophy.competition && (
            <p className="text-sm text-muted-foreground mb-2">{trophy.competition}</p>
          )}
          {trophy.description && (
            <p className="text-sm text-muted-foreground">{trophy.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrophyCard;
