
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-200 border-t-4 border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="space-y-4 lg:col-span-2">
            <Link to="/" className="inline-block hover:opacity-90 transition-opacity min-h-[44px] flex items-center">
              <img 
                src="/logo.png" 
                alt="FC25 Esport Logo" 
                className="h-12 md:h-16 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-sm text-slate-400 max-w-xs">
              Unité. Passion. Performance. La référence de l'esport compétitif FC25.
            </p>
          </div>

          <div>
            <span className="font-bold text-white mb-4 block">Liens rapides</span>
            <div className="space-y-2">
              <Link to="/effectif" className="flex items-center min-h-[44px] text-sm text-slate-400 hover:text-accent transition-all duration-200">
                Effectif
              </Link>
              <Link to="/competition" className="flex items-center min-h-[44px] text-sm text-slate-400 hover:text-accent transition-all duration-200">
                Compétitions
              </Link>
              <Link to="/palmares" className="flex items-center min-h-[44px] text-sm text-slate-400 hover:text-accent transition-all duration-200">
                Palmarès
              </Link>
            </div>
          </div>

          <div>
            <span className="font-bold text-white mb-4 block">Suivez-nous</span>
            <div className="flex flex-wrap gap-4">
              <a href="#" aria-label="Twitter" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Facebook" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Youtube" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 md:mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-sm text-slate-500">
            © 2026 FC25 Esport. Tous droits réservés.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <Link to="#" className="text-slate-500 hover:text-slate-300 transition-colors min-h-[44px] flex items-center">
              Politique de confidentialité
            </Link>
            <Link to="#" className="text-slate-500 hover:text-slate-300 transition-colors min-h-[44px] flex items-center">
              Conditions d'utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
