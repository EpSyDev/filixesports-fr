
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
  Activity, CheckCircle, MinusCircle, XCircle,
  Trophy, Shield, Star, RefreshCcw
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTeamStats } from '@/hooks/useTeamStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const StatCard = ({ title, value, subtitle, icon: Icon, iconColor, valueColor }) => (
  <Card className="bg-card shadow-sm border-primary/15 hover:border-primary/40 hover:shadow-md transition-all">
    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${iconColor}`} />
    </CardHeader>
    <CardContent className="px-5 pb-4">
      <div className={`font-stat text-4xl md:text-5xl font-extrabold ${valueColor ?? 'text-foreground'}`}>{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </CardContent>
  </Card>
);

const EmptyChart = () => (
  <div className="h-[300px] flex items-center justify-center text-muted-foreground flex-col gap-2">
    <Activity className="w-8 h-8 opacity-20" />
    <p className="text-sm">Pas assez de données pour afficher le graphique</p>
  </div>
);

const StatsEquipePage = () => {
  const { teamStats, trends, loading, error, refetch } = useTeamStats();

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-24">
          <Alert variant="destructive" className="max-w-2xl mx-auto mt-12">
            <Activity className="h-4 w-4" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col items-start gap-4">
              <p>{error}</p>
              <Button onClick={refetch} variant="outline" className="gap-2 bg-background">
                <RefreshCcw className="w-4 h-4" /> Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Statistiques Équipe - KOTIYA FC</title>
        <meta name="description" content="Consultez les statistiques globales et détaillées de l'équipe KOTIYA FC" />
      </Helmet>

      <div className="min-h-screen bg-transparent">
        <Header />

        <section className="py-10 md:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-primary/90 block mb-3">Performances</span>
              <h1 className="font-display uppercase text-5xl md:text-6xl lg:text-7xl mb-4 text-balance">
                Statistiques <span className="text-primary">d'Équipe</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Analyse détaillée des performances et des tendances de l'équipe KOTIYA FC.
              </p>
            </motion.div>

            {loading ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Skeleton className="h-80 rounded-xl" />
                  <Skeleton className="h-80 rounded-xl" />
                </div>
              </>
            ) : teamStats ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatCard title="Matchs Joués" value={teamStats.matchesPlayed} subtitle="Total des rencontres disputées" icon={Activity} iconColor="text-primary" />
                  <StatCard title="Nombres de victoires" value={teamStats.wins} subtitle="Rencontres gagnées" icon={CheckCircle} iconColor="text-emerald-500" valueColor="text-emerald-500" />
                  <StatCard title="Nombres de match nul" value={teamStats.draws} subtitle="Scores de parité" icon={MinusCircle} iconColor="text-muted-foreground" valueColor="text-muted-foreground" />
                  <StatCard title="Nombres de défaite" value={teamStats.losses} subtitle="Rencontres perdues" icon={XCircle} iconColor="text-destructive" valueColor="text-destructive" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  <StatCard title="Total des Buts" value={teamStats.goalsScored} subtitle="Réalisations de l'équipe" icon={Trophy} iconColor="text-primary" valueColor="text-primary" />
                  <StatCard title="Buts encaissés" value={teamStats.goalsConceded} subtitle="Buts concédés" icon={Shield} iconColor="text-orange-500" valueColor="text-orange-500" />
                  <StatCard title="Nombre de trophée remporté" value={teamStats.trophiesCount} subtitle="Titres ajoutés au palmarès" icon={Trophy} iconColor="text-primary" valueColor="text-primary" />
                  <StatCard title="Note Moyenne" value={teamStats.averageRating} subtitle="Sur l'ensemble de l'effectif" icon={Star} iconColor="text-yellow-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-card border-border/50 shadow-sm">
                    <CardHeader><CardTitle className="text-lg">Évolution des Buts</CardTitle></CardHeader>
                    <CardContent>
                      {trends.goals.length > 0 ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends.goals} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                              <XAxis dataKey="name" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                              <Line type="monotone" dataKey="goals" name="Buts" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : <EmptyChart />}
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50 shadow-sm">
                    <CardHeader><CardTitle className="text-lg">Évolution des Passes Décisives</CardTitle></CardHeader>
                    <CardContent>
                      {trends.assists.length > 0 ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends.assists} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                              <XAxis dataKey="name" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                              <Line type="monotone" dataKey="assists" name="Passes" stroke="hsl(216 100% 50%)" strokeWidth={3} dot={{ fill: 'hsl(216 100% 50%)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : <EmptyChart />}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : null}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default StatsEquipePage;
