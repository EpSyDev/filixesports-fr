
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCompetitions } from '@/hooks/useCompetitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, ArrowRight, Filter, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const CompetitionPage = () => {
  const { competitions, loading } = useCompetitions();
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredCompetitions = competitions.filter(comp => {
    if (typeFilter !== 'ALL' && comp.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && comp.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <Helmet>
        <title>Compétitions - FC25 Esport</title>
        <meta name="description" content="Découvrez toutes nos compétitions, ligues et tournois FC25." />
      </Helmet>

      <div className="min-h-screen bg-background/90 flex flex-col">
        <Header />

        <main className="flex-1 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
                  Compétitions
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl font-medium">
                  Suivez les résultats, les classements et l'évolution de toutes nos ligues et tournois en temps réel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 bg-card p-2 rounded-xl border shadow-sm ring-1 ring-border">
                <div className="flex items-center gap-2 px-3 border-r">
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Filtres</span>
                </div>
                
                <select 
                  className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 rounded-md hover:bg-muted text-foreground"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">Tous les types</option>
                  <option value="LIGUE">Ligues</option>
                  <option value="TOURNOI">Tournois</option>
                </select>

                <select 
                  className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 rounded-md hover:bg-muted text-foreground"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="active">En cours</option>
                  <option value="completed">Terminés</option>
                  <option value="draft">À venir</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredCompetitions.length === 0 ? (
              <div className="text-center py-24 bg-muted/20 border border-dashed rounded-3xl">
                <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Aucune compétition trouvée</h3>
                <p className="text-muted-foreground font-medium">
                  {competitions.length === 0 
                    ? "Il n'y a pas encore de compétitions enregistrées pour cette saison." 
                    : "Aucune compétition ne correspond à vos critères de recherche."}
                </p>
                {(typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <Button 
                    variant="outline" 
                    className="mt-6 border-primary text-primary hover:bg-primary/10"
                    onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCompetitions.map((comp, index) => (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card className="h-full flex flex-col overflow-hidden border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                      <CardHeader className="pb-4 relative bg-muted/30">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none text-primary">
                          <Trophy className="w-24 h-24" />
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <Badge variant="secondary" className="bg-primary text-primary-foreground border-none font-bold shadow-sm">
                            {comp.type}
                          </Badge>
                          <Badge variant="outline" className={cn(
                            "font-bold uppercase tracking-wide text-[10px]",
                            comp.status === 'active' ? "bg-accent text-accent-foreground border-transparent shadow-sm" : 
                            comp.status === 'completed' ? "text-primary border-primary/30 bg-primary/10" : 
                            "text-muted-foreground bg-muted border-transparent"
                          )}>
                            {comp.status === 'active' ? 'En cours' : comp.status === 'completed' ? 'Terminé' : 'À venir'}
                          </Badge>
                        </div>
                        <CardTitle className="text-2xl font-extrabold leading-tight relative z-10 group-hover:text-primary transition-colors">
                          {comp.name}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="flex-1 relative z-10 pt-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground mb-4">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>Saison {comp.season || 'N/A'}</span>
                        </div>
                        {comp.description && (
                          <p className="text-muted-foreground text-sm line-clamp-3 font-medium">
                            {comp.description}
                          </p>
                        )}
                      </CardContent>
                      
                      <CardFooter className="pt-4 border-t bg-card relative z-10">
                        <Button 
                          asChild 
                          className="w-full group/btn font-bold shadow-sm" 
                          variant={comp.status === 'active' ? 'default' : 'secondary'}
                        >
                          <Link to={`/competition/${comp.id}`}>
                            {comp.status === 'active' ? (
                              <>
                                Suivre en direct 
                                <Activity className="w-4 h-4 ml-2 animate-pulse" />
                              </>
                            ) : (
                              <>
                                Voir les détails 
                                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                              </>
                            )}
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CompetitionPage;
