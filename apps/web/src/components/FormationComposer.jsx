
import React, { useState, useEffect, useRef } from 'react';
import supabase from '@/lib/supabaseClient';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import FormationField, { TACTIC_OPTIONS } from './FormationField';
import PlayerSelector from './PlayerSelector';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RefreshCw, Download } from 'lucide-react';

const FormationComposer = ({ isReadOnly }) => {
  const [players, setPlayers] = useState([]);
  const [formations, setFormations] = useState([]);

  const [teamTactic, setTeamTactic] = useState('3-5-2');
  const [teamName, setTeamName] = useState('');
  const [composition, setComposition] = useState({});
  const [selectedFormationId, setSelectedFormationId] = useState('new');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

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
    setSelectedPlayer(null);
  };

  const handlePlayerSelect = (player) => {
    if (isReadOnly) return;
    setSelectedPlayer(prev => prev?.id === player.id ? null : player);
  };

  const handlePlayerDrop = (positionId, droppedPlayer) => {
    if (isReadOnly) return;
    const playerToPlace = droppedPlayer ?? selectedPlayer;
    if (!playerToPlace) return;
    setComposition(prev => {
      const newComp = { ...prev };
      for (const [key, player] of Object.entries(newComp)) {
        if (player && player.id === playerToPlace.id) newComp[key] = null;
      }
      newComp[positionId] = playerToPlace;
      return newComp;
    });
    setSelectedPlayer(null);
  };

  const handlePlayerRemove = (positionId) => {
    if (isReadOnly) return;
    setComposition(prev => ({ ...prev, [positionId]: null }));
  };

  const resetComposition = () => {
    if (isReadOnly) return;
    setComposition({});
    setSelectedPlayer(null);
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
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center max-w-6xl mx-auto">
      <div className="w-full lg:w-2/3 flex flex-col gap-3">

        {/* Barre d'outils — toujours en ligne sur mobile */}
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

        {/* Sélecteur de l'équipe KOTIYA FC (domicile) */}
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
              selectedPlayer={selectedPlayer}
            />
          </div>
        </div>

        {/* Hint tap-to-place sur mobile */}
        {!isReadOnly && selectedPlayer && (
          <p className="text-xs text-center text-primary font-medium sm:hidden animate-pulse">
            Appuie sur un emplacement pour placer {selectedPlayer.name}
          </p>
        )}
        {!isReadOnly && !selectedPlayer && (
          <p className="text-xs text-center text-muted-foreground sm:hidden">
            Sur mobile : sélectionne un joueur puis appuie sur un emplacement
          </p>
        )}

      </div>

      {!isReadOnly && (
        <div className="w-full lg:w-1/3 min-h-[400px] lg:min-h-[500px]">
          <PlayerSelector
            players={players}
            availablePlayerIds={availablePlayerIds}
            onDragStart={handleDragStart}
            selectedPlayer={selectedPlayer}
            onPlayerSelect={handlePlayerSelect}
          />
        </div>
      )}
    </div>
  );
};

export default FormationComposer;
