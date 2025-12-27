import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { addMockData } from '../../mock/data';

export const RegisterClient = () => {
  const navigate = useNavigate();
  const { login, setRole } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const clientData = {
      name: formData.name,
      email: formData.email,
      company: formData.company,
      role: 'client',
    };
    
    const userData = addMockData('users', clientData);
    login({ ...userData, role: 'client' });
    setRole('client');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] mt-16 flex items-center justify-center bg-dark-bg bg-starfield py-12">
      <Container className="w-full max-w-2xl">
        {/* Return to Base Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white font-mono uppercase tracking-wider text-sm mb-8 hover:text-primary-blue transition-colors"
        >
          <FaArrowLeft className="text-xs" />
          RETURN TO BASE
        </Link>

        {/* Access Terminal Card */}
        <div className="bg-dark-surface/80 backdrop-blur-sm border border-primary-blue/30 rounded-lg p-8 sm:p-10 shadow-[0_0_30px_rgba(77,166,255,0.1)]">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-black text-white font-display uppercase tracking-tight mb-2">
              CLIENT REGISTRATION
            </h1>
            <p className="text-white/80 font-mono uppercase tracking-[0.2em] text-sm">
              EMPLOYER / CLIENT ACCESS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-white font-mono uppercase tracking-wider text-xs mb-2">
                  OPERATOR NAME
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-dark-bg border border-primary-blue/30 rounded-lg text-white placeholder-gray-500 font-mono tracking-wide focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div>
                <label className="block text-white font-mono uppercase tracking-wider text-xs mb-2">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="operator@mission.control"
                  className="w-full px-4 py-3 bg-dark-bg border border-primary-blue/30 rounded-lg text-white placeholder-gray-500 font-mono tracking-wide focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
                />
              </div>

              <div>
                <label className="block text-white font-mono uppercase tracking-wider text-xs mb-2">
                  COMPANY NAME
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company Inc"
                  className="w-full px-4 py-3 bg-dark-bg border border-primary-blue/30 rounded-lg text-white placeholder-gray-500 font-mono tracking-wide focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1 font-mono uppercase tracking-wider"
              >
                CREATE ACCOUNT
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/')}
                className="font-mono uppercase tracking-wider"
              >
                CANCEL
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
};

