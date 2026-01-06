import { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';

// ============================================================================
// COMPACT INPUT FIELD COMPONENT
// ============================================================================
const InputField = memo(({ 
  label, 
  icon: Icon, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  error, 
  showPasswordToggle = false,
  autoComplete
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="relative">
      <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-secondary" />
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full px-3 py-2 bg-background/80 border rounded-lg text-foreground text-sm placeholder-muted-foreground/50 font-mono transition-all duration-200 focus:outline-none ${
            error
              ? 'border-destructive focus:border-destructive'
              : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/30'
          }`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <div className="mt-1 flex items-center gap-1 text-destructive text-[10px] font-mono">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
});
InputField.displayName = 'InputField';

// ============================================================================
// MAIN SIGN IN COMPONENT
// ============================================================================
export const SignIn = memo(() => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, getOAuthStatus, isAuthenticated, isLoading } = useAuthStore();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  
  // Check OAuth availability
  const oAuthStatus = getOAuthStatus();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    // Wait for auth initialization to complete
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Handle input changes
  const handleInputChange = useCallback((field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success('Signed in successfully!');
        navigate('/dashboard');
      } else {
        // Handle rate limiting
        if (result.status === 429) {
          toast.error('Too many login attempts. Please wait a moment before trying again.');
          setErrors({ email: 'Rate limit exceeded. Please wait before trying again.' });
        } else {
          toast.error(result.error || 'Login failed');
          setErrors({ 
            email: result.error?.includes('email') || result.error?.includes('Email') ? result.error : '',
            password: result.error?.includes('password') || result.error?.includes('Password') ? result.error : result.error || 'Invalid credentials'
          });
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      // Handle rate limiting
      if (error.status === 429) {
        const retryAfter = error.data?.retryAfter || 60;
        toast.error(`Too many requests. Please wait ${retryAfter} seconds before trying again.`);
        setErrors({ 
          email: `Rate limit exceeded. Please wait ${retryAfter} seconds.`
        });
      } else {
        const errorMessage = error.message || error.error || 'Login failed. Please try again.';
        toast.error(errorMessage);
        setErrors({
          email: errorMessage.includes('email') || errorMessage.includes('Email') ? errorMessage : '',
          password: errorMessage.includes('password') || errorMessage.includes('Password') ? errorMessage : errorMessage || 'Invalid credentials'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [formData, login, navigate, toast]);

  // Handle Google Sign-In
  const handleGoogleSignIn = useCallback(async () => {
    setSocialLoading('google');
    
    try {
      const result = await loginWithGoogle();
      
      if (result.cancelled) {
        setSocialLoading(null);
        return;
      }
      
      if (result.success) {
        toast.success('Signed in with Google successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        if (!result.cancelled) {
          toast.error(result.error || 'Google sign-in failed');
        }
        setSocialLoading(null);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Google sign-in failed. Please try again.');
      setSocialLoading(null);
    }
  }, [loginWithGoogle, navigate, toast]);


  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // Don't render sign-in form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5" />
      
      <div className="w-full max-w-2xl relative">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-muted-foreground font-mono uppercase tracking-wider text-xs mb-3 hover:text-secondary transition-colors group"
        >
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
          BACK
        </Link>

        {/* Main Card */}
        <div className="tech-panel-strong rounded-xl p-4 sm:p-6 border-glow-blue relative overflow-hidden max-h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          
          <div className="relative">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 tech-panel rounded-full mb-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-mono text-primary tracking-wider">AUTHENTICATION REQUIRED</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground uppercase tracking-wider mb-1">
                SIGN <span className="text-primary">IN</span>
              </h1>
              
              <p className="text-muted-foreground text-xs max-w-md mx-auto">
                Access your account to continue your RPA journey
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                className="flex-1 py-2 px-3 tech-panel border border-primary text-foreground font-mono uppercase tracking-wider text-xs font-semibold rounded-lg bg-primary/10"
              >
                SIGN IN
              </button>
              <Link
                to="/register"
                className="flex-1 py-2 px-3 tech-panel border border-transparent text-muted-foreground font-mono uppercase tracking-wider text-xs text-center hover:border-secondary hover:text-secondary transition-all rounded-lg"
              >
                REGISTER
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Form Fields */}
              <InputField
                label="EMAIL"
                icon={Mail}
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="you@example.com"
                error={errors.email}
                autoComplete="email"
              />
              
              <InputField
                label="PASSWORD"
                icon={Lock}
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="Enter your password"
                error={errors.password}
                showPasswordToggle
                autoComplete="current-password"
              />
              
              <div className="flex justify-end mt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Action Button */}
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="w-full font-display uppercase tracking-wider text-xs glow-red group mt-4"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1" />
                    SIGNING IN...
                  </>
                ) : (
                  <>
                    SIGN IN
                    <ArrowLeft className="ml-1 h-3 w-3 group-hover:-translate-x-0.5 transition-transform rotate-180" />
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-card text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
                    OR
                  </span>
                </div>
              </div>

              {/* Social Login - Google Only */}
              {oAuthStatus?.google && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || socialLoading !== null}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 tech-panel border border-border rounded-lg text-foreground font-mono text-xs hover:border-secondary hover:bg-secondary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {socialLoading === 'google' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  <span>{socialLoading === 'google' ? 'Signing in...' : 'Continue with Google'}</span>
                </button>
              )}
            </form>

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SignIn.displayName = 'SignIn';
