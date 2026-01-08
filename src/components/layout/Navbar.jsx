import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Rocket, Menu, X, User, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import { Container } from './Container';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

export const Navbar = memo(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { toast } = useToast();

  const navLinks = useMemo(() => [
    { to: '/', label: 'SERVICES' },
    { to: '/projects', label: 'PROJECTS' },
    { to: '/jobs', label: 'JOBS' },
    { to: '/how-it-works', label: 'HOW IT WORKS' },
  ], []);

  // Track scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setUserMenuOpen(false);
  }, [logout, toast, navigate]);

  return (
    <nav 
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300 ease-out
        ${scrolled ? 'tech-panel shadow-lg shadow-black/10' : 'bg-transparent'}
      `}
      style={{
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <Rocket className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground tracking-wider transition-colors duration-200 group-hover:text-primary">
              RPA HELPLINE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    px-4 py-2 rounded-lg
                    text-xs font-display tracking-widest
                    transition-all duration-200 ease-out
                    ${isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher />
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-muted-foreground hover:text-foreground font-display text-xs tracking-wider transition-colors duration-200"
                >
                  DASHBOARD
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-foreground hover:text-secondary transition-colors duration-200"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-105">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-display uppercase tracking-wider">
                      {user?.name || user?.email?.split('@')[0] || 'USER'}
                    </span>
                  </button>
                  
                  {/* User dropdown with smooth animation */}
                  <div 
                    className={`
                      absolute right-0 mt-2 w-48 tech-panel rounded-lg shadow-xl z-50 border border-border
                      transition-all duration-200 ease-out origin-top-right
                      ${userMenuOpen 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                      }
                    `}
                  >
                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-foreground hover:bg-muted/50 transition-colors duration-150"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-foreground hover:bg-muted/50 transition-colors duration-150"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-display text-xs tracking-wider">
                    SIGN IN
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/register/client')}
                  className="font-display text-xs tracking-wider glow-red"
                >
                  LAUNCH MISSION
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeSwitcher />
            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-muted/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6">
                <Menu 
                  className={`
                    h-6 w-6 absolute inset-0
                    transition-all duration-200
                    ${mobileMenuOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
                  `} 
                />
                <X 
                  className={`
                    h-6 w-6 absolute inset-0
                    transition-all duration-200
                    ${mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
                  `} 
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation with smooth animation */}
        <div 
          className={`
            md:hidden overflow-hidden
            transition-all duration-300 ease-out
            ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="py-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link, index) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`
                      px-4 py-3 rounded-lg
                      font-display text-xs tracking-wider
                      transition-all duration-200
                      ${isActive 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }
                    `}
                    style={{
                      transitionDelay: `${index * 50}ms`,
                      transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-10px)',
                      opacity: mobileMenuOpen ? 1 : 0,
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors duration-200 font-display text-xs tracking-wider"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    DASHBOARD
                  </Link>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full mt-2"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <div className="pt-2 space-y-2">
                  <Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" className="w-full">
                      SIGN IN
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      navigate('/register/client');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full glow-red"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Launch Mission
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </nav>
  );
});

Navbar.displayName = 'Navbar';
