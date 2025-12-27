import { Link } from 'react-router-dom';
import { Container } from './Container';

export const Footer = () => {
  return (
    <footer className="bg-dark-surface/80 backdrop-blur-sm border-t border-dark-border mt-auto">
      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-black text-lg mb-4 font-display uppercase">RPA HELPLINE</h3>
            <p className="text-gray-300 font-mono text-sm">
              Connecting businesses with elite RPA talent for mission-critical automation.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-black mb-4 font-display uppercase text-sm">SERVICES</h4>
            <ul className="space-y-2 text-gray-300 font-mono text-sm">
              <li><Link to="/register/developer" className="hover:text-primary-blue transition-colors uppercase tracking-wider">HIRE DEVELOPERS</Link></li>
              <li><Link to="/register/freelancer" className="hover:text-primary-blue transition-colors uppercase tracking-wider">FIND FREELANCERS</Link></li>
              <li><Link to="/register/trainer" className="hover:text-primary-blue transition-colors uppercase tracking-wider">TRAINING PROGRAMS</Link></li>
              <li><Link to="/register/project" className="hover:text-primary-blue transition-colors uppercase tracking-wider">POST PROJECT</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-black mb-4 font-display uppercase text-sm">RESOURCES</h4>
            <ul className="space-y-2 text-gray-300 font-mono text-sm">
              <li><Link to="/how-it-works" className="hover:text-primary-blue transition-colors uppercase tracking-wider">HOW IT WORKS</Link></li>
              <li><Link to="/projects" className="hover:text-primary-blue transition-colors uppercase tracking-wider">BROWSE PROJECTS</Link></li>
              <li><a href="#" className="hover:text-primary-blue transition-colors uppercase tracking-wider">BLOG</a></li>
              <li><a href="#" className="hover:text-primary-blue transition-colors uppercase tracking-wider">SUPPORT</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-black mb-4 font-display uppercase text-sm">COMPANY</h4>
            <ul className="space-y-2 text-gray-300 font-mono text-sm">
              <li><a href="#" className="hover:text-primary-blue transition-colors uppercase tracking-wider">ABOUT</a></li>
              <li><a href="#" className="hover:text-primary-blue transition-colors uppercase tracking-wider">CONTACT</a></li>
              <li><a href="#" className="hover:text-primary-blue transition-colors uppercase tracking-wider">PRIVACY</a></li>
              <li><a href="#" className="hover:text-primary-blue transition-colors uppercase tracking-wider">TERMS</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-dark-border pt-8 pb-6 text-center text-gray-300 text-sm font-mono uppercase tracking-wider">
          <p>&copy; 2024 RPA HELPLINE. ALL RIGHTS RESERVED.</p>
        </div>
      </Container>
    </footer>
  );
};

