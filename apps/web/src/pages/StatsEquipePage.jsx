
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Trophy, HeartHandshake as Handshake, Star, Activity, RefreshCcw, Square, RectangleVertical, Target, ArrowRightLeft, Shield } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTeamStats } from '@/hooks/useTeamStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
        <title>Statistiques Équipe - Filix</title>
        <meta name="description" content="Consultez les statistiques globales et détaillées de l'équipe Filix" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-balance" style={{ letterSpacing: '-0.02em' }}>
                Statistiques de l'Équipe
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Analyse détaillée des performances, de la discipline et des tendances de l'équipe Filix tout au long de la saison.
              </p>
            </motion.div>

            {loading ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Skeleton className="h-[400px] rounded-2xl" />
                  <Skeleton className="h-[400px] rounded-2xl" />
                </div>
              </>
            ) : teamStats ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Top Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  <Card className="bg-card shadow-lg border-border/50 hover:shadow-xl transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Matchs Joués</CardTitle>
                      <Activity className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold tracking-tight">{teamStats.matchesPlayed}</div>
                      <p className="text-xs text-muted-foreground mt-1">Total des rencontres disputées</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-lg border-border/50 hover:shadow-xl transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total des Buts</CardTitle>
                      <Trophy className="h-5 w-5 text-accent" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold tracking-tight text-accent">{teamStats.totalGoals}</div>
                      <p className="text-xs text-muted-foreground mt-1">Réalisations de l'équipe</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-lg border-border/50 hover:shadow-xl transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Passes Décisives</CardTitle>
                      <Handshake className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold tracking-tight text-blue-500">{teamStats.totalAssists}</div>
                      <p className="text-xs text-muted-foreground mt-1">Dernières passes avant un but</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-lg border-border/50 hover:shadow-xl transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total des Tirs</CardTitle>
                      <Target className="h-5 w-5 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold tracking-tight text-orange-500">{teamStats.totalShots}</div>
                      <p className="text-xs text-muted-foreground mt-1">Tentatives vers le but adverse</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-lg border-border/50 hover:shadow-xl transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total des Passes</CardTitle>
                      <ArrowRightLeft className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold tracking-tight text-emerald-500">{teamStats.totalPasses}</div>
                      <p className="text-xs text-muted-foreground mt-1">Passes réussies dans le jeu</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-lg border-border/50 hover:shadow-xl transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total des Tacles</CardTitle>
                      <Shield className="h-5 w-5 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold tracking-tight text-indigo-500">{teamStats.totalTackles}</div>
                      <p className="text-xs text-muted-foreground mt-1">Interventions défensives réussies</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-lg border-border/50 hover:shadow-xl transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Note Moyenne</CardTitle>
                      <Star className="h-5 w-5 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold tracking-tight text-yellow-500">{teamStats.averageRating}</div>
                      <p className="text-xs text-muted-foreground mt-1">Sur l'ensemble de l'effectif</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-lg border-border/50 hover:shadow-xl transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Joueurs Avertis</CardTitle>
                      <Square className="h-5 w-5 text-yellow-400 fill-yellow-400/20" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold tracking-tight">{teamStats.yellowCardCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">Cartons jaunes uniques</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-lg border-border/50 hover:shadow-xl transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Joueurs Expulsés</CardTitle>
                      <RectangleVertical className="h-5 w-5 text-destructive fill-destructive/20" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold tracking-tight text-destructive">{teamStats.redCardCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">Cartons rouges uniques</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Trends Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="bg-card border-border/50 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-xl">Évolution des Buts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trends.goals.length > 0 ? (
                        <div className="h-[350px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends.goals} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                stroke="currentColor" 
                                className="text-xs opacity-50" 
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                              />
                              <YAxis 
                                stroke="currentColor" 
                                className="text-xs opacity-50" 
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                                allowDecimals={false}
                              />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="goals" 
                                name="Buts" 
                                stroke="hsl(var(--accent))" 
                                strokeWidth={3}
                                dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={1000}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[350px] flex items-center justify-center text-muted-foreground flex-col gap-2">
                          <Activity className="w-8 h-8 opacity-20" />
                          <p>Pas assez de données pour afficher le graphique</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-xl">Évolution des Passes Décisives</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trends.assists.length > 0 ? (
                        <div className="h-[350px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends.assists} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                stroke="currentColor" 
                                className="text-xs opacity-50" 
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                              />
                              <YAxis 
                                stroke="currentColor" 
                                className="text-xs opacity-50" 
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                                allowDecimals={false}
                              />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="assists" 
                                name="Passes" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={1000}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[350px] flex items-center justify-center text-muted-foreground flex-col gap-2">
                          <Activity className="w-8 h-8 opacity-20" />
                          <p>Pas assez de données pour afficher le graphique</p>
                        </div>
                      )}
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
