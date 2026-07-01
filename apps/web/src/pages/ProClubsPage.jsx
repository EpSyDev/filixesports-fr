
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ClubBadge from '@/components/ClubBadge';
import StatsChart from '@/components/StatsChart';
import { useProClubs } from '@/hooks/useProClubs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown, ArrowUp, ArrowDown, Trophy, Target, Shield, Star, TrendingUp, Building2 } from 'lucide-react';

const POSITION_FR = {
  forward: 'Attaquant',
  midfielder: 'Milieu',
  defender: 'Défenseur',
  goalkeeper: 'Gardien',
};

const PLAYER_COLUMNS = [
  { key: 'name',                label: 'Joueur',   align: 'left',   hide: '' },
  { key: 'favorite_position',   label: 'Poste',    align: 'left',   hide: 'hidden sm:table-cell' },
  { key: 'pro_overall',         label: 'OVR',      align: 'center', hide: 'hidden md:table-cell' },
  { key: 'games_played',        label: 'MJ',       align: 'center', hide: 'hidden md:table-cell' },
  { key: 'goals',               label: 'Buts',     align: 'center', hide: '' },
  { key: 'assists',             label: 'Passes D.',align: 'center', hide: '' },
  { key: 'rating_ave',          label: 'Note',     align: 'center', hide: '' },
  { key: 'win_rate',            label: '% Vict.',  align: 'center', hide: 'hidden lg:table-cell' },
  { key: 'pass_success_rate',   label: '% Passes', align: 'center', hide: 'hidden lg:table-cell' },
  { key: 'man_of_the_match',    label: 'MOTM',     align: 'center', hide: 'hidden sm:table-cell' },
  { key: 'red_cards',           label: 'CR',       align: 'center', hide: 'hidden lg:table-cell' },
];

const SortIcon = ({ col, sortKey, sortDir }) => {
  if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-30 inline" />;
  return sortDir === 'desc'
    ? <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary inline" />
    : <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary inline" />;
};

const StatBox = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="bg-muted/30 border border-primary/10 rounded-xl p-4 md:p-5 text-center">
    {Icon && <Icon className={`w-5 h-5 mx-auto mb-2 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />}
    <div className="font-stat text-3xl md:text-4xl font-bold text-foreground">{value}</div>
    <div className="text-[11px] md:text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    {sub && <div className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</div>}
  </div>
);

const RESULT_STYLE = {
  win:  { chip: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', letter: 'V' },
  loss: { chip: 'bg-destructive/15 text-destructive border-destructive/30',  letter: 'D' },
  draw: { chip: 'bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30', letter: 'N' },
};

const ProClubsPage = () => {
  const { club, players, matches, loading } = useProClubs();
  const [sortKey, setSortKey] = useState('goals');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'string' || typeof bv === 'string') {
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [players, sortKey, sortDir]);

  // Forme récente calculée depuis les matchs (fiable), plus récent à gauche
  const form = useMemo(() => matches.slice(0, 10).map(m => m.result), [matches]);

  const goalDiff = club ? (club.goals ?? 0) - (club.goals_against ?? 0) : 0;
  const winPct = club && club.games_played
    ? Math.round((club.wins / club.games_played) * 100)
    : 0;

  const topScorers = useMemo(
    () => [...players].sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0)).slice(0, 6)
      .map(p => ({ name: p.name, value: p.goals ?? 0 })),
    [players]
  );
  const topAssists = useMemo(
    () => [...players].sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0)).slice(0, 6)
      .map(p => ({ name: p.name, value: p.assists ?? 0 })),
    [players]
  );
  const resultsPie = club
    ? [
        { name: 'Victoires', value: club.wins ?? 0 },
        { name: 'Nuls', value: club.ties ?? 0 },
        { name: 'Défaites', value: club.losses ?? 0 },
      ]
    : [];

  const formatDate = (ts) =>
    ts ? new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <>
      <Helmet>
        <title>Pro Clubs - KOTIYA FC</title>
        <meta name="description" content="Statistiques EA Pro Clubs du KOTIYA FC : bilan du club, classement des joueurs, analytics et derniers matchs." />
      </Helmet>

      <div className="min-h-screen bg-transparent">
        <Header />

        <section className="py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* En-tête */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8 md:mb-12"
            >
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-primary/90 block mb-3">
                EA Pro Clubs
              </span>
              <h1 className="font-display uppercase text-5xl md:text-6xl mb-3">
                Pro <span className="text-primary">Clubs</span>
              </h1>
              {club ? (
                <p className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm md:text-base">
                  <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4 text-primary" /> {club.stadium}</span>
                  <span className="text-primary/40">·</span>
                  <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 text-primary" /> Skill Rating {club.skill_rating}</span>
                  <span className="text-primary/40">·</span>
                  <span>Meilleure division : D{club.best_division}</span>
                </p>
              ) : (
                <p className="text-lg text-muted-foreground">Statistiques du club sur EA FC</p>
              )}
            </motion.div>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 rounded-xl" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
              </div>
            ) : !club ? (
              <div className="text-center py-16 max-w-md mx-auto">
                <p className="text-muted-foreground">
                  Les statistiques Pro Clubs ne sont pas encore disponibles. Elles apparaîtront dès la première synchronisation avec EA.
                </p>
              </div>
            ) : (
              <Tabs defaultValue="stats" className="w-full">
                <div className="overflow-x-auto pb-2 mb-6 md:mb-8 custom-scrollbar">
                  <TabsList className="inline-flex w-max min-w-full h-auto p-1 bg-muted/40 border border-primary/15 rounded-xl">
                    {[
                      { v: 'stats', l: 'Stats' },
                      { v: 'analytics', l: 'Analytics' },
                      { v: 'players', l: 'Players' },
                      { v: 'matches', l: 'Matches' },
                    ].map(t => (
                      <TabsTrigger
                        key={t.v}
                        value={t.v}
                        className="py-2.5 px-5 min-h-[44px] font-bold uppercase tracking-wide text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
                      >
                        {t.l}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* ============ STATS ============ */}
                <TabsContent value="stats" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                  {/* Forme récente */}
                  {form.length > 0 && (
                    <div className="flex items-center gap-3 justify-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Forme</span>
                      <div className="flex gap-1.5">
                        {form.map((r, i) => (
                          <span
                            key={i}
                            className={`w-8 h-8 rounded-md border flex items-center justify-center font-stat font-bold text-sm ${RESULT_STYLE[r]?.chip || RESULT_STYLE.draw.chip}`}
                            title={r === 'win' ? 'Victoire' : r === 'loss' ? 'Défaite' : 'Nul'}
                          >
                            {RESULT_STYLE[r]?.letter || '·'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox icon={Trophy} label="Victoires" value={club.wins} accent />
                    <StatBox label="Nuls" value={club.ties} />
                    <StatBox label="Défaites" value={club.losses} />
                    <StatBox icon={TrendingUp} label="% Victoires" value={`${winPct}%`} accent />
                    <StatBox icon={Target} label="Buts marqués" value={club.goals} accent />
                    <StatBox label="Buts encaissés" value={club.goals_against} />
                    <StatBox label="Différence" value={`${goalDiff > 0 ? '+' : ''}${goalDiff}`} accent={goalDiff >= 0} />
                    <StatBox icon={Shield} label="Matchs joués" value={club.games_played} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox icon={Star} label="Skill Rating" value={club.skill_rating} accent />
                    <StatBox label="Promotions" value={club.promotions} />
                    <StatBox label="Relégations" value={club.relegations} />
                    <StatBox label="Matchs playoff" value={club.games_played_playoff} />
                  </div>
                </TabsContent>

                {/* ============ ANALYTICS ============ */}
                <TabsContent value="analytics" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <StatsChart type="bar" title="Meilleurs buteurs" data={topScorers} />
                    <StatsChart type="bar" title="Meilleurs passeurs" data={topAssists} />
                    <StatsChart type="pie" title="Répartition des résultats" data={resultsPie} />
                    <Card className="bg-card border-border">
                      <CardHeader><CardTitle>Meilleures notes moyennes</CardTitle></CardHeader>
                      <CardContent className="space-y-3 pt-2">
                        {[...players]
                          .filter(p => p.games_played >= 5)
                          .sort((a, b) => (b.rating_ave ?? 0) - (a.rating_ave ?? 0))
                          .slice(0, 6)
                          .map((p, i) => (
                            <div key={p.name} className="flex items-center gap-3">
                              <span className="font-stat text-sm text-muted-foreground w-5">{i + 1}</span>
                              <span className="flex-1 font-display uppercase truncate">{p.name}</span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[140px]">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${((p.rating_ave ?? 0) / 10) * 100}%` }} />
                              </div>
                              <span className="font-stat font-bold text-primary w-10 text-right">{Number(p.rating_ave).toFixed(1)}</span>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* ============ PLAYERS ============ */}
                <TabsContent value="players" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-xs text-muted-foreground text-right mb-2 sm:hidden">← Glissez pour voir plus →</p>
                  <div className="bg-card border border-primary/25 rounded-2xl overflow-hidden overflow-x-auto shadow-2xl shadow-black/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#100f0d] hover:bg-[#100f0d] border-b border-primary/25">
                          {PLAYER_COLUMNS.map(col => (
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
                        {sortedPlayers.map(p => (
                          <TableRow key={p.name} className="border-b border-border/40 even:bg-foreground/[0.025] hover:bg-primary/5 transition-colors">
                            <TableCell className="font-display uppercase text-base whitespace-nowrap">{p.name}</TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">{POSITION_FR[p.favorite_position] || '—'}</TableCell>
                            <TableCell className="text-center font-stat font-bold hidden md:table-cell">{p.pro_overall}</TableCell>
                            <TableCell className="text-center font-stat hidden md:table-cell">{p.games_played}</TableCell>
                            <TableCell className="text-center font-stat font-bold text-primary">{p.goals}</TableCell>
                            <TableCell className="text-center font-stat font-bold">{p.assists}</TableCell>
                            <TableCell className="text-center font-stat font-bold text-primary">
                              {p.rating_ave > 0 ? Number(p.rating_ave).toFixed(1) : '-'}
                            </TableCell>
                            <TableCell className="text-center font-stat hidden lg:table-cell">{p.win_rate}%</TableCell>
                            <TableCell className="text-center font-stat hidden lg:table-cell">{p.pass_success_rate}%</TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              {p.man_of_the_match > 0 ? <span className="font-stat font-bold text-primary">{p.man_of_the_match}</span> : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="text-center font-stat hidden lg:table-cell">{p.red_cards}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* ============ MATCHES ============ */}
                <TabsContent value="matches" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {matches.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">Aucun match récent enregistré.</p>
                  ) : (
                    <div className="space-y-3 max-w-3xl mx-auto">
                      {matches.map(m => {
                        const style = RESULT_STYLE[m.result] || RESULT_STYLE.draw;
                        return (
                          <div key={m.match_id} className="flex items-center gap-4 p-4 bg-card border border-primary/15 rounded-xl hover:border-primary/30 transition-colors">
                            <span className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center font-stat font-bold ${style.chip}`}>
                              {style.letter}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 font-semibold">
                                <ClubBadge teamName="KOTIYA FC" className="max-w-[45%]" />
                                <span className="font-stat text-lg tabular-nums px-2 text-primary">{m.our_score} - {m.opp_score}</span>
                                <ClubBadge teamName={m.opponent_name} showIcon={false} className="max-w-[45%]" />
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{formatDate(m.played_at)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default ProClubsPage;
