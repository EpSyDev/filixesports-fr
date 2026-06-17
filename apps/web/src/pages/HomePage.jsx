
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
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
        const res = await pb.collection('tournament_teams').getFullList({
          filter: `competitionId="${competition.id}"`,
          $autoCancel: false
        });
        setTeams(res);
      } catch (err) {
        console.error("Failed to fetch teams", err);
      }
    };
    
    fetchTeams();
    
    pb.collection('tournament_teams').subscribe('*', function(e) {
      if (e.record.competitionId === competition.id) {
        fetchTeams();
      }
    });
    
    return () => {
      pb.collection('tournament_teams').unsubscribe('*');
    };
  }, [competition.id]);
  
  return (
    <Card className="flex flex-col h-full hover:-translate-y-1 transition-transform duration-300 border-border shadow-sm group">
      <CardHeader className="pb-3 border-b bg-primary/5">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg md:text-xl font-bold truncate pr-2 text-foreground group-hover:text-primary transition-colors">{competition.name}</CardTitle>
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
        <title>FC25 Esport - Unité. Passion. Performance</title>
        <meta name="description" content="Bienvenue sur le site officiel du FC25 Esport. Découvrez notre équipe, nos compétitions et notre palmarès." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <section 
            className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1542652694-40abf526446e)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-background/80 to-background"></div>
            
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center"
              >
                <img 
                  src="https://horizons-cdn.hostinger.com/892abe82-4853-42bb-bbdc-1574bf12dac9/90be8b6dae9488351c0e480e433e8d0d.png" 
                  alt="FC25 Esport" 
                  className="h-32 md:h-56 lg:h-64 object-contain mb-6 md:mb-8 drop-shadow-2xl"
                />
                <p className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground drop-shadow-md" style={{ letterSpacing: '-0.02em' }}>
                  Unité. Passion. Performance
                </p>
                <p className="text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-2">
                  Rejoignez-nous dans notre quête d'excellence sur et en dehors du terrain virtuel. Le football, plus qu'un jeu, une véritable compétition.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto px-4 sm:px-0">
                  <Link to="/effectif" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 h-14 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg border-2 border-accent hover:border-transparent transition-all">
                      Découvrir l'équipe
                      <Gamepad2 className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/historique" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-base px-8 h-14 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-lg transition-all">
                      Voir les résultats
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-16 md:py-24 bg-muted/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2 md:mb-3 text-foreground" style={{ letterSpacing: '-0.02em' }}>
                    Compétitions & Tournois
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

          <section className="py-16 md:py-24 bg-card border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 ring-2 ring-primary/20 group-hover:bg-primary group-hover:ring-primary/40 transition-all duration-300">
                    <Trophy className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-foreground">Excellence</h3>
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
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 ring-2 ring-accent/20 group-hover:bg-accent group-hover:ring-accent/40 transition-all duration-300">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-accent group-hover:text-accent-foreground transition-colors" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-foreground">Équipe</h3>
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
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 ring-2 ring-primary/20 group-hover:bg-primary group-hover:ring-primary/40 transition-all duration-300">
                    <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-foreground">Performance</h3>
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
