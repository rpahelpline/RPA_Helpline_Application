import { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { profileApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { formatIndianCurrency, formatHourlyRate, validateIndianPhone } from '../utils/indianLocalization';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { Rocket, Phone, DollarSign, Clock, Briefcase, Building2, GraduationCap } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const rpaTools = [
  'UiPath', 'Automation Anywhere', 'Blue Prism', 'Power Automate', 
  'WorkFusion', 'Pega', 'Kofax', 'NICE', 'Appian', 'Other'
];

export const ProfileSetup = memo(() => {
  const { user, role, isAuthenticated } = useAuthStore();
  const { profile, updateProfile } = useUserStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTechnologies, setSelectedTechnologies] = useState([]);
  
  // Common fields
  const [phone, setPhone] = useState('');
  
  // Freelancer fields
  const [hourlyRate, setHourlyRate] = useState('');
  const [availability, setAvailability] = useState('');
  const [totalExperience, setTotalExperience] = useState('');
  const [rpaExperience, setRpaExperience] = useState('');
  
  // Job seeker fields
  const [jobType, setJobType] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  
  // Training seeker fields
  const [currentSkillLevel, setCurrentSkillLevel] = useState('');
  const [preferredTrainingMode, setPreferredTrainingMode] = useState('');
  
  // Employer fields
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [hiringNeeds, setHiringNeeds] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/sign-in');
    }
  }, [user, isAuthenticated, navigate]);

  const handleTechnologyToggle = useCallback((tech) => {
    setSelectedTechnologies(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!user || !role) return;

    setIsSubmitting(true);

    try {
      // Update user profile with phone
      const profileData = { phone };
      if (profile) {
        updateProfile(profileData);
      }

      // Create type-specific profile data
      let profileUpdateData = {
        phone,
        technologies: selectedTechnologies,
      };

      // Add role-specific fields
      if (role === 'freelancer') {
        profileUpdateData = {
          ...profileUpdateData,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          availability,
          total_experience_years: totalExperience ? parseInt(totalExperience) : null,
          rpa_experience_years: rpaExperience ? parseInt(rpaExperience) : null,
        };
      } else if (role === 'jobseeker' || role === 'job_seeker') {
        profileUpdateData = {
          ...profileUpdateData,
          job_type: jobType,
          expected_salary: expectedSalary,
          total_experience_years: totalExperience ? parseInt(totalExperience) : null,
          rpa_experience_years: rpaExperience ? parseInt(rpaExperience) : null,
        };
      } else if (role === 'trainer' || role === 'training_seeker') {
        profileUpdateData = {
          ...profileUpdateData,
          current_skill_level: currentSkillLevel,
          preferred_training_mode: preferredTrainingMode,
          availability,
          interested_technologies: selectedTechnologies,
        };
      } else if (role === 'client' || role === 'employer') {
        profileUpdateData = {
          ...profileUpdateData,
          company_name: companyName,
          company_website: companyWebsite,
          hiring_needs: hiringNeeds,
        };
      }

      // Update profile via API
      await profileApi.updateProfile(profileUpdateData);
      
      // Update local store
      if (profile) {
        updateProfile(profileUpdateData);
      }

      toast.success('Profile complete! Your mission profile has been configured.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile setup error:', error);
      toast.error(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user, role, phone, hourlyRate, availability, totalExperience, rpaExperience,
    jobType, expectedSalary, currentSkillLevel, preferredTrainingMode,
    companyName, companyWebsite, hiringNeeds, selectedTechnologies,
    profile, updateProfile, navigate, toast
  ]);

  if (!isAuthenticated || !user) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground font-mono text-xs">LOADING...</p>
        </div>
      </div>
    );
  }

  const renderTypeSpecificFields = () => {
    switch (role) {
      case 'freelancer':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  HOURLY RATE (INR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    type="number"
                    placeholder="500"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="bg-background border-input h-9 text-sm pl-7"
                    min="0"
                  />
                </div>
                {hourlyRate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatHourlyRate(hourlyRate)}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  AVAILABILITY
                </Label>
                <Select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="">Select</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  TOTAL EXP (YRS)
                </Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={totalExperience}
                  onChange={(e) => setTotalExperience(e.target.value)}
                  className="bg-background border-input h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  RPA EXP (YRS)
                </Label>
                <Input
                  type="number"
                  placeholder="3"
                  value={rpaExperience}
                  onChange={(e) => setRpaExperience(e.target.value)}
                  className="bg-background border-input h-9 text-sm"
                />
              </div>
            </div>
          </>
        );

      case 'jobseeker':
      case 'job_seeker':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  JOB TYPE
                </Label>
                <Select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="">Select</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="remote">Remote</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  EXPECTED SALARY (INR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    type="text"
                    placeholder="50000-80000"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    className="bg-background border-input h-9 text-sm pl-7"
                  />
                </div>
                {expectedSalary && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {expectedSalary.includes('-') 
                      ? expectedSalary.split('-').map(s => formatIndianCurrency(s.trim())).join(' - ')
                      : formatIndianCurrency(expectedSalary)
                    }
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  TOTAL EXP (YRS)
                </Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={totalExperience}
                  onChange={(e) => setTotalExperience(e.target.value)}
                  className="bg-background border-input h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  RPA EXP (YRS)
                </Label>
                <Input
                  type="number"
                  placeholder="3"
                  value={rpaExperience}
                  onChange={(e) => setRpaExperience(e.target.value)}
                  className="bg-background border-input h-9 text-sm"
                />
              </div>
            </div>
          </>
        );

      case 'trainer':
      case 'training_seeker':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  SKILL LEVEL
                </Label>
                <Select
                  value={currentSkillLevel}
                  onChange={(e) => setCurrentSkillLevel(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="">Select</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  TRAINING MODE
                </Label>
                <Select
                  value={preferredTrainingMode}
                  onChange={(e) => setPreferredTrainingMode(e.target.value)}
                  className="h-9 text-sm"
                >
                  <option value="">Select</option>
                  <option value="online">Online</option>
                  <option value="in-person">In-person</option>
                  <option value="hybrid">Hybrid</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3" />
                AVAILABILITY
              </Label>
              <Select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="h-9 text-sm"
              >
                <option value="">Select</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="flexible">Flexible</option>
              </Select>
            </div>
          </>
        );

      case 'client':
      case 'employer':
        return (
          <>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                COMPANY NAME *
              </Label>
              <Input
                type="text"
                placeholder="TechCorp Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-background border-input h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                COMPANY WEBSITE
              </Label>
              <Input
                type="url"
                placeholder="https://techcorp.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className="bg-background border-input h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                HIRING NEEDS
              </Label>
              <Textarea
                placeholder="Describe your RPA hiring needs..."
                value={hiringNeeds}
                onChange={(e) => setHiringNeeds(e.target.value)}
                className="bg-background border-input min-h-[60px] text-sm"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const showTechnologies = ['freelancer', 'jobseeker', 'job_seeker', 'trainer', 'training_seeker'].includes(role);

  const getUserTypeLabel = () => {
    switch (role) {
      case 'freelancer': return 'FREELANCER SETUP';
      case 'jobseeker':
      case 'job_seeker': return 'JOB SEEKER SETUP';
      case 'trainer':
      case 'training_seeker': return 'TRAINER SETUP';
      case 'client':
      case 'employer': return 'EMPLOYER SETUP';
      default: return 'PROFILE SETUP';
    }
  };

  return (
    <div className="h-screen bg-background relative overflow-hidden flex items-center justify-center py-6 px-4">
      {/* Background effects */}
      <div className="fixed inset-0 star-field opacity-50" />
      <div className="fixed inset-0 grid-overlay opacity-20" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-display font-bold text-foreground tracking-wider">RPA HELPLINE</span>
          </Link>
        </div>

        <Card className="tech-panel-strong border-glow-blue">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-lg font-display tracking-wider uppercase text-center">PROFILE CONFIGURATION</CardTitle>
            <CardDescription className="text-muted-foreground font-mono text-xs uppercase tracking-wider text-center">
              {getUserTypeLabel()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Common field */}
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  PHONE NUMBER
                </Label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-background border-input h-9 text-sm"
                  maxLength={15}
                />
                {phone && !validateIndianPhone(phone) && (
                  <p className="text-xs text-destructive mt-1">Please enter a valid 10-digit Indian mobile number</p>
                )}
              </div>

              {/* Type-specific fields */}
              {renderTypeSpecificFields()}

              {/* Technologies selection */}
              {showTechnologies && (
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    RPA TECHNOLOGIES
                  </Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
                    {rpaTools.map((tech) => (
                      <div
                        key={tech}
                        className="flex items-center space-x-1 tech-panel p-1.5 rounded hover:border-secondary/50 transition-colors"
                      >
                        <Checkbox
                          id={tech}
                          checked={selectedTechnologies.includes(tech)}
                          onChange={() => handleTechnologyToggle(tech)}
                          className="w-3 h-3"
                        />
                        <label
                          htmlFor={tech}
                          className="text-xs font-mono text-foreground leading-none cursor-pointer truncate"
                        >
                          {tech}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 font-display text-xs tracking-wider uppercase h-9"
                >
                  SKIP
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  className="flex-1 font-display text-xs tracking-wider uppercase glow-red h-9"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'SAVING...' : 'COMPLETE'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

ProfileSetup.displayName = 'ProfileSetup';
