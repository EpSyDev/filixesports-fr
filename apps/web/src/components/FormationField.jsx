
import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Coordonnées pour l'équipe gauche (GK à gauche, attaquants vers le centre)
const FORMATIONS = {
  '3-5-2': [
    { id: 'GK',   label: 'GK',  top: '50%', left: '5%'  },
    { id: 'DCG',  label: 'DCG', top: '20%', left: '20%' },
    { id: 'DC',   label: 'DC',  top: '50%', left: '18%' },
    { id: 'DCD',  label: 'DCD', top: '80%', left: '20%' },
    { id: 'MG',   label: 'MG',  top: '10%', left: '33%' },
    { id: 'MDC',  label: 'MDC', top: '37%', left: '30%' },
    { id: 'MOC',  label: 'MOC', top: '50%', left: '38%' },
    { id: 'MDC2', label: 'MDC', top: '63%', left: '30%' },
    { id: 'MD',   label: 'MD',  top: '90%', left: '33%' },
    { id: 'ATG',  label: 'ATG', top: '32%', left: '45%' },
    { id: 'ATD',  label: 'ATD', top: '68%', left: '45%' },
  ],
  '4-3-3': [
    { id: 'GK',   label: 'GK',  top: '50%', left: '5%'  },
    { id: 'DG',   label: 'DG',  top: '12%', left: '18%' },
    { id: 'DCG',  label: 'DCG', top: '37%', left: '20%' },
    { id: 'DCD',  label: 'DCD', top: '63%', left: '20%' },
    { id: 'DD',   label: 'DD',  top: '88%', left: '18%' },
    { id: 'MG',   label: 'MG',  top: '22%', left: '33%' },
    { id: 'MC',   label: 'MC',  top: '50%', left: '33%' },
    { id: 'MD',   label: 'MD',  top: '78%', left: '33%' },
    { id: 'ATG',  label: 'ATG', top: '15%', left: '45%' },
    { id: 'AT',   label: 'AT',  top: '50%', left: '45%' },
    { id: 'ATD',  label: 'ATD', top: '85%', left: '45%' },
  ],
  '3-1-4-2': [
    { id: 'GK',   label: 'GK',  top: '50%', left: '5%'  },
    { id: 'DCG',  label: 'DCG', top: '20%', left: '20%' },
    { id: 'DC',   label: 'DC',  top: '50%', left: '18%' },
    { id: 'DCD',  label: 'DCD', top: '80%', left: '20%' },
    { id: 'MDC',  label: 'MDC', top: '50%', left: '28%' },
    { id: 'MG',   label: 'MG',  top: '12%', left: '37%' },
    { id: 'MC',   label: 'MC',  top: '37%', left: '37%' },
    { id: 'MC2',  label: 'MC',  top: '63%', left: '37%' },
    { id: 'MD',   label: 'MD',  top: '88%', left: '37%' },
    { id: 'ATG',  label: 'ATG', top: '32%', left: '45%' },
    { id: 'ATD',  label: 'ATD', top: '68%', left: '45%' },
  ],
  '3-4-3': [
    { id: 'GK',   label: 'GK',  top: '50%', left: '5%'  },
    { id: 'DCG',  label: 'DCG', top: '20%', left: '20%' },
    { id: 'DC',   label: 'DC',  top: '50%', left: '18%' },
    { id: 'DCD',  label: 'DCD', top: '80%', left: '20%' },
    { id: 'MG',   label: 'MG',  top: '12%', left: '33%' },
    { id: 'MDC',  label: 'MDC', top: '38%', left: '31%' },
    { id: 'MOC',  label: 'MOC', top: '62%', left: '31%' },
    { id: 'MD',   label: 'MD',  top: '88%', left: '33%' },
    { id: 'ATG',  label: 'ATG', top: '15%', left: '45%' },
    { id: 'AT',   label: 'AT',  top: '50%', left: '45%' },
    { id: 'ATD',  label: 'ATD', top: '85%', left: '45%' },
  ],
};

export const TACTIC_OPTIONS = ['3-5-2', '4-3-3', '3-1-4-2', '3-4-3'];

const PlayerSlot = ({ position, player, onDrop, onDragOver, onDragLeave, onRemove, isActive, isReadOnly, isOpponent }) => {
  return (
    <div
      className={cn(
        "player-slot group z-10",
        isActive && !isReadOnly ? "slot-target-active" : "slot-target-inactive",
        player ? "bg-black/60 border-primary ring-0" : "",
        isOpponent ? "border-red-400/30 hover:border-red-400/60" : "",
        isReadOnly ? "cursor-default" : ""
      )}
      style={{ top: position.top, left: position.left }}
      onDragOver={!isReadOnly ? (e) => onDragOver(e, position.id) : undefined}
      onDragLeave={!isReadOnly ? onDragLeave : undefined}
      onDrop={!isReadOnly ? (e) => onDrop(e, position.id) : undefined}
    >
      {player ? (
        <div className="relative flex flex-col items-center justify-center w-full h-full">
          {!isReadOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(position.id); }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 md:p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 shadow-md min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <X className="w-4 h-4 md:w-3 md:h-3" />
            </button>
          )}
          <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full border-2 border-primary bg-muted overflow-hidden mb-0.5 shadow-sm">
            {player.photo ? (
              <img src={player.photo} alt={player.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300">
                <User className="w-3 h-3 md:w-4 md:h-4" />
              </div>
            )}
          </div>
          <div className="bg-black/80 text-white text-[8px] sm:text-[9px] md:text-[10px] font-bold px-1 py-0.5 rounded max-w-full truncate shadow-sm">
            {player.name.split(' ').pop()}
          </div>
          <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 bg-primary text-primary-foreground text-[8px] md:text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
            {player.number}
          </div>
        </div>
      ) : (
        <span className={cn("font-bold text-[9px] md:text-[10px] tracking-wider", isOpponent ? "text-red-300/60" : "text-white/60")}>
          {position.label}
        </span>
      )}
    </div>
  );
};

const FormationField = ({ composition, onPlayerDrop, onPlayerRemove, isReadOnly, tactic = '3-5-2', opponentTactic = '4-3-3' }) => {
  const [activeSlot, setActiveSlot] = useState(null);

  const positions = FORMATIONS[tactic] || FORMATIONS['3-5-2'];

  // Équipe adverse : miroir horizontal (left = 100 - left)
  const opponentPositions = (FORMATIONS[opponentTactic] || FORMATIONS['4-3-3']).map(pos => ({
    ...pos,
    id: `opp_${pos.id}`,
    left: `${100 - parseFloat(pos.left)}%`,
  }));

  const handleDragOver = (e, positionId) => {
    if (isReadOnly) return;
    e.preventDefault();
    setActiveSlot(positionId);
  };

  const handleDragLeave = () => {
    if (isReadOnly) return;
    setActiveSlot(null);
  };

  const handleDrop = (e, positionId) => {
    if (isReadOnly) return;
    e.preventDefault();
    setActiveSlot(null);
    const playerData = e.dataTransfer.getData('application/json');
    if (playerData) {
      try {
        const player = JSON.parse(playerData);
        onPlayerDrop(positionId, player);
      } catch (err) {
        console.error("Failed to parse player data on drop", err);
      }
    }
  };

  return (
    <div className="football-pitch">
      <div className="pitch-line pitch-center-line z-0" />
      <div className="pitch-line pitch-center-circle z-0" />
      <div className="pitch-line pitch-penalty-top z-0" />
      <div className="pitch-line pitch-penalty-bottom z-0" />

      {/* Notre équipe */}
      {positions.map((pos) => (
        <PlayerSlot
          key={pos.id}
          position={pos}
          player={composition[pos.id]}
          isActive={activeSlot === pos.id}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onRemove={onPlayerRemove}
          isReadOnly={isReadOnly}
          isOpponent={false}
        />
      ))}

      {/* Équipe adverse (squelette miroir, lecture seule) */}
      {opponentPositions.map((pos) => (
        <PlayerSlot
          key={pos.id}
          position={pos}
          player={null}
          isActive={false}
          onDragOver={() => {}}
          onDragLeave={() => {}}
          onDrop={() => {}}
          onRemove={() => {}}
          isReadOnly
          isOpponent
        />
      ))}
    </div>
  );
};

export default FormationField;
