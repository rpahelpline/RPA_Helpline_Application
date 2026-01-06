import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { profileApi, uploadApi } from '../services/api';
import { useTaxonomy } from '../contexts/TaxonomyContext';
import { sendEmailOTP, syncVerificationStatus } from '../services/supabaseAuth';
import { isSupabaseConfigured } from '../config/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { OTPVerification } from '../components/otp/OTPVerification';
import { 
  Rocket, Phone, Mail, MapPin, Briefcase, FileText, Award, 
  CheckCircle, Upload, X, Loader2, Globe, Building2
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { INDIAN_STATES, INDIAN_CITIES, validateIndianPhone } from '../utils/indianLocalization';

// Countries list (common countries)
const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Singapore', 'United Arab Emirates', 'Netherlands',
  'Sweden', 'Switzerland', 'Japan', 'South Korea', 'Brazil', 'Mexico',
  'South Africa', 'New Zealand', 'Ireland', 'Poland', 'Other'
];

// RPA Platforms (fallback if taxonomy not loaded)
const RPA_PLATFORMS_FALLBACK = [
  'UiPath', 'Automation Anywhere', 'Blue Prism', 'Power Automate',
  'WorkFusion', 'Pega', 'Kofax', 'NICE', 'Appian', 'Nintex', 'Other'
];

// Skills list (fallback if taxonomy not loaded)
const COMMON_SKILLS_FALLBACK = [
  'RE Framework', 'Orchestrator', 'Bot Development', 'API Integration',
  'Web Scraping', 'Excel Automation', 'SAP Automation', 'Citrix Automation',
  'Document Understanding', 'IQ Bot', 'AI Center', 'Machine Learning',
  'Process Mapping', 'Requirements Gathering', 'PDD/SDD Documentation',
  'Agile/Scrum', 'COE Setup', 'Python', 'SQL', 'JavaScript', 'C#', '.NET'
];

export const ProfileSetupEnhanced = memo(() => {
  const { user, role, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [emailOTPLoading, setEmailOTPLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Contact info
    email: user?.email || '',
    phone: '',
    alternatePhone: '',
    country: 'India',
    state: '',
    city: '',
    
    // Experience
    totalExperienceYears: '',
    rpaExperienceYears: '',
    currentCompany: '',
    
    // Skills
    selectedPlatforms: [],
    selectedSkills: [],
    
    // Resume
    resume: null,
    resumeUrl: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  
  // Taxonomy data (platforms and skills with IDs)
  const [platformsData, setPlatformsData] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/sign-in');
    }
  }, [isAuthenticated, user, navigate]);

  // Use taxonomy context instead of fetching directly
  const { platforms: contextPlatforms, skills: contextSkills, loading: taxonomyLoading, error: taxonomyError, refetch: refetchTaxonomy } = useTaxonomy();
  const hasRefetchedRef = useRef(false);
  
  useEffect(() => {
    setPlatformsData(contextPlatforms || []);
    setSkillsData(contextSkills || []);
    setLoadingTaxonomy(taxonomyLoading);
    
    // If there's an error and we haven't refetched yet, try once
    if (taxonomyError && !hasRefetchedRef.current && contextPlatforms.length === 0 && contextSkills.length === 0) {
      console.warn('Taxonomy fetch error, attempting refetch...');
      hasRefetchedRef.current = true;
      setTimeout(() => refetchTaxonomy(), 1000);
    }
  }, [contextPlatforms, contextSkills, taxonomyLoading, taxonomyError, refetchTaxonomy]);

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { profile } = await profileApi.getMyProfile();
        if (profile) {
          setFormData(prev => ({
            ...prev,
            email: profile.user?.email || prev.email,
            phone: profile.phone || prev.phone,
            alternatePhone: profile.alternate_phone || prev.alternatePhone,
            country: profile.country || prev.country,
            state: profile.state || prev.state,
            city: profile.city || prev.city,
            totalExperienceYears: profile.total_experience_years || prev.totalExperienceYears,
            rpaExperienceYears: profile.rpa_experience_years || prev.rpaExperienceYears,
            currentCompany: profile.current_company || prev.currentCompany,
            resumeUrl: profile.resume_url || prev.resumeUrl,
          }));
          
          // Load existing platforms and skills
          if (profile.platforms && profile.platforms.length > 0) {
            const platformNames = profile.platforms
              .map(p => p.platform?.name)
              .filter(Boolean);
            setFormData(prev => ({ ...prev, selectedPlatforms: platformNames }));
          }
          
          if (profile.skills && profile.skills.length > 0) {
            const skillNames = profile.skills
              .map(s => s.skill?.name)
              .filter(Boolean);
            setFormData(prev => ({ ...prev, selectedSkills: skillNames }));
          }
          
          // Check verification status
          if (profile.user?.email_verified) setEmailVerified(true);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    
    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Email OTP
  const handleSendEmailOTP = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!isSupabaseConfigured) {
      toast.error('Email OTP is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      return;
    }

    setEmailOTPLoading(true);
    try {
      await sendEmailOTP(formData.email);
      setShowEmailOTP(true);
      toast.success('OTP sent! Check your email for the 8-digit code');
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setEmailOTPLoading(false);
    }
  };

  const handleEmailVerified = async () => {
    setEmailVerified(true);
    setShowEmailOTP(false);
    // Sync verification status with backend
    await syncVerificationStatus('email', formData.email);
    toast.success('Email verified successfully!');
  };

  // Phone verification removed - phone is optional, no OTP needed

  // Resume upload
  const handleResumeUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingResume(true);
    try {
      const response = await uploadApi.uploadFile('resume', file);
      updateFormData('resumeUrl', response.file.url);
      updateFormData('resume', file);
      toast.success('Resume uploaded successfully');
    } catch (error) {
      toast.error(error.error || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  // Skills/Platforms selection
  const togglePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...prev.selectedPlatforms, platform]
    }));
  };

  const toggleSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter(s => s !== skill)
        : [...prev.selectedSkills, skill]
    }));
  };

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.email) newErrors.email = 'Email is required';
      if (!emailVerified) newErrors.emailVerified = 'Email must be verified';
      // Phone is completely optional - no verification required
    }

    if (step === 2) {
      if (!formData.country) newErrors.country = 'Country is required';
      if (formData.country === 'India' && !formData.state) newErrors.state = 'State is required';
      if (!formData.city) newErrors.city = 'City is required';
    }

    if (step === 3) {
      if (!formData.totalExperienceYears) newErrors.totalExperienceYears = 'Total experience is required';
      if (!formData.rpaExperienceYears) newErrors.rpaExperienceYears = 'RPA experience is required';
    }

    if (step === 4) {
      if (formData.selectedPlatforms.length === 0) newErrors.platforms = 'Select at least one RPA platform';
      if (formData.selectedSkills.length === 0) newErrors.skills = 'Select at least one skill';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to find platform ID by name
  const findPlatformId = (platformName) => {
    // Try exact match first
    let platform = platformsData.find(p => 
      p.name.toLowerCase() === platformName.toLowerCase()
    );
    
    // Try partial match
    if (!platform) {
      platform = platformsData.find(p => 
        p.name.toLowerCase().includes(platformName.toLowerCase()) ||
        platformName.toLowerCase().includes(p.name.toLowerCase())
      );
    }
    
    return platform?.id;
  };

  // Helper function to find skill ID by name
  const findSkillId = (skillName) => {
    // Try exact match first
    let skill = skillsData.find(s => 
      s.name.toLowerCase() === skillName.toLowerCase()
    );
    
    // Try partial match
    if (!skill) {
      skill = skillsData.find(s => 
        s.name.toLowerCase().includes(skillName.toLowerCase()) ||
        skillName.toLowerCase().includes(s.name.toLowerCase())
      );
    }
    
    return skill?.id;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill all required fields');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    // Final submission
    setIsSubmitting(true);
    try {
      // Update basic profile data
      const profileData = {
        phone: formData.phone || null, // Optional
        alternate_phone: formData.alternatePhone || null,
        country: formData.country,
        state: formData.state || null,
        city: formData.city,
        total_experience_years: parseInt(formData.totalExperienceYears),
        rpa_experience_years: parseInt(formData.rpaExperienceYears),
        current_company: formData.currentCompany || null,
        resume_url: formData.resumeUrl || null,
      };

      await profileApi.updateProfile(profileData);

      // Save platforms
      if (formData.selectedPlatforms.length > 0) {
        const platformPromises = formData.selectedPlatforms.map(async (platformName, index) => {
          const platformId = findPlatformId(platformName);
          if (platformId) {
            try {
              await profileApi.addPlatform({
                platform_id: platformId,
                proficiency_level: 'intermediate',
                years_experience: parseInt(formData.rpaExperienceYears) || 0,
                is_primary: index === 0 // First platform is primary
              });
            } catch (error) {
              console.warn(`Failed to add platform ${platformName}:`, error);
            }
          } else {
            console.warn(`Platform not found in taxonomy: ${platformName}`);
          }
        });
        await Promise.all(platformPromises);
      }

      // Save skills
      if (formData.selectedSkills.length > 0) {
        const skillPromises = formData.selectedSkills.map(async (skillName) => {
          const skillId = findSkillId(skillName);
          if (skillId) {
            try {
              await profileApi.addSkill({
                skill_id: skillId,
                proficiency_level: 'intermediate',
                years_experience: parseInt(formData.rpaExperienceYears) || 0
              });
            } catch (error) {
              console.warn(`Failed to add skill ${skillName}:`, error);
            }
          } else {
            console.warn(`Skill not found in taxonomy: ${skillName}`);
          }
        });
        await Promise.all(skillPromises);
      }

      toast.success('Profile setup completed successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.error || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background effects */}
      <div className="fixed inset-0 star-field opacity-40 pointer-events-none" />
      <div className="fixed inset-0 grid-overlay opacity-20 pointer-events-none" />

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground tracking-wider">
                PROFILE SETUP
              </h1>
              <p className="text-muted-foreground text-sm">Complete your profile to get started</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all ${
                  i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            STEP {currentStep} OF {totalSteps}
          </p>
        </div>

        {/* Step 1: Contact & Verification */}
        {currentStep === 1 && (
          <Card className="tech-panel border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                CONTACT INFORMATION & VERIFICATION
              </CardTitle>
              <CardDescription>
                Verify your email address to secure your account. Email verification is mandatory.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  EMAIL ADDRESS
                  {emailVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    disabled={emailVerified}
                    className="flex-1"
                    placeholder="your@email.com"
                  />
                  {!emailVerified && (
                    <Button
                      onClick={handleSendEmailOTP}
                      disabled={emailOTPLoading || !formData.email || !isSupabaseConfigured}
                      variant="outline"
                      title={!isSupabaseConfigured ? 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY' : ''}
                    >
                      {emailOTPLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                    </Button>
                  )}
                </div>
                {showEmailOTP && !emailVerified && (
                  <OTPVerification
                    type="email"
                    identifier={formData.email}
                    onVerified={handleEmailVerified}
                    onCancel={() => setShowEmailOTP(false)}
                  />
                )}
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                {errors.emailVerified && (
                  <p className="text-red-500 text-sm font-medium">
                    {errors.emailVerified} You must verify your email to continue.
                  </p>
                )}
                {!emailVerified && !showEmailOTP && (
                  <p className="text-amber-500 text-sm">
                    ⚠️ Email verification is required to proceed. Please verify your email address.
                  </p>
                )}
              </div>

              {/* Phone - Optional, no verification required */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  PHONE NUMBER (Optional)
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value.replace(/\D/g, ''))}
                  className="flex-1"
                  placeholder="9876543210 (Optional)"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Phone number is optional. You can add it later if needed.
                </p>
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
              </div>

              {/* Alternate Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  ALTERNATE CONTACT NUMBER (Optional)
                </Label>
                <Input
                  type="tel"
                  value={formData.alternatePhone}
                  onChange={(e) => updateFormData('alternatePhone', e.target.value.replace(/\D/g, ''))}
                  className="flex-1"
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <Card className="tech-panel border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                LOCATION
              </CardTitle>
              <CardDescription>Tell us where you're located</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>COUNTRY *</Label>
                <Select
                  value={formData.country}
                  onChange={(e) => updateFormData('country', e.target.value)}
                >
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </Select>
                {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
              </div>

              {formData.country === 'India' && (
                <div className="space-y-2">
                  <Label>STATE *</Label>
                  <Select
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </Select>
                  {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label>CITY *</Label>
                {formData.country === 'India' ? (
                  <Select
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                  >
                    <option value="">Select City</option>
                    {INDIAN_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="Other">Other</option>
                  </Select>
                ) : (
                  <Input
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="Enter your city"
                  />
                )}
                {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Experience */}
        {currentStep === 3 && (
          <Card className="tech-panel border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                EXPERIENCE
              </CardTitle>
              <CardDescription>Share your professional experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>TOTAL EXPERIENCE (YEARS) *</Label>
                  <Input
                    type="number"
                    value={formData.totalExperienceYears}
                    onChange={(e) => updateFormData('totalExperienceYears', e.target.value)}
                    placeholder="5"
                    min="0"
                    max="50"
                  />
                  {errors.totalExperienceYears && <p className="text-red-500 text-sm">{errors.totalExperienceYears}</p>}
                </div>

                <div className="space-y-2">
                  <Label>RPA EXPERIENCE (YEARS) *</Label>
                  <Input
                    type="number"
                    value={formData.rpaExperienceYears}
                    onChange={(e) => updateFormData('rpaExperienceYears', e.target.value)}
                    placeholder="3"
                    min="0"
                    max="50"
                  />
                  {errors.rpaExperienceYears && <p className="text-red-500 text-sm">{errors.rpaExperienceYears}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  CURRENT COMPANY (Optional)
                </Label>
                <Input
                  value={formData.currentCompany}
                  onChange={(e) => updateFormData('currentCompany', e.target.value)}
                  placeholder="Company name"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Skills */}
        {currentStep === 4 && (
          <Card className="tech-panel border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                SKILLS & PLATFORMS
              </CardTitle>
              <CardDescription>Select your RPA platforms and skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>RPA PLATFORMS *</Label>
                {loadingTaxonomy && platformsData.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading platforms...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(platformsData.length > 0 ? platformsData.map(p => p.name) : RPA_PLATFORMS_FALLBACK).map(platform => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`px-4 py-2 rounded-full text-sm font-mono transition-all ${
                          formData.selectedPlatforms.includes(platform)
                            ? 'bg-primary text-white'
                            : 'tech-panel text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                )}
                {errors.platforms && <p className="text-red-500 text-sm">{errors.platforms}</p>}
              </div>

              <div className="space-y-2">
                <Label>SKILLS *</Label>
                {loadingTaxonomy && skillsData.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading skills...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(skillsData.length > 0 ? skillsData.map(s => s.name) : COMMON_SKILLS_FALLBACK).map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-full text-sm font-mono transition-all ${
                          formData.selectedSkills.includes(skill)
                            ? 'bg-secondary text-white'
                            : 'tech-panel text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                )}
                {errors.skills && <p className="text-red-500 text-sm">{errors.skills}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Resume */}
        {currentStep === 5 && (
          <Card className="tech-panel border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                RESUME
              </CardTitle>
              <CardDescription>Upload your resume (PDF or Word document)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>RESUME *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleResumeUpload(e.target.files[0])}
                    className="hidden"
                  />
                  {formData.resumeUrl ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                      <p className="text-sm text-foreground">Resume uploaded successfully</p>
                      <p className="text-xs text-muted-foreground">{formData.resume?.name || 'Resume file'}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Resume
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PDF or Word document (max 5MB)</p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingResume}
                      >
                        {uploadingResume ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Resume
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Previous
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              Email verification required to continue
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (currentStep === 1 && !emailVerified)}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            title={currentStep === 1 && !emailVerified ? 'Please verify your email address first' : ''}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : currentStep < totalSteps ? (
              'Next'
            ) : (
              'Complete Setup'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

ProfileSetupEnhanced.displayName = 'ProfileSetupEnhanced';

