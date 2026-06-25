
import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Coordonnées verticales : gardien en haut (top faible), attaquants en bas (top élevé).
// left = écartement latéral. Les IDs sont conservés pour recharger les formations sauvegardées.
const FORMATIONS = {
  '3-5-2': [
    { id: 'GK',   label: 'GK',  top: '7%',  left: '50%' },
    { id: 'DCG',  label: 'DCG', top: '25%', left: '22%' },
    { id: 'DC',   label: 'DC',  top: '22%', left: '50%' },
    { id: 'DCD',  label: 'DCD', top: '25%', left: '78%' },
    { id: 'MG',   label: 'MG',  top: '50%', left: '10%' },
    { id: 'MDC',  label: 'MDC', top: '45%', left: '35%' },
    { id: 'MOC',  label: 'MOC', top: '62%', left: '50%' },
    { id: 'MDC2', label: 'MDC', top: '45%', left: '65%' },
    { id: 'MD',   label: 'MD',  top: '50%', left: '90%' },
    { id: 'ATG',  label: 'ATG', top: '82%', left: '35%' },
    { id: 'ATD',  label: 'ATD', top: '82%', left: '65%' },
  ],
  '4-3-3': [
    { id: 'GK',   label: 'GK',  top: '7%',  left: '50%' },
    { id: 'DG',   label: 'DG',  top: '26%', left: '12%' },
    { id: 'DCG',  label: 'DCG', top: '23%', left: '38%' },
    { id: 'DCD',  label: 'DCD', top: '23%', left: '62%' },
    { id: 'DD',   label: 'DD',  top: '26%', left: '88%' },
    { id: 'MG',   label: 'MG',  top: '52%', left: '25%' },
    { id: 'MC',   label: 'MC',  top: '49%', left: '50%' },
    { id: 'MD',   label: 'MD',  top: '52%', left: '75%' },
    { id: 'ATG',  label: 'ATG', top: '80%', left: '18%' },
    { id: 'AT',   label: 'AT',  top: '83%', left: '50%' },
    { id: 'ATD',  label: 'ATD', top: '80%', left: '82%' },
  ],
  '3-1-4-2': [
    { id: 'GK',   label: 'GK',  top: '7%',  left: '50%' },
    { id: 'DCG',  label: 'DCG', top: '24%', left: '22%' },
    { id: 'DC',   label: 'DC',  top: '21%', left: '50%' },
    { id: 'DCD',  label: 'DCD', top: '24%', left: '78%' },
    { id: 'MDC',  label: 'MDC', top: '40%', left: '50%' },
    { id: 'MG',   label: 'MG',  top: '58%', left: '12%' },
    { id: 'MC',   label: 'MC',  top: '56%', left: '38%' },
    { id: 'MC2',  label: 'MC',  top: '56%', left: '62%' },
    { id: 'MD',   label: 'MD',  top: '58%', left: '88%' },
    { id: 'ATG',  label: 'ATG', top: '83%', left: '35%' },
    { id: 'ATD',  label: 'ATD', top: '83%', left: '65%' },
  ],
  '3-4-3': [
    { id: 'GK',   label: 'GK',  top: '7%',  left: '50%' },
    { id: 'DCG',  label: 'DCG', top: '24%', left: '22%' },
    { id: 'DC',   label: 'DC',  top: '21%', left: '50%' },
    { id: 'DCD',  label: 'DCD', top: '24%', left: '78%' },
    { id: 'MG',   label: 'MG',  top: '48%', left: '12%' },
    { id: 'MDC',  label: 'MDC', top: '45%', left: '38%' },
    { id: 'MOC',  label: 'MOC', top: '45%', left: '62%' },
    { id: 'MD',   label: 'MD',  top: '48%', left: '88%' },
    { id: 'ATG',  label: 'ATG', top: '80%', left: '18%' },
    { id: 'AT',   label: 'AT',  top: '83%', left: '50%' },
    { id: 'ATD',  label: 'ATD', top: '80%', left: '82%' },
  ],
};

export const TACTIC_OPTIONS = ['3-5-2', '4-3-3', '3-1-4-2', '3-4-3'];

const playerPhoto = (player) => player?.image || player?.photo || null;

const PlayerSlot = ({ position, player, onDrop, onDragOver, onDragLeave, onRemove, isActive, isReadOnly, onSlotOpen }) => {
  const photo = playerPhoto(player);
  const depthStyle = { transform: `scale(${position.scale ?? 1})` };
  return (
    <div
      className={cn(
        "player-slot group z-10",
        player ? "is-filled" : (isActive && !isReadOnly ? "slot-target-active" : "slot-target-inactive"),
        isReadOnly ? "cursor-default" : (!player ? "cursor-pointer" : ""),
      )}
      style={{ top: position.top, left: position.left }}
      onDragOver={!isReadOnly ? (e) => onDragOver(e, position.id) : undefined}
      onDragLeave={!isReadOnly ? onDragLeave : undefined}
      onDrop={!isReadOnly ? (e) => onDrop(e, position.id) : undefined}
      onClick={!isReadOnly && !player ? () => onSlotOpen?.(position.id) : undefined}
    >
      {player ? (
        <div className="relative flex flex-col items-center justify-center w-full" style={depthStyle}>
          {!isReadOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(position.id); }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 md:p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 shadow-md min-h-[28px] min-w-[28px] flex items-center justify-center"
            >
              <X className="w-4 h-4 md:w-3 md:h-3" />
            </button>
          )}
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 border-white/90 bg-muted overflow-hidden shadow-lg ring-2 ring-black/30">
            {photo ? (
              <img src={photo} alt={player.name} loading="lazy" className="w-full h-full object-cover object-top scale-[1.6] origin-top" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300">
                <User className="w-5 h-5 md:w-7 md:h-7" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[9px] md:text-[11px] font-extrabold w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-md ring-1 ring-black/30">
              {player.number}
            </div>
          </div>
          <div className="mt-1 text-white text-[9px] sm:text-[11px] md:text-xs font-extrabold uppercase tracking-wide text-center leading-tight max-w-[80px] md:max-w-[110px] truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {player.name.split(' ').pop()}
          </div>
        </div>
      ) : (
        <span className="font-bold text-[9px] md:text-[10px] tracking-wider text-white/60" style={depthStyle}>
          {position.label}
        </span>
      )}
    </div>
  );
};

const FormationField = ({ composition, onPlayerDrop, onPlayerRemove, isReadOnly, tactic = '3-5-2', teamName, onSlotOpen }) => {
  const [activeSlot, setActiveSlot] = useState(null);

  const rawPositions = FORMATIONS[tactic] || FORMATIONS['3-5-2'];

  // Perspective 2D : le haut (loin) est resserré et réduit, le bas (près) écarté et agrandi.
  const MAX_DEPTH = 83; // top% de la ligne d'attaque
  const positions = rawPositions.map((pos) => {
    const top = parseFloat(pos.top);
    const left = parseFloat(pos.left);
    const d = Math.min(top / MAX_DEPTH, 1);          // 0 = loin (haut), 1 = près (bas)
    const spread = 0.82 + 0.18 * d;                  // compression horizontale douce (défense reste large)
    const scale = 0.88 + 0.22 * d;                   // taille presque constante, léger gain près du bas
    return { ...pos, left: `${50 + (left - 50) * spread}%`, scale };
  });

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
    <div className="formation-poster">
      {/* En-tête : badge + nom de l'équipe */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-white/10">
        <img src="/logo.webp" alt="KOTIYA FC" crossOrigin="anonymous" className="w-9 h-9 md:w-11 md:h-11 object-contain drop-shadow" />
        <h2 className="text-xl md:text-3xl font-black tracking-tight text-white uppercase">
          {teamName?.trim() || 'KOTIYA FC'}
        </h2>
      </div>

      {/* Demi-terrain vertical en perspective : but KOTIYA en haut, ligne médiane en bas */}
      <div className="football-pitch">
        <svg
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        >
          {/* Limites du terrain (trapèze doux) */}
          <path d="M48,12 L252,12 L297,388 L3,388 Z" />
          {/* Surface de réparation */}
          <path d="M96,12 L88,96 L212,96 L204,12" />
          {/* But (6 m) */}
          <path d="M126,12 L122,46 L178,46 L174,12" />
          {/* Arc de la surface (« D ») */}
          <path d="M130,96 Q150,126 170,96" />
          {/* Rond central posé sur la ligne médiane */}
          <ellipse cx="150" cy="388" rx="52" ry="22" />
          {/* Point de penalty */}
          <circle cx="150" cy="74" r="2" fill="rgba(255,255,255,0.45)" stroke="none" />
        </svg>

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
            onSlotOpen={onSlotOpen}
          />
        ))}

        {/* Badge système, type maquette */}
        <div className="absolute bottom-3 left-3 z-20 flex flex-col leading-none">
          <span className="text-[9px] md:text-[11px] font-semibold text-white/60 uppercase tracking-widest">Système</span>
          <span className="text-lg md:text-2xl font-black text-white tracking-tight">{tactic}</span>
        </div>
        <img
          src="/logo.webp"
          alt=""
          crossOrigin="anonymous"
          className="absolute bottom-3 right-3 z-20 w-8 h-8 md:w-10 md:h-10 object-contain opacity-80 drop-shadow"
        />
      </div>
    </div>
  );
};

export default FormationField;
