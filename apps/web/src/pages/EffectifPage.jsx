import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlayerCard from '@/components/PlayerCard';
import { usePlayers } from '@/hooks/usePlayers';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { calculatePlayerStats } from '@/utils/stats-aggregation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
const EffectifPage = () => {
  const {
    players,
    loading: playersLoading
  } = usePlayers();
  const {
    playerStats,
    loading: statsLoading
  } = usePlayerStats();
  const getPlayerStats = playerId => {
    const stats = playerStats.filter(s => s.playerId === playerId);
    return calculatePlayerStats(stats);
  };
  const positions = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];
  return <>
      <Helmet>
        <title>Effectif - FC25 Esport</title>
        <meta name="description" content="Découvrez l'effectif complet du FC25 Esport avec les statistiques de chaque joueur" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5
          }} className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-foreground" style={{
              letterSpacing: '-0.02em'
            }}>
                Notre Effectif
              </h1>
              <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                Découvrez les joueurs professionnels qui composent notre équipe FC26.
              </p>
            </motion.div>

            {playersLoading || statsLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({
              length: 8
            }).map((_, i) => <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>)}
              </div> : positions.map((position, posIndex) => {
            const positionPlayers = players.filter(p => p.position === position);
            if (positionPlayers.length === 0) return null;
            return <div key={position} className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                      <h2 className="text-3xl font-extrabold text-foreground">{position}s</h2>
                      <Badge variant="secondary" className="bg-primary text-primary-foreground font-bold text-sm px-3 py-1">
                        {positionPlayers.length}
                      </Badge>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {positionPlayers.map((player, index) => <motion.div key={player.id} initial={{
                  opacity: 0,
                  y: 20
                }} whileInView={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  duration: 0.5,
                  delay: index * 0.1
                }} viewport={{
                  once: true
                }}>
                          <PlayerCard player={player} stats={getPlayerStats(player.id)} />
                        </motion.div>)}
                    </div>
                  </div>;
          })}
          </div>
        </section>

        <Footer />
      </div>
    </>;
};
export default EffectifPage;