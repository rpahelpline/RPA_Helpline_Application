import { useEffect, useState, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { CheckCircle, XCircle, Github } from 'lucide-react';

export const GitHubCallback = memo(() => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGitHubCallback, setRole } = useAuthStore();
  const { toast } = useToast();
  
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for error from GitHub
      if (errorParam) {
        setStatus('error');
        setError(errorDescription || errorParam);
        toast.error(`GitHub authentication failed: ${errorDescription || errorParam}`);
        return;
      }

      // Validate code and state
      if (!code || !state) {
        setStatus('error');
        setError('Invalid callback parameters');
        toast.error('Invalid callback from GitHub');
        return;
      }

      try {
        // Process the callback
        const result = await handleGitHubCallback(code, state);

        if (result.success) {
          // Check if we have a stored registration type
          const storedType = sessionStorage.getItem('register_selected_type');
          if (storedType) {
            const selectedType = JSON.parse(storedType);
            setRole(selectedType.id.startsWith('client') ? 'client' : selectedType.id);
            sessionStorage.removeItem('register_selected_type');
          }

          setStatus('success');
          toast.success('Successfully authenticated with GitHub!');
          
          // Redirect after showing success
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          setStatus('error');
          setError(result.error || 'Authentication failed');
          toast.error(result.error || 'GitHub authentication failed');
        }
      } catch (err) {
        console.error('GitHub callback error:', err);
        setStatus('error');
        setError(err.message || 'An unexpected error occurred');
        toast.error('GitHub authentication failed');
      }
    };

    processCallback();
  }, [searchParams, handleGitHubCallback, setRole, navigate, toast]);

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="mb-6">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted border border-border flex items-center justify-center animate-pulse">
                <Github className="w-8 h-8 text-foreground" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                Authenticating with GitHub...
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                Please wait while we verify your credentials
              </p>
              <LoadingSpinner size="lg" />
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                Authentication Successful!
              </h2>
              <p className="text-muted-foreground text-sm">
                Redirecting to your dashboard...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                Authentication Failed
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {error || 'An error occurred during authentication'}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/sign-in')}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-display text-sm hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg font-display text-sm hover:bg-muted/80 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

GitHubCallback.displayName = 'GitHubCallback';
export default GitHubCallback;



