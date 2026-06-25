
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FormationComposer from '@/components/FormationComposer';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

const CompositionPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Helmet>
        <title>Composition tactique - KOTIYA FC</title>
        <meta name="description" content="Visualisez la composition tactique de l'équipe KOTIYA FC sur le terrain." />
      </Helmet>

      <div className="min-h-screen bg-transparent flex flex-col">
        <Header />

        <main className="flex-1 py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground tracking-tight">
                Tableau tactique
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                Choisissez la formation de chaque équipe et placez vos joueurs.
              </p>
            </motion.div>

            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-8 bg-secondary/10 border border-secondary/20 rounded-xl p-4 flex items-center justify-center gap-3 text-secondary-foreground max-w-2xl mx-auto"
              >
                <ShieldAlert className="w-5 h-5 text-secondary" />
                <p className="font-medium text-sm sm:text-base text-foreground">
                  Vous devez être admin pour modifier. Mode lecture seule activé.
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FormationComposer isReadOnly={!isAuthenticated} />
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CompositionPage;
