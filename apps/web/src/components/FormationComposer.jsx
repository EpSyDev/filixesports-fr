
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '@/lib/supabaseClient';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import FormationField, { TACTIC_OPTIONS } from './FormationField';
import PlayerSelector from './PlayerSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RefreshCw, Download, X, User, Search } from 'lucide-react';

const FormationComposer = ({ isReadOnly }) => {
  const [players, setPlayers] = useState([]);
  const [formations, setFormations] = useState([]);
  const [teamTactic, setTeamTactic] = useState('3-5-2');
  const [teamName, setTeamName] = useState('');
  const [composition, setComposition] = useState({});
  const [selectedFormationId, setSelectedFormationId] = useState('new');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Picker mobile — slot ouvert pour sélection
  const [pickerSlotId, setPickerSlotId] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const fieldRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, formationsRes] = await Promise.all([
          supabase.from('players').select('*').order('name', { ascending: true }),
          supabase.from('formations').select('*').order('created_at', { ascending: false })
        ]);
        if (playersRes.error) throw playersRes.error;
        if (formationsRes.error) throw formationsRes.error;
        setPlayers(playersRes.data);
        setFormations(formationsRes.data);
        if (formationsRes.data.length > 0) {
          loadFormation(formationsRes.data[0].id, formationsRes.data, playersRes.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Erreur lors du chargement des données");
      }
    };
    fetchData();
  }, []);

  const handleTeamTacticChange = (newTactic) => {
    setTeamTactic(newTactic);
    setComposition({});
  };

  const availablePlayerIds = players
    .map(p => p.id)
    .filter(id => !Object.values(composition).some(player => player && player.id === id));

  const handleDragStart = (e, player) => {
    if (isReadOnly) return;
    e.dataTransfer.setData('application/json', JSON.stringify(player));
    e.currentTarget.classList.add('dragging');
  };

  const handlePlayerDrop = (positionId, droppedPlayer) => {
    if (isReadOnly || !droppedPlayer) return;
    setComposition(prev => {
      const newComp = { ...prev };
      for (const [key, player] of Object.entries(newComp)) {
        if (player && player.id === droppedPlayer.id) newComp[key] = null;
      }
      newComp[positionId] = droppedPlayer;
      return newComp;
    });
  };

  const handlePlayerRemove = (positionId) => {
    if (isReadOnly) return;
    setComposition(prev => ({ ...prev, [positionId]: null }));
  };

  // Ouvre le picker pour un slot vide
  const handleSlotOpen = (positionId) => {
    if (isReadOnly) return;
    setPickerSlotId(positionId);
    setPickerSearch('');
  };

  // Sélection d'un joueur dans le picker → placement + fermeture
  const handlePickerSelect = (player) => {
    if (!pickerSlotId) return;
    handlePlayerDrop(pickerSlotId, player);
    setPickerSlotId(null);
    setPickerSearch('');
  };

  const pickerPlayers = players.filter(p => {
    if (!availablePlayerIds.includes(p.id)) return false;
    if (!pickerSearch) return true;
    const t = pickerSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(t) ||
      String(p.number).includes(t) ||
      p.position.toLowerCase().includes(t)
    );
  });

  const resetComposition = () => {
    if (isReadOnly) return;
    setComposition({});
  };

  const loadFormation = (formationId, formationsList = formations, playersList = players) => {
    const formation = formationsList.find(f => f.id === formationId);
    if (!formation) return;
    setSelectedFormationId(formation.id);
    if (formation.tactic) setTeamTactic(formation.tactic);
    const newComp = {};
    if (Array.isArray(formation.players)) {
      formation.players.forEach(p => {
        const fullPlayer = playersList.find(player => player.id === p.playerId);
        if (fullPlayer) {
          const pos = p.position === 'MC' ? 'MDC2' : p.position;
          newComp[pos] = fullPlayer;
        }
      });
    }
    setComposition(newComp);
  };

  const handleSave = async () => {
    if (isReadOnly) return;
    const assignedPlayers = Object.entries(composition)
      .filter(([_, player]) => player !== null)
      .map(([pos, player]) => ({
        position: pos,
        playerId: player.id,
        playerName: player.name,
        playerNumber: player.number
      }));

    if (assignedPlayers.length === 0) {
      toast.error('La formation est vide');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { name: 'Formation Principale', tactic: teamTactic, players: assignedPlayers };
      let savedRecord;
      if (selectedFormationId !== 'new') {
        const { data, error } = await supabase.from('formations').update(payload).eq('id', selectedFormationId).select().single();
        if (error) throw error;
        savedRecord = data;
        setFormations(prev => prev.map(f => f.id === savedRecord.id ? savedRecord : f));
        toast.success('Formation mise à jour');
      } else {
        const { data, error } = await supabase.from('formations').insert(payload).select().single();
        if (error) throw error;
        savedRecord = data;
        setFormations(prev => [savedRecord, ...prev]);
        setSelectedFormationId(savedRecord.id);
        toast.success('Formation sauvegardée');
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!fieldRef.current) return;
    setIsDownloading(true);
    const toastId = toast.loading('Génération de l\'image...');
    try {
      const canvas = await html2canvas(fieldRef.current, {
        useCORS: true, allowTaint: true, backgroundColor: '#0f172a', scale: 2,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `tactique-${teamTactic}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      link.click();
      toast.success('Téléchargée !', { id: toastId });
    } catch (error) {
      toast.error('Erreur lors du téléchargement', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center max-w-6xl mx-auto">
        <div className="w-full lg:w-2/3 flex flex-col gap-3">

          {/* Barre d'outils */}
          <div className="flex flex-row items-center gap-2 bg-card p-2 sm:p-3 rounded-xl border border-border shadow-sm">
            <Button onClick={handleDownload} disabled={isDownloading} variant="secondary" size="sm" className="gap-1.5 flex-1 sm:flex-none min-h-[44px]">
              <Download className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Télécharger</span>
              <span className="sm:hidden text-xs">Export</span>
            </Button>
            {!isReadOnly && (
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={resetComposition} className="gap-1.5 min-h-[44px]">
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Vider</span>
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 min-h-[44px]">
                  <Save className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Sauvegarder</span>
                  <span className="sm:hidden text-xs">Sauv.</span>
                </Button>
              </div>
            )}
          </div>

          {/* Sélecteur de formation */}
          <div className="flex items-center bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 gap-2">
            <img src="/logo.webp" alt="KOTIYA FC" className="w-6 h-6 object-contain shrink-0" />
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="KOTIYA FC"
              className="flex-1 bg-transparent text-sm font-bold text-primary placeholder:text-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded-sm min-w-0"
            />
            <Select value={teamTactic} onValueChange={handleTeamTacticChange}>
              <SelectTrigger className="w-24 sm:w-28 h-8 bg-primary/10 border-primary/30 text-primary text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TACTIC_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Terrain */}
          <div className="flex justify-center">
            <div ref={fieldRef} className="w-full max-w-[560px] rounded-xl overflow-hidden shadow-2xl">
              <FormationField
                composition={composition}
                onPlayerDrop={handlePlayerDrop}
                onPlayerRemove={handlePlayerRemove}
                isReadOnly={isReadOnly}
                tactic={teamTactic}
                teamName={teamName}
                onSlotOpen={handleSlotOpen}
              />
            </div>
          </div>

          {!isReadOnly && (
            <p className="text-xs text-center text-muted-foreground sm:hidden">
              Appuie sur un emplacement pour choisir un joueur
            </p>
          )}
        </div>

        {!isReadOnly && (
          <div className="w-full lg:w-1/3 min-h-[400px] lg:min-h-[500px]">
            <PlayerSelector
              players={players}
              availablePlayerIds={availablePlayerIds}
              onDragStart={handleDragStart}
            />
          </div>
        )}
      </div>

      {/* Bottom sheet — picker joueur (mobile & desktop) */}
      <AnimatePresence>
        {pickerSlotId && !isReadOnly && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setPickerSlotId(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-card border-t-2 border-primary/40 rounded-t-2xl shadow-2xl flex flex-col max-h-[72vh]"
            >
              {/* En-tête */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div>
                  <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest">Poste</p>
                  <h3 className="font-display uppercase text-xl text-foreground leading-none">{pickerSlotId}</h3>
                </div>
                <button
                  onClick={() => setPickerSlotId(null)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Recherche */}
              <div className="px-4 py-2 border-b border-border shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Rechercher un joueur..."
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    className="pl-9 bg-background min-h-[44px]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Liste joueurs */}
              <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
                {pickerPlayers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    Aucun joueur disponible
                  </div>
                ) : (
                  pickerPlayers.map(player => (
                    <button
                      key={player.id}
                      onClick={() => handlePickerSelect(player)}
                      className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10 transition-all text-left min-h-[60px]"
                    >
                      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-border">
                        {(player.image || player.photo) ? (
                          <img
                            src={player.image || player.photo}
                            alt={player.name}
                            loading="lazy"
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{player.name}</p>
                        <div className="flex gap-1.5 mt-1">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded leading-none">
                            {player.position}
                          </span>
                          {player.secondaryPosition && (
                            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded leading-none">
                              {player.secondaryPosition}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        {player.number}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FormationComposer;
