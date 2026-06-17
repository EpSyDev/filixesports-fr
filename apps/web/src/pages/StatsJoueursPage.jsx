
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayers } from '@/hooks/usePlayers';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { calculatePlayerStats } from '@/utils/stats-aggregation';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const COLUMNS = [
  { key: 'number',       label: '#',          align: 'left'   },
  { key: 'name',         label: 'Joueur',     align: 'left'   },
  { key: 'position',     label: 'Poste',      align: 'left'   },
  { key: 'totalMatches', label: 'MJ',         align: 'center' },
  { key: 'totalGoals',   label: 'Buts',       align: 'center' },
  { key: 'totalAssists', label: 'Passes D.',  align: 'center' },
  { key: 'totalShots',   label: 'Tirs',       align: 'center' },
  { key: 'totalPasses',  label: 'Passes',     align: 'center' },
  { key: 'totalTackles', label: 'Tacles',     align: 'center' },
  { key: 'averageRating',label: 'Note',       align: 'center' },
  { key: 'yellowCards',  label: 'CJ',         align: 'center' },
  { key: 'redCards',     label: 'CR',         align: 'center' },
];

const SortIcon = ({ col, sortKey, sortDir }) => {
  if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-30 inline" />;
  return sortDir === 'desc'
    ? <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary inline" />
    : <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary inline" />;
};

const StatsJoueursPage = () => {
  const { players, loading: playersLoading } = usePlayers();
  const { playerStats, loading: statsLoading } = usePlayerStats();

  const [sortKey, setSortKey] = useState('totalGoals');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const playersWithStats = players
    .map(player => ({
      ...player,
      ...calculatePlayerStats(playerStats.filter(s => s.playerId === player.id))
    }))
    .sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  return (
    <>
      <Helmet>
        <title>Statistiques Joueurs - Filix</title>
        <meta name="description" content="Consultez les statistiques détaillées de tous les joueurs du Filix Football Club" />
      </Helmet>

      <div className="min-h-screen bg-transparent">
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
                Cliquez sur une colonne pour trier
              </p>
            </motion.div>

            {playersLoading || statsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {COLUMNS.map(col => (
                        <TableHead
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors ${col.align === 'center' ? 'text-center' : ''}`}
                        >
                          {col.label}
                          <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playersWithStats.map(player => (
                      <TableRow key={player.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-bold">{player.number}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{player.name}</TableCell>
                        <TableCell className="text-muted-foreground">{player.position}</TableCell>
                        <TableCell className="text-center">{player.totalMatches}</TableCell>
                        <TableCell className="text-center font-bold text-primary">{player.totalGoals}</TableCell>
                        <TableCell className="text-center font-bold text-accent">{player.totalAssists}</TableCell>
                        <TableCell className="text-center">{player.totalShots}</TableCell>
                        <TableCell className="text-center">{player.totalPasses}</TableCell>
                        <TableCell className="text-center">{player.totalTackles}</TableCell>
                        <TableCell className="text-center font-bold text-yellow-500">
                          {player.averageRating > 0 ? player.averageRating.toFixed(1) : '-'}
                        </TableCell>
                        <TableCell className="text-center">{player.yellowCards}</TableCell>
                        <TableCell className="text-center">{player.redCards}</TableCell>
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
