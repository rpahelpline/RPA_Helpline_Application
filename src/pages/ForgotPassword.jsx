import { useState, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Lock, CheckCircle, Loader2, User, Building2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { OTPVerification } from '../components/otp/OTPVerification';
import { sendEmailOTP, syncVerificationStatus } from '../services/supabaseAuth';
import { authApi, tokenManager } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured } from '../config/supabase';
import { Container } from '../components/layout/Container';

export const ForgotPassword = memo(() => {
  const [step, setStep] = useState('email'); // 'email', 'verify', 'reset', 'profile'
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [emailOTPLoading, setEmailOTPLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileData, setProfileData] = useState({
    full_name: '',
    user_type: '',
    phone: '',
    company_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const navigate = useNavigate();

  const handleSendEmailOTP = async () => {
    if (!email) {
      toast.error('Email is required');
      return;
    }

    if (!isSupabaseConfigured) {
      toast.error('Email verification is not configured');
      return;
    }

    setEmailOTPLoading(true);
    try {
      await sendEmailOTP(email);
      setShowEmailOTP(true);
      toast.success('OTP sent! Check your email for the verification code');
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setEmailOTPLoading(false);
    }
  };

  const handleEmailVerified = async () => {
    setEmailVerified(true);
    setShowEmailOTP(false);
    await syncVerificationStatus('email', email);
    toast.success('Email verified successfully!');
    setStep('reset');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!password) {
      setErrors({ password: 'Password is required' });
      return;
    }
    if (password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword(email, password, null, profileData);
      
      if (response.requiresProfileDetails || (error?.data?.requiresProfileDetails)) {
        // Profile doesn't exist, need to collect details
        setStep('profile');
        toast.info('Please provide your profile details to complete account setup');
        return;
      }
      
      if (response.token && response.refreshToken) {
        // Auto-login after password reset
        tokenManager.setTokens(response.token, response.refreshToken);
        
        // Update auth store - refresh user data
        const authStore = useAuthStore.getState();
        if (authStore.refreshUser) {
          await authStore.refreshUser();
        } else {
          // Fallback: initialize auth to load user
          await authStore.initialize();
        }
        
        toast.success('Password reset successfully! You have been logged in.');
        navigate('/dashboard');
      } else {
        toast.success('Password reset successfully! Please log in with your new password.');
        navigate('/sign-in');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.data?.requiresProfileDetails || error.requiresProfileDetails) {
        // Profile doesn't exist, need to collect details
        setStep('profile');
        toast.info('Please provide your profile details to complete account setup');
      } else {
        toast.error(error.error || error.message || 'Failed to reset password');
        setErrors({ general: error.error || error.message || 'Failed to reset password' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!profileData.full_name) {
      setErrors({ full_name: 'Full name is required' });
      return;
    }
    if (!profileData.user_type) {
      setErrors({ user_type: 'User type is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword(email, password, null, profileData);
      
      if (response.token && response.refreshToken) {
        // Auto-login after profile creation
        tokenManager.setTokens(response.token, response.refreshToken);
        
        // Update auth store
        const authStore = useAuthStore.getState();
        if (authStore.refreshUser) {
          await authStore.refreshUser();
        } else {
          await authStore.initialize();
        }
        
        toast.success('Account created successfully! You have been logged in.');
        navigate('/profile-setup');
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      toast.error(error.error || error.message || 'Failed to create profile');
      setErrors({ general: error.error || error.message || 'Failed to create profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <Container>
        <div className="max-w-md mx-auto">
          {/* Back Link */}
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-2 text-muted-foreground font-mono uppercase tracking-wider text-xs mb-4 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK TO SIGN IN
          </Link>

          <Card className="tech-panel border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Forgot Password
              </CardTitle>
              <CardDescription>
                {step === 'email' && 'Enter your email address to receive a verification code'}
                {step === 'verify' && 'Verify your email address to continue'}
                {step === 'reset' && 'Set a new password for your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'email' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      EMAIL ADDRESS
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="your@email.com"
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>

                  <Button
                    onClick={handleSendEmailOTP}
                    disabled={emailOTPLoading || !email || !isSupabaseConfigured}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {emailOTPLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </Button>

                  {showEmailOTP && (
                    <OTPVerification
                      type="email"
                      identifier={email}
                      onVerified={handleEmailVerified}
                      onCancel={() => setShowEmailOTP(false)}
                    />
                  )}
                </div>
              )}

              {step === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      NEW PASSWORD
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder="Enter new password (min 8 characters)"
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      CONFIRM PASSWORD
                    </Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="Confirm new password"
                      className={errors.confirmPassword ? 'border-destructive' : ''}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                  </div>

                  {errors.general && (
                    <p className="text-red-500 text-sm">{errors.general}</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('email')}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !password || !confirmPassword}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {step === 'profile' && (
                <form onSubmit={handleCreateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      FULL NAME
                    </Label>
                    <Input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, full_name: e.target.value }));
                        if (errors.full_name) setErrors(prev => ({ ...prev, full_name: '' }));
                      }}
                      placeholder="Enter your full name"
                      className={errors.full_name ? 'border-destructive' : ''}
                    />
                    {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      USER TYPE
                    </Label>
                    <select
                      value={profileData.user_type}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, user_type: e.target.value }));
                        if (errors.user_type) setErrors(prev => ({ ...prev, user_type: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-background border rounded-lg text-foreground text-sm ${
                        errors.user_type ? 'border-destructive' : 'border-border'
                      }`}
                    >
                      <option value="">Select user type</option>
                      <option value="freelancer">RPA Freelancer</option>
                      <option value="job_seeker">Job Seeker</option>
                      <option value="trainer">Trainer</option>
                      <option value="ba_pm">BA/PM</option>
                      <option value="client">Client</option>
                      <option value="employer">Employer</option>
                    </select>
                    {errors.user_type && <p className="text-red-500 text-sm">{errors.user_type}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      PHONE NUMBER (Optional)
                    </Label>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>

                  {(profileData.user_type === 'client' || profileData.user_type === 'employer') && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        COMPANY NAME (Optional)
                      </Label>
                      <Input
                        type="text"
                        value={profileData.company_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company_name: e.target.value }))}
                        placeholder="Enter company name"
                      />
                    </div>
                  )}

                  {errors.general && (
                    <p className="text-red-500 text-sm">{errors.general}</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('reset')}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !profileData.full_name || !profileData.user_type}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Profile'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
});

ForgotPassword.displayName = 'ForgotPassword';

