
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import ClubBadge from './ClubBadge';

const InlineMatchScoreInput = ({ match, onSave, onDelete }) => {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync state if match prop changes externally
  useEffect(() => {
    setHomeScore(match.homeScore !== null && match.homeScore !== undefined ? String(match.homeScore) : '');
    setAwayScore(match.awayScore !== null && match.awayScore !== undefined ? String(match.awayScore) : '');
  }, [match]);

  const handleBlur = async (e) => {
    // Si le focus reste dans la zone de saisie (passage d'un champ à l'autre),
    // on ne sauvegarde pas encore : on attend que les deux scores soient saisis.
    if (e?.currentTarget?.parentNode?.contains(e.relatedTarget)) {
      return;
    }

    const originalHome = match.homeScore !== null && match.homeScore !== undefined ? String(match.homeScore) : '';
    const originalAway = match.awayScore !== null && match.awayScore !== undefined ? String(match.awayScore) : '';

    // Only save if values actually changed
    if (homeScore === originalHome && awayScore === originalAway) {
      return;
    }

    // Un seul score renseigné = saisie incomplète : on ne sauvegarde pas
    // (sinon le match repasse en "scheduled" et le champ saisi serait effacé).
    const oneFilled = (homeScore !== '') !== (awayScore !== '');
    if (oneFilled) {
      return;
    }

    setIsSaving(true);
    setShowSuccess(false);
    
    try {
      await onSave(match.id, homeScore, awayScore);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (error) {
      // Error is handled by parent or sonner toast, but we reset saving state
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(match.id);
    } catch (error) {
      // Error handling is managed by the parent via toast
    } finally {
      setIsDeleting(false);
    }
  };

  const isPlayed = match.status === 'played';

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-xl transition-all shadow-sm relative overflow-hidden ${isPlayed ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 border-border/60 hover:bg-muted/40 hover:border-border'}`}>
      {isPlayed && <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
      <div className="flex-1 w-full sm:w-auto font-medium text-foreground truncate flex items-center">
        <ClubBadge teamName={match.homeTeam} className="truncate" />
        <span className="text-muted-foreground text-xs font-normal mx-3 shrink-0">vs</span>
        <ClubBadge teamName={match.awayTeam} className="truncate text-right sm:text-left" />
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        <div className={`flex items-center gap-2 h-10 px-2 rounded-lg border shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all ${isPlayed ? 'bg-primary/10 border-primary/40' : 'bg-background'}`}>
          <Input
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            onBlur={handleBlur}
            disabled={isSaving || isDeleting}
            className="w-10 h-8 text-center px-1 py-0 border-0 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 bg-transparent font-semibold text-foreground"
            placeholder="-"
          />
          <span className="font-bold text-muted-foreground/40">-</span>
          <Input
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            onBlur={handleBlur}
            disabled={isSaving || isDeleting}
            className="w-10 h-8 text-center px-1 py-0 border-0 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 bg-transparent font-semibold text-foreground"
            placeholder="-"
          />
        </div>
        
        <div className="flex items-center justify-center w-24 shrink-0 text-sm">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-muted-foreground animate-in fade-in">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs">Sauvegarde...</span>
            </span>
          ) : showSuccess ? (
            <span className="flex items-center gap-1 text-primary animate-in zoom-in fade-in slide-in-from-bottom-1 duration-300">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Enregistré</span>
            </span>
          ) : isPlayed ? (
            <span className="flex items-center gap-1 text-primary text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Joué
            </span>
          ) : (
            <span className="text-muted-foreground/40 select-none text-xs">À jouer</span>
          )}
        </div>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg ml-1"
          onClick={handleDelete}
          disabled={isSaving || isDeleting}
          title="Supprimer le match"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default InlineMatchScoreInput;
