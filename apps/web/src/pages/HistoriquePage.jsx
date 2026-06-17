
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
        <title>Historique - Filix</title>
        <meta name="description" content="Consultez l'historique complet des matchs du Filix Football Club" />
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
                Historique des Matchs
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
