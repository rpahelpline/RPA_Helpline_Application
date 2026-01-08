import { useState, memo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Briefcase, FileText, Upload } from 'lucide-react';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

export const RegisterJobSeeker = memo(() => {
  const navigate = useNavigate();
  const { register, setRole } = useAuthStore();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    skills: '',
    careerGoals: '',
    resume: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, resume: file.name });
    }
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
        user_type: 'job_seeker',
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        career_goals: formData.careerGoals,
        resume_url: formData.resume,
      });

      if (result.success) {
        setRole('job_seeker');
        toast.success('Account created successfully!');
        navigate('/dashboard');
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
              JOB SEEKER <span className="text-primary">REGISTRATION</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
              FIND RPA OPPORTUNITIES
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
                  <Briefcase className="h-3 w-3 text-secondary" />
                  SKILLS (comma-separated)
                </label>
                <Textarea
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="UiPath, Python, SQL"
                  rows={2}
                  className="bg-background border-input text-foreground text-sm placeholder-muted-foreground font-mono"
                />
              </div>

              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-secondary" />
                  CAREER GOALS
                </label>
                <Textarea
                  value={formData.careerGoals}
                  onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
                  placeholder="Your career objectives..."
                  rows={2}
                  className="bg-background border-input text-foreground text-sm placeholder-muted-foreground font-mono"
                />
              </div>

              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                  <Upload className="h-3 w-3 text-secondary" />
                  RESUME
                </label>
                <div className="border border-dashed border-border rounded-lg p-3 text-center tech-panel">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer text-secondary hover:text-secondary/80 font-mono text-xs flex items-center justify-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {formData.resume || 'Upload resume'}
                  </label>
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

RegisterJobSeeker.displayName = 'RegisterJobSeeker';
