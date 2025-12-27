import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaGoogle } from 'react-icons/fa';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/common/ToastContainer';
import { validateForm } from '../utils/validation';

export const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData, {
      email: {
        required: true,
        email: true,
        requiredMessage: 'Email is required',
        emailMessage: 'Please enter a valid email address',
      },
      password: {
        required: true,
        requiredMessage: 'Password is required',
        minLength: 6,
        minLengthMessage: 'Password must be at least 6 characters',
      },
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock login - in real app, this would authenticate with backend
      login({
        email: formData.email,
        role: 'client',
        name: formData.email.split('@')[0],
      });
      
      toast.success('Signed in successfully!');
      navigate('/dashboard');
    } catch {
      toast.error('Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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
              ACCESS TERMINAL
            </h1>
            <p className="text-white/80 font-mono uppercase tracking-[0.2em] text-sm">
              AUTHENTICATION REQUIRED
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              className="flex-1 py-3 px-4 bg-dark-surface border-2 border-primary-blue text-white font-mono uppercase tracking-wider text-sm font-semibold"
            >
              SIGN IN
            </button>
            <Link
              to="/register"
              className="flex-1 py-3 px-4 bg-dark-bg border border-primary-blue/20 text-gray-400 font-mono uppercase tracking-wider text-sm text-center hover:border-primary-blue/40 transition-colors"
            >
              REGISTER
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-white font-mono uppercase tracking-wider text-xs mb-2">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="operator@mission.control"
                className={`w-full px-4 py-3 bg-dark-bg border rounded-lg text-white placeholder-gray-500 font-mono tracking-wide focus:outline-none focus:ring-1 ${
                  errors.email
                    ? 'border-primary-red focus:border-primary-red focus:ring-primary-red'
                    : 'border-primary-blue/30 focus:border-primary-blue focus:ring-primary-blue'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-primary-red font-mono">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-white font-mono uppercase tracking-wider text-xs mb-2">
                ACCESS CODE
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                placeholder="........"
                className={`w-full px-4 py-3 bg-dark-bg border rounded-lg text-white placeholder-gray-500 font-mono tracking-wide focus:outline-none focus:ring-1 ${
                  errors.password
                    ? 'border-primary-red focus:border-primary-red focus:ring-primary-red'
                    : 'border-primary-blue/30 focus:border-primary-blue focus:ring-primary-blue'
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-primary-red font-mono">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full font-mono uppercase tracking-wider text-lg py-4"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  AUTHENTICATING...
                </span>
              ) : (
                'INITIATE SESSION'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary-blue/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-dark-surface/80 text-white font-mono uppercase tracking-wider">
                  OR
                </span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-dark-bg border border-primary-blue/30 rounded-lg text-white font-mono uppercase tracking-wider hover:border-primary-blue transition-colors"
            >
              <FaGoogle className="text-lg" />
              CONTINUE WITH GOOGLE
            </button>
          </form>
        </div>
      </Container>
    </div>
  );
};
