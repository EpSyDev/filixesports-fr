
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
  const [opponentTactic, setOpponentTactic] = useState('4-3-3');
  const [composition, setComposition] = useState({});
  const [selectedFormationId, setSelectedFormationId] = useState('new');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
    if (isReadOnly) return;
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
        useCORS: true, allowTaint: true, backgroundColor: '#1a3b1a', scale: 2,
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
      <div className="w-full lg:w-2/3 flex flex-col gap-4">

        {/* Barre d'outils */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
          <Button onClick={handleDownload} disabled={isDownloading} variant="secondary" className="gap-2 font-medium w-full sm:w-auto min-h-[44px]">
            <Download className="w-4 h-4" />
            Télécharger
          </Button>
          {!isReadOnly && (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={resetComposition} className="gap-2 w-full sm:w-auto min-h-[44px]">
                <RefreshCw className="w-4 h-4" />
                Vider
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 w-full sm:w-auto min-h-[44px]">
                <Save className="w-4 h-4" />
                Sauvegarder
              </Button>
            </div>
          )}
        </div>

        {/* Équipe adverse */}
        <div className="flex items-center justify-between bg-red-950/40 border border-red-900/40 rounded-lg px-4 py-2">
          <span className="text-sm font-bold text-red-300">Adversaire</span>
          <Select value={opponentTactic} onValueChange={setOpponentTactic}>
            <SelectTrigger className="w-32 h-9 bg-red-950/60 border-red-800/60 text-red-200 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TACTIC_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Terrain — adversaire en haut (miroir), notre équipe en bas */}
        <div ref={fieldRef} className="w-full rounded-xl overflow-hidden flex flex-col">
          <div className="rotate-180">
            <FormationField composition={{}} onPlayerDrop={() => {}} onPlayerRemove={() => {}} isReadOnly tactic={opponentTactic} />
          </div>
          <FormationField
            composition={composition}
            onPlayerDrop={handlePlayerDrop}
            onPlayerRemove={handlePlayerRemove}
            isReadOnly={isReadOnly}
            tactic={teamTactic}
          />
        </div>

        {/* Notre équipe */}
        <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg px-4 py-2">
          <span className="text-sm font-bold text-primary">Notre équipe</span>
          <Select value={teamTactic} onValueChange={handleTeamTacticChange}>
            <SelectTrigger className="w-32 h-9 bg-primary/10 border-primary/30 text-primary text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TACTIC_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

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
  );
};

export default FormationComposer;
