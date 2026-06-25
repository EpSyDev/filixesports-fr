
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
  { key: 'number',        label: '#',         align: 'left',   hide: '' },
  { key: 'name',          label: 'Joueur',    align: 'left',   hide: '' },
  { key: 'position',      label: 'Poste',     align: 'left',   hide: 'hidden sm:table-cell' },
  { key: 'totalMatches',  label: 'MJ',        align: 'center', hide: 'hidden md:table-cell' },
  { key: 'totalGoals',    label: 'Buts',      align: 'center', hide: '' },
  { key: 'totalAssists',  label: 'Passes D.', align: 'center', hide: 'hidden sm:table-cell' },
  { key: 'totalShots',    label: 'Tirs',      align: 'center', hide: 'hidden lg:table-cell' },
  { key: 'totalPasses',   label: 'Passes',    align: 'center', hide: 'hidden lg:table-cell' },
  { key: 'totalTackles',  label: 'Tacles',    align: 'center', hide: 'hidden lg:table-cell' },
  { key: 'averageRating', label: 'Note',      align: 'center', hide: '' },
  { key: 'motm',          label: 'MOTM',      align: 'center', hide: 'hidden sm:table-cell' },
  { key: 'yellowCards',   label: 'CJ',        align: 'center', hide: 'hidden md:table-cell' },
  { key: 'redCards',      label: 'CR',        align: 'center', hide: 'hidden md:table-cell' },
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
        <title>Statistiques Joueurs - KOTIYA FC</title>
        <meta name="description" content="Consultez les statistiques détaillées de tous les joueurs du KOTIYA FC" />
      </Helmet>

      <div className="min-h-screen bg-transparent">
        <Header />

        <section className="py-10 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6 md:mb-12"
            >
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-primary/90 block mb-3">Le détail</span>
              <h1 className="font-display uppercase text-5xl md:text-6xl mb-4">
                Stats <span className="text-primary">Joueurs</span>
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
              <>
              <p className="text-xs text-muted-foreground text-right mb-2 sm:hidden">← Glissez pour voir plus →</p>
              <div className="bg-card border border-primary/25 rounded-2xl overflow-hidden overflow-x-auto shadow-2xl shadow-black/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#100f0d] hover:bg-[#100f0d] border-b border-primary/25">
                      {COLUMNS.map(col => (
                        <TableHead
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`cursor-pointer select-none whitespace-nowrap text-xs font-bold uppercase tracking-wider text-primary/80 hover:text-primary transition-colors ${col.align === 'center' ? 'text-center' : ''} ${col.hide}`}
                        >
                          {col.label}
                          <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playersWithStats.map(player => (
                      <TableRow key={player.id} className="border-b border-border/40 even:bg-foreground/[0.025] hover:bg-primary/5 transition-colors">
                        <TableCell className="font-stat font-bold text-muted-foreground">{player.number}</TableCell>
                        <TableCell className="font-display uppercase text-base whitespace-nowrap">{player.name}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">{player.position}</TableCell>
                        <TableCell className="text-center font-stat hidden md:table-cell">{player.totalMatches}</TableCell>
                        <TableCell className="text-center font-stat font-bold text-primary">{player.totalGoals}</TableCell>
                        <TableCell className="text-center font-stat font-bold hidden sm:table-cell">{player.totalAssists}</TableCell>
                        <TableCell className="text-center font-stat hidden lg:table-cell">{player.totalShots}</TableCell>
                        <TableCell className="text-center font-stat hidden lg:table-cell">{player.totalPasses}</TableCell>
                        <TableCell className="text-center font-stat hidden lg:table-cell">{player.totalTackles}</TableCell>
                        <TableCell className="text-center font-stat font-bold text-primary">
                          {player.averageRating > 0 ? player.averageRating.toFixed(1) : '-'}
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          {player.motm > 0 ? <span className="font-stat font-bold text-primary">{player.motm}</span> : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-center font-stat hidden md:table-cell">{player.yellowCards}</TableCell>
                        <TableCell className="text-center font-stat hidden md:table-cell">{player.redCards}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default StatsJoueursPage;
