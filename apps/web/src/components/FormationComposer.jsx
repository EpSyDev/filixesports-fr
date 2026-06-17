
import React, { useState, useEffect, useRef } from 'react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import FormationField from './FormationField';
import PlayerSelector from './PlayerSelector';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Download } from 'lucide-react';

const FormationComposer = ({ isReadOnly }) => {
  const [players, setPlayers] = useState([]);
  const [formations, setFormations] = useState([]);
  
  const [composition, setComposition] = useState({});
  const [selectedFormationId, setSelectedFormationId] = useState('new');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const fieldRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, formationsRes] = await Promise.all([
          pb.collection('players').getFullList({ sort: 'name', $autoCancel: false }),
          pb.collection('formations').getFullList({ sort: '-created', $autoCancel: false })
        ]);
        setPlayers(playersRes);
        setFormations(formationsRes);
        
        // Auto-load the most recent formation to simplify the view
        if (formationsRes.length > 0) {
          loadFormation(formationsRes[0].id, formationsRes, playersRes);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Erreur lors du chargement des données");
      }
    };
    fetchData();
  }, []);

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
        if (player && player.id === droppedPlayer.id) {
          newComp[key] = null;
        }
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
      const payload = {
        name: 'Formation Principale',
        players: assignedPlayers
      };

      let savedRecord;
      if (selectedFormationId !== 'new') {
        savedRecord = await pb.collection('formations').update(selectedFormationId, payload, { $autoCancel: false });
        setFormations(prev => prev.map(f => f.id === savedRecord.id ? savedRecord : f));
        toast.success('Formation mise à jour avec succès');
      } else {
        savedRecord = await pb.collection('formations').create(payload, { $autoCancel: false });
        setFormations(prev => [savedRecord, ...prev]);
        setSelectedFormationId(savedRecord.id);
        toast.success('Formation sauvegardée avec succès');
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error('Erreur lors de la sauvegarde de la formation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!fieldRef.current) return;
    
    setIsDownloading(true);
    const toastId = toast.loading('Génération de l\'image en cours...');
    
    try {
      const canvas = await html2canvas(fieldRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1a3b1a', // Fallback pitch color
        scale: 2, // Higher resolution
      });
      
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `tactique-fc25-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      link.click();
      
      toast.success('Tactique téléchargée avec succès !', { id: toastId });
    } catch (error) {
      console.error("Download error:", error);
      toast.error('Erreur lors du téléchargement de la tactique.', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center max-w-6xl mx-auto">
      <div className="w-full lg:w-2/3 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
          <Button 
            onClick={handleDownload} 
            disabled={isDownloading}
            variant="secondary" 
            className="gap-2 font-medium w-full sm:w-auto min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            Télécharger la tactique
          </Button>

          {!isReadOnly && (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={resetComposition}
                className="gap-2 w-full sm:w-auto min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                Vider
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="gap-2 w-full sm:w-auto min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </Button>
            </div>
          )}
        </div>
        
        <div ref={fieldRef} className="w-full rounded-xl overflow-hidden">
          <FormationField 
            composition={composition}
            onPlayerDrop={handlePlayerDrop}
            onPlayerRemove={handlePlayerRemove}
            isReadOnly={isReadOnly}
          />
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
