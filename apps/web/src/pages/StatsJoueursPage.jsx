
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
import { ArrowUpDown, ArrowUp, ArrowDown, Hand, Shield } from 'lucide-react';

const GK_POSITION = 'GB';

// Colonnes joueurs de champ
const OUTFIELD_COLUMNS = [
  { key: 'number',              label: '#',          align: 'left',   hide: '' },
  { key: 'name',                label: 'Joueur',     align: 'left',   hide: '' },
  { key: 'position',            label: 'Poste',      align: 'left',   hide: 'hidden sm:table-cell' },
  { key: 'totalMatches',        label: 'MJ',         align: 'center', hide: 'hidden md:table-cell' },
  { key: 'totalGoals',          label: 'Buts',       align: 'center', hide: '' },
  { key: 'totalAssists',        label: 'Passes D.',  align: 'center', hide: 'hidden sm:table-cell' },
  { key: 'totalShots',          label: 'Tirs',       align: 'center', hide: 'hidden lg:table-cell' },
  { key: 'totalPasses',         label: 'Passes',     align: 'center', hide: 'hidden lg:table-cell' },
  { key: 'totalTackles',        label: 'Tacles',     align: 'center', hide: 'hidden lg:table-cell' },
  { key: 'totalOffsides',       label: 'HJ',         align: 'center', hide: 'hidden xl:table-cell' },
  { key: 'totalBallsRecovered', label: 'Ball. réc.', align: 'center', hide: 'hidden xl:table-cell' },
  { key: 'totalBallsLost',      label: 'Ball. perdu',align: 'center', hide: 'hidden xl:table-cell' },
  { key: 'avgPassAccuracy',     label: '% Passes',   align: 'center', hide: 'hidden xl:table-cell', suffix: '%' },
  { key: 'avgShotAccuracy',     label: '% Tirs',     align: 'center', hide: 'hidden xl:table-cell', suffix: '%' },
  { key: 'averageRating',       label: 'Note',       align: 'center', hide: '', rating: true },
  { key: 'motm',                label: 'MOTM',       align: 'center', hide: 'hidden sm:table-cell', highlight: true },
];

// Colonnes gardiens
const GK_COLUMNS = [
  { key: 'number',                    label: '#',            align: 'left',   hide: '' },
  { key: 'name',                      label: 'Joueur',       align: 'left',   hide: '' },
  { key: 'position',                  label: 'Poste',        align: 'left',   hide: 'hidden sm:table-cell' },
  { key: 'totalMatches',              label: 'MJ',           align: 'center', hide: 'hidden md:table-cell' },
  { key: 'averageRating',             label: 'Note',         align: 'center', hide: '', rating: true },
  { key: 'motm',                      label: 'MOTM',         align: 'center', hide: 'hidden sm:table-cell', highlight: true },
  { key: 'totalShotsFaced',           label: 'Tirs subis',   align: 'center', hide: 'hidden md:table-cell' },
  { key: 'totalShotsOnTargetFaced',   label: 'Tirs cadrés',  align: 'center', hide: 'hidden lg:table-cell' },
  { key: 'totalSaves',                label: 'Arrêts',       align: 'center', hide: '', highlight: true },
  { key: 'totalGoalsConceded',        label: 'Buts enc.',    align: 'center', hide: '' },
  { key: 'totalPenaltiesSaved',       label: 'Pén. arrêtés', align: 'center', hide: 'hidden lg:table-cell' },
  { key: 'totalPenaltyGoalsConceded', label: 'Buts P. enc.', align: 'center', hide: 'hidden lg:table-cell' },
];

const SortIcon = ({ col, sortKey, sortDir }) => {
  if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-30 inline" />;
  return sortDir === 'desc'
    ? <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary inline" />
    : <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary inline" />;
};

const StatsTable = ({ columns, rows, defaultSort }) => {
  const [sortKey, setSortKey] = useState(defaultSort);
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const renderCell = (player, col) => {
    if (col.key === 'number') return <TableCell className={`font-stat font-bold text-muted-foreground ${col.hide}`}>{player.number}</TableCell>;
    if (col.key === 'name') return <TableCell className={`font-display uppercase text-base whitespace-nowrap ${col.hide}`}>{player.name}</TableCell>;
    if (col.key === 'position') return <TableCell className={`text-muted-foreground ${col.hide}`}>{player.position}</TableCell>;
    if (col.rating) return (
      <TableCell className={`text-center font-stat font-bold text-primary ${col.hide}`}>
        {player.averageRating > 0 ? player.averageRating.toFixed(1) : '-'}
      </TableCell>
    );
    if (col.key === 'motm') return (
      <TableCell className={`text-center ${col.hide}`}>
        {player.motm > 0 ? <span className="font-stat font-bold text-primary">{player.motm}</span> : <span className="text-muted-foreground">-</span>}
      </TableCell>
    );
    const value = player[col.key] ?? 0;
    return (
      <TableCell className={`text-center font-stat ${col.highlight ? 'font-bold text-primary' : ''} ${col.hide}`}>
        {value}{col.suffix && value > 0 ? col.suffix : ''}
      </TableCell>
    );
  };

  return (
    <div className="bg-card border border-primary/25 rounded-2xl overflow-hidden overflow-x-auto shadow-2xl shadow-black/50">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#100f0d] hover:bg-[#100f0d] border-b border-primary/25">
            {columns.map(col => (
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
          {sorted.map(player => (
            <TableRow key={player.id} className="border-b border-border/40 even:bg-foreground/[0.025] hover:bg-primary/5 transition-colors">
              {columns.map(col => <React.Fragment key={col.key}>{renderCell(player, col)}</React.Fragment>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const StatsJoueursPage = () => {
  const { players, loading: playersLoading } = usePlayers();
  const { playerStats, loading: statsLoading } = usePlayerStats();

  const playersWithStats = players.map(player => ({
    ...player,
    ...calculatePlayerStats(playerStats.filter(s => s.playerId === player.id))
  }));

  const goalkeepers = playersWithStats.filter(p => p.position === GK_POSITION);
  const outfield = playersWithStats.filter(p => p.position !== GK_POSITION);

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
              <div className="space-y-12">
                <p className="text-xs text-muted-foreground text-right -mb-2 sm:hidden">← Glissez pour voir plus →</p>

                {/* ── Joueurs de champ ── */}
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 font-display uppercase text-2xl text-foreground">
                    <Shield className="w-5 h-5 text-primary" /> Joueurs de champ
                  </h2>
                  <StatsTable columns={OUTFIELD_COLUMNS} rows={outfield} defaultSort="totalGoals" />
                </div>

                {/* ── Gardiens ── */}
                {goalkeepers.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="flex items-center gap-2 font-display uppercase text-2xl text-emerald-600 dark:text-emerald-500">
                      <Hand className="w-5 h-5" /> Gardiens de but
                    </h2>
                    <StatsTable columns={GK_COLUMNS} rows={goalkeepers} defaultSort="totalSaves" />
                  </div>
                )}
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
