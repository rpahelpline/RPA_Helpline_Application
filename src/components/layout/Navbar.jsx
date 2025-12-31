import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaRocket, FaBars, FaTimes, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { Button } from '../ui/Button';
import { Container } from './Container';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

export const Navbar = memo(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { toast } = useToast();

  const navLinks = useMemo(() => [
    { to: '/', label: 'SERVICES' },
    { to: '/projects', label: 'PROJECTS' },
    { to: '/how-it-works', label: 'HOW IT WORKS' },
  ], []);

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
    <nav className="bg-dark-surface/80 backdrop-blur-sm border-b border-dark-border fixed top-0 left-0 right-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-accent-yellow flex items-center justify-center flex-shrink-0">
              <FaRocket className="text-dark-bg text-xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white uppercase tracking-wide leading-tight">RPA HELPLINE</span>
              <span className="text-xs text-gray-400 uppercase leading-tight">ROBOTIC PROCESS AUTOMATION</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-white hover:text-primary-blue transition-colors text-sm font-mono uppercase tracking-wider"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-white text-sm font-mono uppercase tracking-wider hover:text-primary-blue transition-colors"
                >
                  DASHBOARD
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-white hover:text-primary-blue transition-colors"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                      <FaUser className="text-sm" />
                    </div>
                    <span className="text-sm font-mono uppercase tracking-wider">
                      {user?.name || user?.email?.split('@')[0] || 'USER'}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-surface border border-dark-border rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-white hover:bg-dark-bg transition-colors"
                        >
                          <FaCog className="mr-2 text-sm" />
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-white hover:bg-dark-bg transition-colors"
                        >
                          <FaSignOutAlt className="mr-2 text-sm" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
            <Link
              to="/sign-in"
              className="text-white text-sm font-mono uppercase tracking-wider hover:text-primary-blue transition-colors"
            >
              SIGN IN
            </Link>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/register/client')}
              className="font-mono uppercase tracking-wider"
            >
              LAUNCH MISSION
            </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-primary-blue transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <FaTimes className="text-xl" />
            ) : (
              <FaBars className="text-xl" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-border">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-gray-300 hover:text-primary-blue transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-300 hover:text-primary-blue transition-colors"
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
                    <FaSignOutAlt className="mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  navigate('/register/client');
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-2"
              >
                <FaRocket className="mr-2" />
                Launch Mission
              </Button>
              )}
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
});

Navbar.displayName = 'Navbar';

