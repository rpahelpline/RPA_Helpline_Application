import { useState, memo } from 'react';
import { Mail, Lock, CheckCircle, Loader2, ArrowLeft, User, Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { OTPVerification } from '../otp/OTPVerification';
import { sendEmailOTP, syncVerificationStatus } from '../../services/supabaseAuth';
import { authApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../../config/supabase';

export const AccountRecovery = memo(({ email, onCancel, onSuccess }) => {
  const [step, setStep] = useState('verify'); // 'verify', 'reset', or 'profile'
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
      
      if (response.requiresProfileDetails) {
        // Profile doesn't exist, need to collect details
        setStep('profile');
        toast.info('Please provide your profile details to complete account setup');
        return;
      }
      
      if (response.token && response.refreshToken) {
        // Auto-login after password reset
        const { tokenManager } = await import('../../services/api');
        tokenManager.setTokens(response.token, response.refreshToken);
        
        // Update auth store - refresh user data
        const { useAuthStore } = await import('../../store/authStore');
        const authStore = useAuthStore.getState();
        if (authStore.refreshUser) {
          await authStore.refreshUser();
        } else {
          // Fallback: initialize auth to load user
          await authStore.initialize();
        }
        
        toast.success('Password reset successfully! You have been logged in.');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.success('Password reset successfully! Please log in with your new password.');
        navigate('/sign-in');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.data?.requiresProfileDetails) {
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
        const { tokenManager } = await import('../../services/api');
        tokenManager.setTokens(response.token, response.refreshToken);
        
        // Update auth store
        const { useAuthStore } = await import('../../store/authStore');
        const authStore = useAuthStore.getState();
        if (authStore.refreshUser) {
          await authStore.refreshUser();
        } else {
          await authStore.initialize();
        }
        
        toast.success('Account created successfully! You have been logged in.');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/dashboard');
        }
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
    <Card className="tech-panel border-border bg-card/50 max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Account Recovery
        </CardTitle>
        <CardDescription>
          {step === 'verify' 
            ? 'Verify your email address to recover your account'
            : 'Set a new password for your account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'verify' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                EMAIL ADDRESS
                {emailVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="flex-1 bg-muted"
                />
                {!emailVerified && (
                  <Button
                    onClick={handleSendEmailOTP}
                    disabled={emailOTPLoading || !isSupabaseConfigured}
                    variant="outline"
                  >
                    {emailOTPLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                  </Button>
                )}
              </div>
              {showEmailOTP && !emailVerified && (
                <OTPVerification
                  type="email"
                  identifier={email}
                  onVerified={handleEmailVerified}
                  onCancel={() => setShowEmailOTP(false)}
                />
              )}
              {!emailVerified && !showEmailOTP && (
                <p className="text-amber-500 text-sm">
                  ⚠️ Please verify your email address to continue with account recovery.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
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
                onClick={() => setStep('verify')}
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
  );
});

AccountRecovery.displayName = 'AccountRecovery';

