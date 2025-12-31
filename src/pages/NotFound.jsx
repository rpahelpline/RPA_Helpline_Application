import { Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { FaRocket, FaHome } from 'react-icons/fa';

export const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] mt-16 flex items-center justify-center bg-dark-bg bg-starfield">
      <Container className="text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-primary-red text-8xl mb-4 flex justify-center">
            <FaRocket className="animate-pulse" />
          </div>
          <h1 className="text-6xl font-black text-white mb-4 font-display uppercase tracking-tight">
            404
          </h1>
          <h2 className="text-3xl font-bold text-white mb-4 font-display uppercase">
            MISSION NOT FOUND
          </h2>
          <p className="text-gray-400 mb-8 font-mono text-lg">
            The page you're looking for has been moved, deleted, or never existed.
            <br />
            Return to base and continue your mission.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button variant="primary" size="lg" className="font-mono uppercase tracking-wider">
                <FaHome className="mr-2" />
                RETURN TO BASE
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.history.back()}
              className="font-mono uppercase tracking-wider"
            >
              GO BACK
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};


