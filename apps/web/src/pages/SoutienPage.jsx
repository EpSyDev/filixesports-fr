
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// Collez ici le lien PayPal (PayPal.me ou bouton "Donate").
// Tant que la valeur est vide, la page affiche « Bientôt disponible ».
const PAYPAL_URL = '';
// ──────────────────────────────────────────────────────────────

const PERKS = [
  { icon: Sparkles, title: 'Un club plus fort', text: 'Chaque don finance le matériel, les compétitions et le contenu de l\'équipe.' },
  { icon: Heart, title: 'Un geste libre', text: 'Le montant est totalement à votre choix. Chaque soutien compte, même modeste.' },
  { icon: ShieldCheck, title: 'Paiement sécurisé', text: 'La transaction se fait directement via PayPal, en toute sécurité.' },
];

const SoutienPage = () => {
  const hasLink = PAYPAL_URL.trim().length > 0;

  return (
    <>
      <Helmet>
        <title>Soutenir le club - KOTIYA FC</title>
        <meta name="description" content="Soutenez le KOTIYA FC avec un don libre via PayPal et aidez le club à grandir." />
      </Helmet>

      <div className="min-h-screen bg-transparent">
        <Header />

        <section className="py-10 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-primary/90 block mb-3">
                Soutien
              </span>
              <h1 className="font-display uppercase text-5xl md:text-6xl mb-4">
                Soutenez le <span className="text-primary">club</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Le KOTIYA FC vit grâce à sa communauté. Un don, même symbolique, nous aide à équiper l'équipe et à porter le club plus haut.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-primary/20 hex-panel p-8 md:p-12 text-center shadow-2xl shadow-black/40"
            >
              <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display uppercase text-3xl md:text-4xl mb-3">Faire un don</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Montant libre, en quelques secondes via PayPal.
              </p>

              {hasLink ? (
                <a href={PAYPAL_URL} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wide min-h-[52px] px-8 text-base">
                    <Heart className="w-5 h-5" /> Soutenir via PayPal
                  </Button>
                </a>
              ) : (
                <Button size="lg" disabled className="gap-2 font-bold uppercase tracking-wide min-h-[52px] px-8 text-base opacity-70">
                  Bientôt disponible
                </Button>
              )}
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {PERKS.map((perk, i) => (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                  viewport={{ once: true }}
                  className="rounded-xl border border-primary/10 bg-muted/20 p-5 text-center"
                >
                  <perk.icon className="w-6 h-6 text-primary mx-auto mb-3" />
                  <h3 className="font-bold uppercase tracking-wide text-sm mb-1.5">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{perk.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default SoutienPage;
