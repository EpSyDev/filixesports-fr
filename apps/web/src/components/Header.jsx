
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Accueil', path: '/' },
  {
    label: 'Équipe',
    children: [
      { label: 'Effectif', path: '/effectif' },
      { label: 'Composition', path: '/composition' },
    ],
  },
  {
    label: 'Compétitions',
    children: [
      { label: 'Compétition', path: '/competition' },
      { label: 'Historique', path: '/historique' },
      { label: 'Palmarès', path: '/palmares' },
    ],
  },
  {
    label: 'Stats',
    children: [
      { label: 'Stats Joueurs', path: '/stats-joueurs' },
      { label: 'Stats Équipe', path: '/stats-equipe' },
    ],
  },
  { label: 'Média', path: '/media' },
];

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isGroupActive = (item) => item.children?.some((c) => isActive(c.path));
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      // Hystérésis : condense au-delà de 90px, ne se redéploie qu'en dessous de 30px.
      // La zone morte 30–90 empêche l'oscillation (et le tremblement) près du haut de page.
      setScrolled((prev) => (prev ? y > 30 : y > 90));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Liste à plat pour l'overlay mobile (avec en-têtes de groupe)
  const mobileEntries = [];
  NAV.forEach((item) => {
    if (item.children) {
      mobileEntries.push({ type: 'group', label: item.label });
      item.children.forEach((c) => mobileEntries.push({ type: 'link', ...c }));
    } else {
      mobileEntries.push({ type: 'link', ...item });
    }
  });

  return (
    <header className="sticky top-0 z-50">
      {/* Fil or signature en haut */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div
        className={cn(
          'backdrop-blur-md text-foreground transition-all duration-300 border-b',
          scrolled
            ? 'bg-background/90 border-primary/25 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)]'
            : 'bg-background/60 border-primary/10'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn('flex items-center justify-between transition-all duration-300', scrolled ? 'h-14 md:h-16' : 'h-16 md:h-20')}>

            {/* Lockup logo + wordmark */}
            <Link to="/" className="flex items-center gap-3 group/logo shrink-0" onClick={closeMenu}>
              <img
                src="/logo.webp"
                alt="KOTIYA FC"
                className={cn('w-auto object-contain transition-all duration-300 drop-shadow-[0_0_16px_rgba(186,139,74,0.35)]', scrolled ? 'h-9 md:h-11' : 'h-10 md:h-14')}
              />
              <span className="hidden sm:block font-display uppercase leading-none text-lg md:text-2xl tracking-wide text-foreground group-hover/logo:text-primary transition-colors">
                Kotiya <span className="text-primary">FC</span>
              </span>
            </Link>

            {/* Navigation desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((item) => {
                const active = item.path ? isActive(item.path) : isGroupActive(item);
                return (
                  <div key={item.label} className="relative group/nav">
                    {item.path ? (
                      <Link
                        to={item.path}
                        className="relative flex items-center h-11 px-3 text-sm font-bold uppercase tracking-wider text-foreground/80 hover:text-foreground transition-colors"
                      >
                        {item.label}
                        <span className={cn('absolute bottom-2 left-3 right-3 h-0.5 bg-primary origin-left transition-transform duration-300', active ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100')} />
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="relative flex items-center gap-1 h-11 px-3 text-sm font-bold uppercase tracking-wider text-foreground/80 hover:text-foreground transition-colors"
                        >
                          {item.label}
                          <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover/nav:rotate-180" />
                          <span className={cn('absolute bottom-2 left-3 right-6 h-0.5 bg-primary origin-left transition-transform duration-300', active ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100')} />
                        </button>
                        {/* Dropdown */}
                        <div className="absolute left-0 top-full pt-3 opacity-0 invisible translate-y-1 transition-all duration-200 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 group-focus-within/nav:opacity-100 group-focus-within/nav:visible group-focus-within/nav:translate-y-0">
                          <div className="min-w-[210px] rounded-xl border border-primary/20 bg-[#0c0c0b]/95 backdrop-blur-md shadow-2xl p-1.5">
                            {item.children.map((child) => (
                              <Link
                                key={child.path}
                                to={child.path}
                                className={cn(
                                  'block rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors',
                                  isActive(child.path)
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-foreground/75 hover:bg-foreground/5 hover:text-foreground'
                                )}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Actions desktop */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {!isAuthenticated ? (
                <Link to="/login">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wide min-h-[44px]">
                    Espace Admin
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-foreground hover:bg-primary/10 hover:text-foreground bg-transparent min-h-[44px]">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Button>
                  </Link>
                  <Button size="sm" onClick={logout} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold min-h-[44px]">
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </Button>
                </>
              )}
            </div>

            {/* Déclencheur mobile */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="lg:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-foreground hover:bg-foreground/10 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay mobile plein écran */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden fixed inset-0 z-[60] hex-panel flex flex-col"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-primary/15">
              <img src="/logo.webp" alt="KOTIYA FC" className="h-10 w-auto object-contain" />
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-foreground hover:bg-foreground/10 transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <motion.nav
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
              className="flex-1 overflow-y-auto px-6 py-6 flex flex-col"
            >
              {mobileEntries.map((entry, i) =>
                entry.type === 'group' ? (
                  <motion.span
                    key={`g-${entry.label}`}
                    variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
                    className="text-xs font-bold uppercase tracking-[0.35em] text-primary/70 mt-6 mb-1 first:mt-0"
                  >
                    {entry.label}
                  </motion.span>
                ) : (
                  <motion.div key={entry.path} variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}>
                    <Link
                      to={entry.path}
                      onClick={closeMenu}
                      className={cn(
                        'block font-display uppercase text-4xl py-1.5 transition-colors',
                        isActive(entry.path) ? 'text-primary' : 'text-foreground hover:text-primary'
                      )}
                    >
                      {entry.label}
                    </Link>
                  </motion.div>
                )
              )}
            </motion.nav>

            <div className="px-6 py-6 border-t border-primary/15 flex flex-col gap-3">
              {!isAuthenticated ? (
                <Link to="/login" onClick={closeMenu} className="w-full">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wide min-h-[48px]">
                    Espace Admin
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/admin" onClick={closeMenu} className="w-full">
                    <Button variant="outline" className="w-full gap-2 border-primary/30 min-h-[48px]">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Button>
                  </Link>
                  <Button onClick={() => { logout(); closeMenu(); }} className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold min-h-[48px]">
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </Button>
                </>
              )}
              <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground pt-2">
                <span className="text-primary">I</span>nstinct · <span className="text-primary">D</span>iscipline · <span className="text-primary">P</span>récision
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
