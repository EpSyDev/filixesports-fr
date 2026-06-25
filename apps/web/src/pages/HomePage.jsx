
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import supabase from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompetitions } from '@/hooks/useCompetitions';
import { ArrowRight, Trophy, Users, TrendingUp, Gamepad2 } from 'lucide-react';

const TournamentSummary = ({ competition }) => {
  const [teams, setTeams] = useState([]);
  
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data, error } = await supabase.from('tournament_teams').select('*').eq('competitionId', competition.id);
        if (error) throw error;
        setTeams(data);
      } catch (err) {
        console.error('Failed to fetch teams', err);
      }
    };

    fetchTeams();

    const channel = supabase.channel(`home-tournament-${competition.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tournament_teams',
        filter: `competitionId=eq.${competition.id}`
      }, fetchTeams)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [competition.id]);
  
  return (
    <Card className="flex flex-col h-full hover:-translate-y-1 transition-all duration-300 border-primary/15 hover:border-primary/40 shadow-sm group">
      <CardHeader className="pb-3 border-b border-primary/10 bg-primary/5">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="font-display uppercase text-xl md:text-2xl truncate pr-2 text-foreground group-hover:text-primary transition-colors">{competition.name}</CardTitle>
          <Badge variant={competition.status === 'active' ? 'accent' : competition.status === 'completed' ? 'secondary' : 'outline'} className={
            competition.status === 'active' ? 'bg-accent text-accent-foreground' : ''
          }>
            {competition.status === 'active' ? 'En cours' : competition.status === 'completed' ? 'Terminé' : 'Brouillon'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        <p className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4" /> Équipes participantes ({teams.length}) :
        </p>
        <div className="flex flex-wrap gap-1.5">
          {teams.length > 0 ? (
            teams.slice(0, 10).map(t => (
              <Badge key={t.id} variant="secondary" className="text-xs font-medium bg-muted text-foreground border-border/50">
                {t.teamName}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic">Aucune équipe inscrite</span>
          )}
          {teams.length > 10 && <Badge variant="secondary" className="text-xs font-medium border-border/50 bg-primary/10 text-primary">+{teams.length - 10} autres</Badge>}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link to={`/competition/${competition.id}`} className="w-full">
          <Button variant="default" className="w-full group/btn bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm min-h-[44px]">
            Voir le tournoi
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

const HomePage = () => {
  const { competitions, loading, error } = useCompetitions();
  const tournaments = competitions.filter(c => c.type === 'TOURNOI');

  return (
    <>
      <Helmet>
        <title>KOTIYA FC - Instinct · Discipline · Précision</title>
        <meta name="description" content="Bienvenue sur le site officiel du KOTIYA FC. Découvrez notre équipe, nos compétitions et notre palmarès." />
      </Helmet>

      <div className="min-h-screen bg-transparent flex flex-col">
        <Header />

        <main className="flex-1">
          <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
            {/* Atmosphère : halo or + auréole derrière le blason */}
            <div className="absolute inset-0 -z-0 pointer-events-none" aria-hidden="true">
              {/* Halo large diffus */}
              <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-4xl aspect-square rounded-full bg-primary/20 blur-[150px]" />
              {/* Aura vivante (respiration lente) */}
              <div className="logo-aura absolute left-1/2 top-[34%] w-[64vw] max-w-2xl aspect-square rounded-full blur-2xl" />
              {/* Cœur lumineux resserré derrière le blason */}
              <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 w-[42vw] max-w-md aspect-square rounded-full bg-primary/35 blur-[70px]" />
            </div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
              className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-12 flex flex-col items-center"
            >
              <motion.img
                variants={{ hidden: { opacity: 0, scale: 0.9, y: 12 }, show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }}
                src="/logo.webp"
                alt="KOTIYA FC"
                className="relative h-56 md:h-[22rem] lg:h-[26rem] object-contain mb-5 md:mb-7 drop-shadow-[0_0_60px_rgba(186,139,74,0.65)]"
              />
              <motion.span
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                className="text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-primary/90 mb-5 md:mb-7"
              >
                Club Esport · FC25 · Depuis 2026
              </motion.span>
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
                className="font-display text-foreground text-[clamp(3rem,12vw,7rem)] uppercase text-balance"
              >
                Kotiya <span className="text-primary">FC</span>
              </motion.h1>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                className="text-base sm:text-lg md:text-2xl font-bold uppercase tracking-[0.12em] sm:tracking-[0.2em] text-foreground/80 mt-6 md:mt-8 mb-8 md:mb-10 text-balance"
              >
                <span className="text-primary">I</span>nstinct · <span className="text-primary">D</span>iscipline · <span className="text-primary">P</span>récision
              </motion.p>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                className="text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed px-2"
              >
                Notre quête d'excellence sur le terrain virtuel. Le football, plus qu'un jeu : une compétition.
              </motion.p>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto px-4 sm:px-0"
              >
                <Link to="/effectif" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto gap-2 text-base font-bold uppercase tracking-wide px-8 h-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.6)] transition-all">
                    Découvrir l'équipe
                    <Gamepad2 className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/historique" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-base font-bold uppercase tracking-wide px-8 h-14 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground bg-transparent transition-all">
                    Voir les résultats
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </section>

          <section className="py-16 md:py-24 bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <h2 className="font-display uppercase text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-3 text-foreground">
                    Compétitions <span className="text-primary">& Tournois</span>
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground font-medium">
                    Suivez l'évolution de nos tournois en temps réel
                  </p>
                </motion.div>
                <Link to="/competition" className="hidden md:block">
                  <Button variant="ghost" className="gap-2 text-primary hover:text-primary hover:bg-primary/10 font-bold min-h-[44px]">
                    Toutes les compétitions
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl border-border bg-card" />)}
                </div>
              ) : error ? (
                <div className="text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20 font-medium">
                  Erreur: {error}
                </div>
              ) : tournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {tournaments.map((comp, index) => (
                    <motion.div
                      key={comp.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="h-full"
                    >
                      <TournamentSummary competition={comp} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 md:py-16 bg-card rounded-2xl border border-dashed shadow-sm">
                  <Trophy className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Aucun tournoi n'est programmé actuellement.</p>
                </div>
              )}
              
              <div className="mt-8 text-center md:hidden">
                <Link to="/competition">
                  <Button variant="outline" className="w-full gap-2 border-primary text-primary hover:bg-primary/10 font-bold min-h-[44px]">
                    Toutes les compétitions
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="hex-panel py-16 md:py-24 border-t border-primary/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className="hex-clip w-16 h-16 md:w-20 md:h-20 bg-primary/25 ring-1 ring-primary/40 flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:bg-primary transition-all duration-300">
                    <Trophy className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-display uppercase text-2xl md:text-3xl mb-2 md:mb-3 text-foreground">Excellence</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">
                    Des trophées et des victoires qui témoignent de notre engagement constant dans la compétition.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className="hex-clip w-16 h-16 md:w-20 md:h-20 bg-primary/25 ring-1 ring-primary/40 flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:bg-primary transition-all duration-300">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-display uppercase text-2xl md:text-3xl mb-2 md:mb-3 text-foreground">Équipe</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">
                    Des joueurs talentueux unis par la passion du gaming et la cohésion d'un groupe soudé.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className="hex-clip w-16 h-16 md:w-20 md:h-20 bg-primary/25 ring-1 ring-primary/40 flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:bg-primary transition-all duration-300">
                    <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-display uppercase text-2xl md:text-3xl mb-2 md:mb-3 text-foreground">Performance</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">
                    Des statistiques qui reflètent notre progression constante à chaque nouvelle saison.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default HomePage;
