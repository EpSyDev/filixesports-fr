
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayers } from '@/hooks/usePlayers';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { calculatePlayerStats } from '@/utils/stats-aggregation';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const StatsJoueursPage = () => {
  const { players, loading: playersLoading } = usePlayers();
  const { playerStats, loading: statsLoading } = usePlayerStats();

  const playersWithStats = players.map(player => ({
    ...player,
    stats: calculatePlayerStats(playerStats.filter(s => s.playerId === player.id))
  })).sort((a, b) => b.stats.totalGoals - a.stats.totalGoals);

  return (
    <>
      <Helmet>
        <title>Statistiques Joueurs - Filix</title>
        <meta name="description" content="Consultez les statistiques détaillées de tous les joueurs du Filix Football Club" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>
                Statistiques des Joueurs
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Performances individuelles détaillées
              </p>
            </motion.div>

            {playersLoading || statsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Joueur</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="text-center">Matchs</TableHead>
                      <TableHead className="text-center">Buts</TableHead>
                      <TableHead className="text-center">Passes D.</TableHead>
                      <TableHead className="text-center">Tirs</TableHead>
                      <TableHead className="text-center">Passes</TableHead>
                      <TableHead className="text-center">Tacles</TableHead>
                      <TableHead className="text-center">Note</TableHead>
                      <TableHead className="text-center">Cartons J</TableHead>
                      <TableHead className="text-center">Cartons R</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playersWithStats.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-bold">{player.number}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{player.name}</TableCell>
                        <TableCell className="text-muted-foreground">{player.position}</TableCell>
                        <TableCell className="text-center">{player.stats.totalMatches}</TableCell>
                        <TableCell className="text-center font-bold text-primary">{player.stats.totalGoals}</TableCell>
                        <TableCell className="text-center font-bold text-accent">{player.stats.totalAssists}</TableCell>
                        <TableCell className="text-center">{player.stats.totalShots}</TableCell>
                        <TableCell className="text-center">{player.stats.totalPasses}</TableCell>
                        <TableCell className="text-center">{player.stats.totalTackles}</TableCell>
                        <TableCell className="text-center font-bold text-yellow-500">
                          {player.stats.averageRating > 0 ? player.stats.averageRating.toFixed(1) : '-'}
                        </TableCell>
                        <TableCell className="text-center">{player.stats.yellowCards}</TableCell>
                        <TableCell className="text-center">{player.stats.redCards}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default StatsJoueursPage;
