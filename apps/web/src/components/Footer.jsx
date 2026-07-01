
import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube } from 'lucide-react';

const TikTokIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const DiscordIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.198.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="hex-panel text-slate-200 border-t-2 border-primary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="space-y-4 lg:col-span-2">
            <Link to="/" className="inline-block hover:opacity-90 transition-opacity min-h-[44px] flex items-center">
              <img
                src="/logo.webp"
                alt="KOTIYA FC"
                loading="lazy"
                className="h-12 md:h-16 w-auto object-contain"
              />
            </Link>
            <p className="font-display text-3xl md:text-4xl uppercase tracking-[0.12em] text-white">
              <span className="text-primary">I</span>nstinct · <span className="text-primary">D</span>iscipline · <span className="text-primary">P</span>récision
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
              <Link to="/proclubs" className="flex items-center min-h-[44px] text-sm text-slate-400 hover:text-accent transition-all duration-200">
                Pro Clubs
              </Link>
              <Link to="/soutien" className="flex items-center min-h-[44px] text-sm text-slate-400 hover:text-accent transition-all duration-200">
                Soutenir le club
              </Link>
            </div>
          </div>

          <div>
            <span className="font-bold text-white mb-4 block">Suivez-nous</span>
            <div className="flex flex-wrap gap-4">
              <a href="#" aria-label="TikTok" title="Lien à venir" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300">
                <TikTokIcon className="w-5 h-5" />
              </a>
              <a href="#" aria-label="YouTube" title="Lien à venir" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://discord.gg/Kyk8PX8WqJ" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300">
                <DiscordIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 md:mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-sm text-slate-500">
            © 2026 KOTIYA FC. Tous droits réservés.
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
