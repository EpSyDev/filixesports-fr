
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, CheckCircle2 } from 'lucide-react';

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

  const handleBlur = async () => {
    const originalHome = match.homeScore !== null && match.homeScore !== undefined ? String(match.homeScore) : '';
    const originalAway = match.awayScore !== null && match.awayScore !== undefined ? String(match.awayScore) : '';

    // Only save if values actually changed
    if (homeScore === originalHome && awayScore === originalAway) {
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

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/20 border border-border/60 rounded-xl hover:bg-muted/40 hover:border-border transition-all shadow-sm relative overflow-hidden">
      <div className="flex-1 w-full sm:w-auto font-medium text-foreground truncate flex items-center">
        <span className="truncate" title={match.homeTeam}>{match.homeTeam}</span>
        <span className="text-muted-foreground text-xs font-normal mx-3 shrink-0">vs</span>
        <span className="truncate text-right sm:text-left" title={match.awayTeam}>{match.awayTeam}</span>
      </div>
      
      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        <div className="flex items-center gap-2 h-10 px-2 rounded-lg bg-background border shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
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
          ) : (
            <span className="text-muted-foreground/0 select-none text-xs">Prêt</span>
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
