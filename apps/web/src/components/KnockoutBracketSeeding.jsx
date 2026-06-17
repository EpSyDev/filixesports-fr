
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';

const KnockoutBracketSeeding = ({
  qualifiedTeams
}) => {
  return (
    <Card className="bg-card border-border shadow-sm max-w-2xl mx-auto mt-8">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">
          <Network className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl tracking-tight">Génération de l'arbre final</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6 pt-4">
        <p className="text-muted-foreground leading-relaxed max-w-[65ch] mx-auto">
          Vous avez sélectionné <strong className="text-foreground">{qualifiedTeams.length}</strong> équipes pour la phase finale.
          L'arbre sera généré automatiquement lorsque vous verrouillerez les sélections.
        </p>
        
        <div className="flex justify-center gap-2 flex-wrap">
          {qualifiedTeams.map(t => (
            <Badge key={t.id} variant="secondary" className="px-3 py-1 font-medium transition-colors hover:bg-secondary/80">
              {t.teamName}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default KnockoutBracketSeeding;
