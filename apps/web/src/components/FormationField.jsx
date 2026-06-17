
import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Layout configuration for 3-5-2 with aligned MDCs
const PITCH_POSITIONS = [
  { id: 'ATG', label: 'ATG', bottom: '85%', left: '35%' },
  { id: 'ATD', label: 'ATD', bottom: '85%', left: '65%' },
  { id: 'MOC', label: 'MOC', bottom: '70%', left: '50%' },
  { id: 'MG', label: 'MG', bottom: '50%', left: '15%' },
  { id: 'MDC', label: 'MDC', bottom: '35%', left: '40%' },   // Left MDC
  { id: 'MDC2', label: 'MDC', bottom: '35%', left: '60%' },  // Right MDC
  { id: 'MD', label: 'MD', bottom: '50%', left: '85%' },
  { id: 'DCG', label: 'DCG', bottom: '20%', left: '25%' },
  { id: 'DC', label: 'DC', bottom: '15%', left: '50%' },
  { id: 'DCD', label: 'DCD', bottom: '20%', left: '75%' },
  { id: 'GK', label: 'GK', bottom: '5%', left: '50%' },
];

const PlayerSlot = ({ 
  position, 
  player, 
  onDrop, 
  onDragOver, 
  onDragLeave, 
  onRemove,
  isActive,
  isReadOnly
}) => {
  return (
    <div 
      className={cn(
        "player-slot group z-10",
        isActive && !isReadOnly ? "slot-target-active" : "slot-target-inactive",
        player ? "bg-black/60 border-primary ring-0" : "",
        isReadOnly ? "cursor-default hover:border-white/30 hover:bg-black/20" : ""
      )}
      style={{ bottom: position.bottom, left: position.left }}
      onDragOver={!isReadOnly ? (e) => onDragOver(e, position.id) : undefined}
      onDragLeave={!isReadOnly ? onDragLeave : undefined}
      onDrop={!isReadOnly ? (e) => onDrop(e, position.id) : undefined}
    >
      {player ? (
        <div className="relative flex flex-col items-center justify-center w-full h-full">
          {!isReadOnly && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemove(position.id);
              }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 md:p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 shadow-md min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Remove player"
            >
              <X className="w-4 h-4 md:w-3 md:h-3" />
            </button>
          )}
          
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 border-primary bg-muted overflow-hidden mb-1 shadow-sm">
            {player.photo ? (
              <img 
                src={player.photo} 
                alt={player.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300">
                <User className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            )}
          </div>
          <div className="bg-black/80 text-white text-[9px] sm:text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded max-w-full truncate shadow-sm">
            {player.name.split(' ').pop()}
          </div>
          <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 bg-primary text-primary-foreground text-[9px] md:text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-md">
            {player.number}
          </div>
        </div>
      ) : (
        <span className="text-white/60 font-bold text-xs md:text-sm tracking-wider">
          {position.label}
        </span>
      )}
    </div>
  );
};

const FormationField = ({ composition, onPlayerDrop, onPlayerRemove, isReadOnly }) => {
  const [activeSlot, setActiveSlot] = useState(null);

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
      {/* Pitch Lines */}
      <div className="pitch-line pitch-center-line z-0" />
      <div className="pitch-line pitch-center-circle z-0" />
      <div className="pitch-line pitch-penalty-top z-0" />
      <div className="pitch-line pitch-penalty-bottom z-0" />
      
      {/* Player Slots */}
      {PITCH_POSITIONS.map((pos) => (
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
        />
      ))}
    </div>
  );
};

export default FormationField;
