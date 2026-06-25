
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MatchCard from '@/components/MatchCard';
import { useMatches } from '@/hooks/useMatches';
import { Skeleton } from '@/components/ui/skeleton';

const HistoriquePage = () => {
  const { matches, loading } = useMatches();

  return (
    <>
      <Helmet>
        <title>Historique - KOTIYA FC</title>
        <meta name="description" content="Consultez l'historique complet des matchs du KOTIYA FC" />
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
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-primary/90 block mb-3">Résultats</span>
              <h1 className="font-display uppercase text-4xl sm:text-5xl md:text-6xl mb-4 text-balance">
                Historique <span className="text-primary">des Matchs</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Tous nos matchs, résultats et performances
              </p>
            </motion.div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <MatchCard match={match} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun match pour le moment</p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default HistoriquePage;
