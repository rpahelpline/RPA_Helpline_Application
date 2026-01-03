import { useState, memo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Code, Award, Building2, X } from 'lucide-react';
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

export const RegisterDeveloper = memo(() => {
  const navigate = useNavigate();
  const { register, setRole } = useAuthStore();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    techStack: [],
    certifications: '',
    industryExperience: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [selectedTech, setSelectedTech] = useState('');
  const techOptions = ['UiPath', 'Automation Anywhere', 'Blue Prism', 'Python', 'C#', 'Power Automate', 'Selenium'];
  
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const industries = ['Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Telecommunications', 'Government'];

  const handleAddTech = useCallback(() => {
    if (selectedTech && !formData.techStack.includes(selectedTech)) {
      setFormData({
        ...formData,
        techStack: [...formData.techStack, selectedTech],
      });
      setSelectedTech('');
    }
  }, [selectedTech, formData]);

  const handleAddIndustry = useCallback(() => {
    if (selectedIndustry && !formData.industryExperience.includes(selectedIndustry)) {
      setFormData({
        ...formData,
        industryExperience: [...formData.industryExperience, selectedIndustry],
      });
      setSelectedIndustry('');
    }
  }, [selectedIndustry, formData]);

  const handleRemoveTech = useCallback((tech) => {
    setFormData({
      ...formData,
      techStack: formData.techStack.filter((t) => t !== tech),
    });
  }, [formData]);

  const handleRemoveIndustry = useCallback((industry) => {
    setFormData({
      ...formData,
      industryExperience: formData.industryExperience.filter((i) => i !== industry),
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
        user_type: 'ba_pm',
        tech_stack: formData.techStack,
        certifications: formData.certifications.split(',').map(c => c.trim()).filter(c => c),
        industry_experience: formData.industryExperience,
      });

      if (result.success) {
        setRole('ba_pm');
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
              DEVELOPER <span className="text-primary">REGISTRATION</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
              RPA DEVELOPER ACCESS
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
                  TECH STACK
                </label>
                <div className="flex gap-2 mb-1.5">
                  <Select
                    value={selectedTech}
                    onChange={(e) => setSelectedTech(e.target.value)}
                    className="flex-1 text-sm py-2"
                  >
                    <option value="">Select tech</option>
                    {techOptions.map((tech) => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                  </Select>
                  <Button type="button" onClick={handleAddTech} variant="outline" size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.techStack.map((tech) => (
                    <Badge
                      key={tech}
                      variant="default"
                      className="bg-secondary/20 text-secondary border-secondary/30 font-mono text-[10px] flex items-center gap-1 px-2 py-0.5"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="hover:text-destructive"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                  <Award className="h-3 w-3 text-secondary" />
                  CERTIFICATIONS
                </label>
                <Textarea
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  placeholder="UiPath Advanced, Blue Prism..."
                  rows={2}
                  className="bg-background border-input text-foreground text-sm placeholder-muted-foreground font-mono"
                />
              </div>

              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-secondary" />
                  INDUSTRY
                </label>
                <div className="flex gap-2 mb-1.5">
                  <Select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="flex-1 text-sm py-2"
                  >
                    <option value="">Select</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </Select>
                  <Button type="button" onClick={handleAddIndustry} variant="outline" size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.industryExperience.map((industry) => (
                    <Badge
                      key={industry}
                      variant="default"
                      className="bg-secondary/20 text-secondary border-secondary/30 font-mono text-[10px] flex items-center gap-1 px-2 py-0.5"
                    >
                      {industry}
                      <button
                        type="button"
                        onClick={() => handleRemoveIndustry(industry)}
                        className="hover:text-destructive"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
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

RegisterDeveloper.displayName = 'RegisterDeveloper';
