
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Save, X } from 'lucide-react';

const MatchResultForm = ({ match, onSave, onCancel, compact = false }) => {
  const [formData, setFormData] = useState({
    homeScore: '',
    awayScore: '',
    status: 'scheduled',
    date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (match) {
      setFormData({
        homeScore: match.homeScore !== null && match.homeScore !== undefined ? match.homeScore : '',
        awayScore: match.awayScore !== null && match.awayScore !== undefined ? match.awayScore : '',
        status: match.status || 'scheduled',
        date: match.date ? match.date.split('T')[0] : ''
      });
    }
  }, [match]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...match,
        homeScore: formData.homeScore !== '' ? Number(formData.homeScore) : null,
        awayScore: formData.awayScore !== '' ? Number(formData.awayScore) : null,
        status: formData.status,
        // Include date if the backend schema supports it, otherwise omit or pass it
        date: formData.date ? new Date(formData.date).toISOString() : null
      };
      
      await onSave(dataToSave);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <Card className="border-border shadow-sm bg-background">
        <CardContent className="p-2.5">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1.5 rounded-md border">
              <span className="font-semibold flex-1 text-right text-xs truncate" title={match.homeTeam}>{match.homeTeam}</span>
              <Input
                type="number" min="0"
                value={formData.homeScore}
                onChange={(e) => setFormData({ ...formData, homeScore: e.target.value })}
                className="w-10 h-7 text-center font-bold text-sm px-1"
                placeholder="-"
              />
              <span className="text-muted-foreground text-[10px] font-medium">VS</span>
              <Input
                type="number" min="0"
                value={formData.awayScore}
                onChange={(e) => setFormData({ ...formData, awayScore: e.target.value })}
                className="w-10 h-7 text-center font-bold text-sm px-1"
                placeholder="-"
              />
              <span className="font-semibold flex-1 text-left text-xs truncate" title={match.awayTeam}>{match.awayTeam}</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="h-7 text-xs px-2"
              />
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="h-7 text-xs px-2">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Planifié</SelectItem>
                  <SelectItem value="played">Joué</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-1 border-t border-border/40">
              <Button type="submit" disabled={isSubmitting} size="sm" className="h-7 text-xs gap-1 px-3">
                <Save className="w-3 h-3" /> Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm bg-background">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex-1 w-full flex items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
              <span className="font-bold flex-1 text-right truncate" title={match.homeTeam}>{match.homeTeam}</span>
              <Input
                type="number"
                min="0"
                value={formData.homeScore}
                onChange={(e) => setFormData({ ...formData, homeScore: e.target.value })}
                className="w-16 text-center font-bold text-lg min-h-[44px]"
                placeholder="-"
              />
              <span className="text-muted-foreground font-medium px-2">VS</span>
              <Input
                type="number"
                min="0"
                value={formData.awayScore}
                onChange={(e) => setFormData({ ...formData, awayScore: e.target.value })}
                className="w-16 text-center font-bold text-lg min-h-[44px]"
                placeholder="-"
              />
              <span className="font-bold flex-1 text-left truncate" title={match.awayTeam}>{match.awayTeam}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="min-h-[44px]"
            />
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Planifié</SelectItem>
                <SelectItem value="played">Joué</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border/50">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="min-h-[44px] gap-2">
                <X className="w-4 h-4" /> Annuler
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="min-h-[44px] gap-2">
              <Save className="w-4 h-4" /> Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MatchResultForm;
