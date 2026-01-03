import { useState, memo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Building2 } from 'lucide-react';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { authApi } from '../../services/api';

export const RegisterClient = memo(() => {
  const navigate = useNavigate();
  const { register, setRole } = useAuthStore();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const result = await register({
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
        user_type: 'client',
        company_name: formData.company,
      });

      if (result.success) {
        setRole('client');
        toast.success('Account created successfully!');
        navigate('/profile-setup');
      } else {
        // Handle rate limiting
        if (result.status === 429) {
          toast.error('Too many registration attempts. Please wait a moment before trying again.');
          setErrors({ email: 'Rate limit exceeded. Please wait before trying again.' });
        } else {
          toast.error(result.error || 'Registration failed');
          setErrors({ email: result.error || 'Registration failed' });
        }
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.message || error.error || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      setErrors({ email: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [formData, register, setRole, navigate, toast]);

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <Container className="w-full max-w-md">
        {/* Return to Base Link */}
        <Link 
          to="/register" 
          className="inline-flex items-center gap-1.5 text-foreground font-mono uppercase tracking-wider text-xs mb-3 hover:text-secondary transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          BACK
        </Link>

        {/* Access Terminal Card */}
        <div className="tech-panel-strong rounded-xl p-5 sm:p-6 border-glow-blue">
          {/* Title */}
          <div className="text-center mb-5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground font-display uppercase tracking-tight mb-1">
              CLIENT <span className="text-primary">REGISTRATION</span>
            </h1>
            <p className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
              EMPLOYER / CLIENT ACCESS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                  <User className="h-3 w-3 text-secondary" />
                  NAME
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm placeholder-muted-foreground font-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30"
                />
              </div>

              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-secondary" />
                  EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@company.com"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm placeholder-muted-foreground font-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30"
                />
              </div>

              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-secondary" />
                  COMPANY
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company Inc"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm placeholder-muted-foreground font-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30"
                />
              </div>

              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-secondary" />
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm placeholder-muted-foreground font-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30"
                />
              </div>
            </div>
            
            {errors.email && (
              <div className="text-destructive text-xs font-mono">{errors.email}</div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/register')}
                className="font-display uppercase tracking-wider text-xs"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading}
                className="flex-1 font-display uppercase tracking-wider text-xs glow-red"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    CREATING...
                  </>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
});

RegisterClient.displayName = 'RegisterClient';

