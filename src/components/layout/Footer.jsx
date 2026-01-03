import { Link } from 'react-router-dom';
import { Container } from './Container';
import { Rocket } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="tech-panel mt-auto border-t border-border">
      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded flex items-center justify-center">
              <Rocket className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground tracking-wider">RPA HELPLINE</span>
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
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <div className="flex items-center gap-6 text-xs font-mono text-muted-foreground">
            <span>© 2024 RPA HELPLINE. All rights reserved.</span>
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

