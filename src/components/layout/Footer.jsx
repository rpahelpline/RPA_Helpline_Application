import { Link } from 'react-router-dom';
import { Container } from './Container';

export const Footer = () => {
  return (
    <footer className="tech-panel mt-auto border-t border-border">
      <Container>
        <div className="py-8 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="RPA Helpline Logo"
              className="w-10 h-10 md:w-12 md:h-12 rounded object-contain"
            />
            <span className="text-base md:text-lg font-display font-bold text-foreground tracking-wider">RPA HELPLINE</span>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs font-mono text-muted-foreground mb-2">COMMUNICATION CHANNEL</p>
            <a href="mailto:contact@rpahelpline.com" className="text-sm text-secondary hover:text-secondary/80 transition-colors">
              contact@rpahelpline.com
            </a>
          </div>
          <div className="text-center md:text-right">
            <p className="text-xs font-mono text-muted-foreground mb-2">DIRECT LINE</p>
            <a href="tel:+919490030441" className="text-sm text-secondary hover:text-secondary/80 transition-colors">
              +91 9490030441
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 md:pt-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-xs font-mono text-muted-foreground">
            <span>© 2025 RPA HELPLINE</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground">ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};

