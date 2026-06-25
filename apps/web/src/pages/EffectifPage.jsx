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
  const POSITION_GROUPS = [
    { label: 'Gardiens',   codes: ['GB'] },
    { label: 'Défenseurs', codes: ['DC', 'DCG', 'DCD', 'DG', 'DD', 'DEF'] },
    { label: 'Milieux',    codes: ['MDC', 'MOC', 'MG', 'MD', 'MC', 'MIL'] },
    { label: 'Attaquants', codes: ['BU', 'ATG', 'ATD', 'AT', 'ATT'] },
  ];

  return <>
      <Helmet>
        <title>Effectif - KOTIYA FC</title>
        <meta name="description" content="Découvrez l'effectif complet du KOTIYA FC avec les statistiques de chaque joueur" />
      </Helmet>

      <div className="min-h-screen bg-transparent">
        <Header />

        <section className="py-10 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5
          }} className="text-center mb-8 md:mb-16">
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-primary/90 block mb-3">L'effectif</span>
              <h1 className="font-display uppercase text-5xl md:text-7xl mb-6 text-foreground text-balance">
                Notre <span className="text-primary">Effectif</span>
              </h1>
              <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                Les joueurs qui composent l'équipe KOTIYA FC.
              </p>
            </motion.div>

            {playersLoading || statsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : POSITION_GROUPS.map(({ label, codes }) => {
              const groupPlayers = players.filter(p => codes.includes(p.position));
              if (groupPlayers.length === 0) return null;
              return (
                <div key={label} className="mb-8 md:mb-16">
                  <div className="flex items-center gap-4 mb-4 md:mb-8">
                    <h2 className="font-display uppercase text-3xl md:text-4xl text-foreground">{label}</h2>
                    <span className="font-stat bg-primary text-primary-foreground font-extrabold text-sm px-2.5 py-1 rounded">
                      {groupPlayers.length}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                    {groupPlayers.map((player, index) => (
                      <motion.div key={player.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }}>
                        <PlayerCard player={player} stats={getPlayerStats(player.id)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Footer />
      </div>
    </>;
};
export default EffectifPage;