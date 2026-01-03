import { useState, memo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Code, DollarSign, Briefcase, Link as LinkIcon } from 'lucide-react';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

export const RegisterFreelancer = memo(() => {
  const navigate = useNavigate();
  const { register, setRole } = useAuthStore();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    skills: [],
    experience: '',
    availability: '',
    hourlyRate: '',
    portfolio: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [selectedSkill, setSelectedSkill] = useState('');
  const skills = ['UiPath', 'Automation Anywhere', 'Blue Prism', 'Python', 'Power Automate'];

  const handleAddSkill = useCallback(() => {
    if (selectedSkill && !formData.skills.includes(selectedSkill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, selectedSkill],
      });
      setSelectedSkill('');
    }
  }, [selectedSkill, formData]);

  const handleRemoveSkill = useCallback((skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const result = await register({
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
        user_type: 'freelancer',
        skills: formData.skills,
        experience_level: formData.experience,
        availability: formData.availability,
        hourly_rate: parseFloat(formData.hourlyRate) || 0,
        portfolio_url: formData.portfolio,
      });

      if (result.success) {
        setRole('freelancer');
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
    <div className="h-screen flex items-center justify-center p-4 overflow-hidden">
      <Container className="w-full max-w-lg">
        <Link 
          to="/register" 
          className="inline-flex items-center gap-1.5 text-foreground font-mono uppercase tracking-wider text-xs mb-3 hover:text-secondary transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          BACK
        </Link>

        <Card className="tech-panel-strong border-glow-blue max-h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl sm:text-3xl font-display uppercase tracking-tight">
              FREELANCER <span className="text-primary">REGISTRATION</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
              OFFER YOUR RPA EXPERTISE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm placeholder-muted-foreground font-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30"
                  />
                </div>
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
              
              {errors.email && (
                <div className="text-destructive text-xs font-mono">{errors.email}</div>
              )}

              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                  <Code className="h-3 w-3 text-secondary" />
                  SKILLS
                </label>
                <div className="flex gap-2 mb-1.5">
                  <Select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="flex-1 text-sm py-2"
                  >
                    <option value="">Select skill</option>
                    {skills.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </Select>
                  <Button type="button" onClick={handleAddSkill} variant="outline" size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="default"
                      className="bg-secondary/20 text-secondary border-secondary/30 font-mono text-[10px] flex items-center gap-1 px-2 py-0.5"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3 text-secondary" />
                    EXPERIENCE
                  </label>
                  <Select
                    required
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="text-sm py-2"
                  >
                    <option value="">Select level</option>
                    <option value="Junior">Junior (0-2 yrs)</option>
                    <option value="Mid">Mid (2-5 yrs)</option>
                    <option value="Senior">Senior (5+ yrs)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1">
                    AVAILABILITY
                  </label>
                  <Select
                    required
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="text-sm py-2"
                  >
                    <option value="">Select</option>
                    <option value="Available">Available</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Full-time">Full-time</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3 text-secondary" />
                    RATE/HR (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="500"
                      className="w-full pl-7 pr-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm placeholder-muted-foreground font-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                    <LinkIcon className="h-3 w-3 text-secondary" />
                    PORTFOLIO
                  </label>
                  <input
                    type="url"
                    value={formData.portfolio}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm placeholder-muted-foreground font-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30"
                  />
                </div>
              </div>

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
          </CardContent>
        </Card>
      </Container>
    </div>
  );
});

RegisterFreelancer.displayName = 'RegisterFreelancer';
