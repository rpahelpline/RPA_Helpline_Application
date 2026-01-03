import { useState, memo, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Briefcase, GraduationCap, Building2, ArrowLeft, User, Lock, Mail,
  ArrowRight, Shield, CheckCircle, Code, Target, Eye, EyeOff,
  AlertCircle, Sparkles, Award, Globe
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { validateForm } from '../../utils/validation';

// ============================================================================
// COMPACT USER TYPE CARD COMPONENT
// ============================================================================
const UserTypeCard = memo(({ type, isSelected, onClick }) => {
  const Icon = type.icon;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group text-left p-3 border rounded-lg transition-all duration-200 overflow-hidden ${
        isSelected
          ? `${type.selectedBg} ${type.selectedBorder}`
          : 'border-border bg-card/50 hover:border-secondary/50'
      }`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div className="relative flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          isSelected ? type.iconBg : 'bg-muted border border-border'
        }`}>
          <Icon className={`w-5 h-5 ${isSelected ? type.iconColor : 'text-muted-foreground'}`} />
        </div>
        
        <div className="min-w-0 flex-1">
          <h3 className={`font-display text-sm font-bold tracking-wider mb-0.5 truncate ${
            isSelected ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            {type.label}
          </h3>
          <p className="text-[11px] text-muted-foreground/80 line-clamp-2">
            {type.description}
          </p>
        </div>
      </div>
    </button>
  );
});
UserTypeCard.displayName = 'UserTypeCard';

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
// COMPACT STEP INDICATOR COMPONENT
// ============================================================================
const StepIndicator = memo(({ currentStep, totalSteps = 2 }) => (
  <div className="flex items-center justify-center gap-2 mb-4">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div key={i} className="flex items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs transition-all duration-200 ${
          i < currentStep 
            ? 'bg-primary text-white' 
            : i === currentStep 
              ? 'bg-primary/20 text-primary border border-primary' 
              : 'bg-muted text-muted-foreground'
        }`}>
          {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
        </div>
        {i < totalSteps - 1 && (
          <div className={`w-10 h-0.5 mx-1.5 transition-colors duration-200 ${
            i < currentStep ? 'bg-primary' : 'bg-border'
          }`} />
        )}
      </div>
    ))}
  </div>
));
StepIndicator.displayName = 'StepIndicator';

// ============================================================================
// MAIN REGISTER COMPONENT
// ============================================================================
export const Register = memo(() => {
  const navigate = useNavigate();
  const { register, setRole, loginWithGoogle, loginWithGitHub, getOAuthStatus } = useAuthStore();
  const toast = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Check OAuth availability
  const oAuthStatus = getOAuthStatus();

  // User types configuration
  const userTypes = useMemo(() => [
    {
      id: 'freelancer',
      label: 'RPA FREELANCER',
      description: 'Offer your automation expertise on a project basis',
      icon: Code,
      benefits: ['Set your own rates', 'Choose your projects', 'Global clients', 'Flexible schedule'],
      gradient: 'bg-gradient-to-br from-primary/10 to-transparent',
      selectedBg: 'bg-primary/10',
      selectedBorder: 'border-primary shadow-primary/20',
      iconBg: 'bg-primary/20 border border-primary/30',
      iconColor: 'text-primary',
      route: '/register/freelancer',
    },
    {
      id: 'job_seeker',
      label: 'JOB SEEKER',
      description: 'Find full-time RPA positions at top companies',
      icon: Briefcase,
      benefits: ['Full-time roles', 'Benefits packages', 'Career growth', 'Top employers'],
      gradient: 'bg-gradient-to-br from-secondary/10 to-transparent',
      selectedBg: 'bg-secondary/10',
      selectedBorder: 'border-secondary shadow-secondary/20',
      iconBg: 'bg-secondary/20 border border-secondary/30',
      iconColor: 'text-secondary',
      route: '/register/job-seeker',
    },
    {
      id: 'trainer',
      label: 'RPA TRAINER',
      description: 'Share your expertise and train future professionals',
      icon: GraduationCap,
      benefits: ['Create courses', 'Passive income', 'Build reputation', 'Help others grow'],
      gradient: 'bg-gradient-to-br from-accent/10 to-transparent',
      selectedBg: 'bg-accent/10',
      selectedBorder: 'border-accent shadow-accent/20',
      iconBg: 'bg-accent/20 border border-accent/30',
      iconColor: 'text-accent',
      route: '/register/trainer',
    },
    {
      id: 'ba_pm',
      label: 'BA / PROJECT MANAGER',
      description: 'Lead automation initiatives and bridge business with tech',
      icon: Target,
      benefits: ['Strategic roles', 'Team leadership', 'High impact', 'Executive visibility'],
      gradient: 'bg-gradient-to-br from-nasa-gold/10 to-transparent',
      selectedBg: 'bg-nasa-gold/10',
      selectedBorder: 'border-nasa-gold shadow-nasa-gold/20',
      iconBg: 'bg-nasa-gold/20 border border-nasa-gold/30',
      iconColor: 'text-nasa-gold',
      route: '/register/developer',
    },
  ], []);

  const clientTypes = useMemo(() => [
    {
      id: 'client',
      label: 'HIRE DEVELOPER',
      description: 'Find expert RPA developers for your automation projects',
      icon: Code,
      benefits: ['500+ developers', 'Verified skills', 'Fast matching'],
      gradient: 'bg-gradient-to-br from-primary/10 to-transparent',
      selectedBg: 'bg-primary/10',
      selectedBorder: 'border-primary shadow-primary/20',
      iconBg: 'bg-primary/20 border border-primary/30',
      iconColor: 'text-primary',
      route: '/register/client',
    },
    {
      id: 'client_trainer',
      label: 'HIRE TRAINER',
      description: 'Get certified trainers for your team\'s RPA education',
      icon: GraduationCap,
      benefits: ['Expert trainers', 'Custom programs', 'Certification'],
      gradient: 'bg-gradient-to-br from-secondary/10 to-transparent',
      selectedBg: 'bg-secondary/10',
      selectedBorder: 'border-secondary shadow-secondary/20',
      iconBg: 'bg-secondary/20 border border-secondary/30',
      iconColor: 'text-secondary',
      route: '/register/client',
    },
    {
      id: 'client_ba',
      label: 'HIRE BA/PM',
      description: 'Strategic automation leaders for your initiatives',
      icon: Target,
      benefits: ['200+ analysts', 'Project managers', 'Consultants'],
      gradient: 'bg-gradient-to-br from-accent/10 to-transparent',
      selectedBg: 'bg-accent/10',
      selectedBorder: 'border-accent shadow-accent/20',
      iconBg: 'bg-accent/20 border border-accent/30',
      iconColor: 'text-accent',
      route: '/register/client',
    },
    {
      id: 'client_freelancer',
      label: 'HIRE FREELANCER',
      description: 'Flexible talent for short-term automation projects',
      icon: Users,
      benefits: ['300+ freelancers', 'Hourly or fixed', 'Quick start'],
      gradient: 'bg-gradient-to-br from-nasa-gold/10 to-transparent',
      selectedBg: 'bg-nasa-gold/10',
      selectedBorder: 'border-nasa-gold shadow-nasa-gold/20',
      iconBg: 'bg-nasa-gold/20 border border-nasa-gold/30',
      iconColor: 'text-nasa-gold',
      route: '/register/client',
    },
  ], []);

  // Registration category
  const [registrationCategory, setRegistrationCategory] = useState('opportunity'); // 'opportunity' or 'hiring'

  // Validate form
  const validateStep = useCallback(() => {
    if (currentStep === 0) {
      return selectedType !== null;
    }
    
    const validation = validateForm(formData, {
      name: { required: true, requiredMessage: 'Name is required' },
      email: { required: true, email: true, requiredMessage: 'Email is required', emailMessage: 'Invalid email' },
      password: { required: true, minLength: 8, requiredMessage: 'Password is required', minLengthMessage: 'Min 8 characters' },
      confirmPassword: { required: true, requiredMessage: 'Please confirm password' },
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return false;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return false;
    }

    return true;
  }, [currentStep, selectedType, formData, agreedToTerms, toast]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  }, [validateStep]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateStep()) return;
    
    setLoading(true);
    setErrors({});

    try {
      // Register with backend via store
      const userRole = selectedType.id.startsWith('client') ? 'client' : selectedType.id;
      
      const result = await register({
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
        user_type: userRole,
      });

      if (result.success) {
        setRole(userRole);
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
      // Show error to user
      console.error('Registration failed:', error);
      
      // Handle rate limiting
      if (error.status === 429) {
        const retryAfter = error.data?.retryAfter || 60;
        toast.error(`Too many requests. Please wait ${retryAfter} seconds before trying again.`);
        setErrors({ 
          email: `Rate limit exceeded. Please wait ${retryAfter} seconds.`
        });
      } else {
        const errorMessage = error.message || error.error || 'Registration failed. Please try again.';
        toast.error(errorMessage);
        setErrors({
          email: errorMessage.includes('email') || errorMessage.includes('Email') ? errorMessage : '',
          password: errorMessage.includes('password') || errorMessage.includes('Password') ? errorMessage : ''
        });
      }
    } finally {
      setLoading(false);
    }
  }, [formData, selectedType, register, setRole, navigate, toast, validateStep]);

  // Handle input changes
  const handleInputChange = useCallback((field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Handle Google Sign-Up
  const handleGoogleSignUp = useCallback(async () => {
    if (!selectedType) {
      toast.error('Please select your role first');
      return;
    }
    
    setSocialLoading('google');
    
    try {
      const result = await loginWithGoogle();
      
      if (result.cancelled) {
        setSocialLoading(null);
        return;
      }
      
      if (result.success) {
        // Set the user role
        setRole(selectedType.id.startsWith('client') ? 'client' : selectedType.id);
        
        toast.success('Signed up with Google successfully!');
        
        setTimeout(() => {
          navigate('/profile-setup');
        }, 1000);
      } else {
        if (!result.cancelled) {
          toast.error(result.error || 'Google sign-up failed');
        }
        setSocialLoading(null);
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      toast.error('Google sign-up failed. Please try again.');
      setSocialLoading(null);
    }
  }, [loginWithGoogle, navigate, toast, selectedType, setRole]);

  // Handle GitHub Sign-Up
  const handleGitHubSignUp = useCallback(async () => {
    if (!selectedType) {
      toast.error('Please select your role first');
      return;
    }
    
    setSocialLoading('github');
    
    try {
      const result = loginWithGitHub();
      
      if (result.redirecting) {
        // Real OAuth - will redirect
        // Store selected type for after redirect
        sessionStorage.setItem('register_selected_type', JSON.stringify(selectedType));
        toast.info('Redirecting to GitHub...');
      } else if (!result.success) {
        toast.error(result.error || 'GitHub sign-up failed');
        setSocialLoading(null);
      }
    } catch (error) {
      console.error('GitHub sign-up error:', error);
      toast.error('GitHub sign-up failed. Please try again.');
      setSocialLoading(null);
    }
  }, [loginWithGitHub, navigate, toast, selectedType, setRole]);

  // Get current types based on category
  const currentTypes = registrationCategory === 'opportunity' ? userTypes : clientTypes;

  return (
    <div className="h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5" />
      
      <div className="w-full max-w-4xl relative">
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
                <span className="text-[10px] font-mono text-primary tracking-wider">JOIN THE MISSION</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground uppercase tracking-wider mb-1">
                CREATE <span className="text-primary">ACCOUNT</span>
              </h1>
              
              <p className="text-muted-foreground text-xs max-w-md mx-auto">
                Join thousands of RPA professionals on the premier platform
              </p>
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <Link
                to="/sign-in"
                className="flex-1 py-2 px-3 tech-panel border border-transparent text-muted-foreground font-mono uppercase tracking-wider text-xs text-center hover:border-secondary hover:text-secondary transition-all rounded-lg"
              >
                SIGN IN
              </Link>
              <button
                className="flex-1 py-2 px-3 tech-panel border border-primary text-foreground font-mono uppercase tracking-wider text-xs font-semibold rounded-lg bg-primary/10"
              >
                REGISTER
              </button>
            </div>

            {/* Step Content */}
            {currentStep === 0 ? (
              <>
                {/* Category Selection */}
                <div className="flex justify-center gap-2 mb-4">
                  <button
                    onClick={() => {
                      setRegistrationCategory('opportunity');
                      setSelectedType(null);
                    }}
                    className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                      registrationCategory === 'opportunity'
                        ? 'bg-primary text-white'
                        : 'tech-panel text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Briefcase className="w-3 h-3 inline mr-1.5" />
                    Find Work
                  </button>
                  <button
                    onClick={() => {
                      setRegistrationCategory('hiring');
                      setSelectedType(null);
                    }}
                    className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                      registrationCategory === 'hiring'
                        ? 'bg-secondary text-white'
                        : 'tech-panel text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Building2 className="w-3 h-3 inline mr-1.5" />
                    Hire Talent
                  </button>
                </div>

                {/* Section Title */}
                <div className="text-center mb-3">
                  <h2 className="text-sm font-display font-bold text-foreground">
                    {registrationCategory === 'opportunity' ? 'SELECT YOUR ROLE' : 'WHO DO YOU NEED?'}
                  </h2>
                </div>

                {/* User Type Cards */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {currentTypes.map((type) => (
                    <UserTypeCard
                      key={type.id}
                      type={type}
                      isSelected={selectedType?.id === type.id}
                      onClick={() => setSelectedType(type)}
                    />
                  ))}
                </div>

                {/* Continue Button */}
                <Button
                  onClick={handleNext}
                  disabled={!selectedType}
                  size="default"
                  className="w-full font-display uppercase tracking-wider text-sm py-2.5 glow-red group"
                >
                  CONTINUE
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Selected Type Badge */}
                <div className="flex items-center justify-center mb-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${selectedType?.selectedBg} border ${selectedType?.selectedBorder}`}>
                    <selectedType.icon className={`w-3 h-3 ${selectedType?.iconColor}`} />
                    <span className="text-xs font-mono text-foreground">{selectedType?.label}</span>
                    <button 
                      type="button" 
                      onClick={() => setCurrentStep(0)}
                      className="ml-1 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="FULL NAME"
                    icon={User}
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    placeholder="John Doe"
                    error={errors.name}
                    autoComplete="name"
                  />
                  
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="PASSWORD"
                    icon={Lock}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    placeholder="Min 8 chars"
                    error={errors.password}
                    showPasswordToggle
                    autoComplete="new-password"
                  />
                  
                  <InputField
                    label="CONFIRM"
                    icon={Shield}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    placeholder="Repeat password"
                    error={errors.confirmPassword}
                    showPasswordToggle
                    autoComplete="new-password"
                  />
                </div>

                {/* Password Requirements - Compact */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
                  {[
                    { label: '8+ chars', valid: formData.password.length >= 8 },
                    { label: 'A-Z', valid: /[A-Z]/.test(formData.password) },
                    { label: 'a-z', valid: /[a-z]/.test(formData.password) },
                    { label: '0-9', valid: /\d/.test(formData.password) },
                  ].map((req, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px]">
                      <CheckCircle className={`w-2.5 h-2.5 ${req.valid ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                      <span className={req.valid ? 'text-green-500' : 'text-muted-foreground/50'}>{req.label}</span>
                    </div>
                  ))}
                </div>

                {/* Terms Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 border border-border rounded peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                      {agreedToTerms && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline">Terms</Link>
                    {' '}&{' '}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </span>
                </label>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(0)}
                    className="font-display uppercase tracking-wider text-xs"
                  >
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    BACK
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading}
                    className="flex-1 font-display uppercase tracking-wider text-xs glow-red group"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-1" />
                        CREATING...
                      </>
                    ) : (
                      <>
                        CREATE ACCOUNT
                        <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>

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

                {/* Social Login */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={loading || socialLoading !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2 tech-panel border border-border rounded-lg text-foreground font-mono text-xs hover:border-secondary hover:bg-secondary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <span>{socialLoading === 'google' ? 'Signing up...' : 'Google'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGitHubSignUp}
                    disabled={loading || socialLoading !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2 tech-panel border border-border rounded-lg text-foreground font-mono text-xs hover:border-secondary hover:bg-secondary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {socialLoading === 'github' ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )}
                    <span>{socialLoading === 'github' ? 'Signing up...' : 'GitHub'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link to="/sign-in" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Stats - Compact */}
        <div className="mt-3 flex items-center justify-center gap-4 text-muted-foreground text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-secondary" />
            <span><span className="text-secondary font-bold">500+</span> experts</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-secondary" />
            <span><span className="text-secondary font-bold">50+</span> countries</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-3 h-3 text-secondary" />
            <span><span className="text-secondary font-bold">99%</span> happy</span>
          </div>
        </div>
      </div>
    </div>
  );
});

Register.displayName = 'Register';
