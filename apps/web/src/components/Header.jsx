
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { LogOut, LayoutDashboard, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Accueil' },
    { path: '/effectif', label: 'Effectif' },
    { path: '/composition', label: 'Composition' },
    { path: '/competition', label: 'Compétition' },
    { path: '/historique', label: 'Historique' },
    { path: '/stats-joueurs', label: 'Stats Joueurs' },
    { path: '/stats-equipe', label: 'Stats Équipe' },
    { path: '/palmares', label: 'Palmarès' },
    { path: '/media', label: 'Média' }
  ];

  const isActive = (path) => location.pathname === path;

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg border-b-4 border-accent transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img 
              src="/logo.png" 
              alt="FC25 Esport Logo" 
              className="h-10 md:h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 min-h-[44px] flex items-center",
                  isActive(link.path)
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {!isAuthenticated ? (
              <Link to="/login">
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 border-none font-bold min-h-[44px]"
                >
                  Admin Login
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/admin">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground bg-transparent min-h-[44px]"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={logout}
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-bold min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="lg:hidden flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 min-h-[44px] min-w-[44px]">
                  <Menu className="w-6 h-6" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background text-foreground border-l-border p-0 flex flex-col">
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <img 
                    src="/logo.png" 
                    alt="FC25 Esport Logo" 
                    className="h-10 w-auto object-contain brightness-0 dark:invert"
                  />
                </div>
                <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={closeMenu}
                      className={cn(
                        "px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 min-h-[44px] flex items-center",
                        isActive(link.path)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="p-4 border-t border-border flex flex-col gap-3">
                  {!isAuthenticated ? (
                    <Link to="/login" onClick={closeMenu} className="w-full">
                      <Button 
                        variant="default" 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold min-h-[44px]"
                      >
                        Admin Login
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/admin" onClick={closeMenu} className="w-full">
                        <Button 
                          variant="outline" 
                          className="w-full gap-2 min-h-[44px]"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        onClick={() => { logout(); closeMenu(); }}
                        className="w-full gap-2 min-h-[44px]"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
