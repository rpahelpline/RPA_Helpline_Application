import { useState, memo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Code, Clock, DollarSign, AlertCircle, Loader2, Plus, X, Calendar } from 'lucide-react';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { useTaxonomy } from '../../contexts/TaxonomyContext';
import { useToast } from '../../hooks/useToast';

export const RegisterProject = memo(() => {
  const navigate = useNavigate();
  const { createProject, isLoading } = useProjectStore();
  const { user, isAuthenticated, profile } = useAuthStore();
  const role = profile?.user_type || user?.user_type || null;
  const { platforms, skills, loading: loadingTaxonomy } = useTaxonomy();
  const toast = useToast();
  const hasCheckedAuth = useRef(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    urgency: 'medium',
    technologies: [],
    deadline: '',
    requirements: '',
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Check if user is authorized (run only once)
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    
    if (!isAuthenticated) {
      hasCheckedAuth.current = true;
      navigate('/sign-in', { state: { returnTo: '/register/project' } });
      return;
    }
    if (role && role !== 'client' && role !== 'employer' && role !== 'ba_pm') {
      hasCheckedAuth.current = true;
      console.warn(`[RegisterProject] Role check failed. Current role: "${role}"`);
      toast.error('Only clients, employers, and BA/PMs can post projects. Switch to a hiring role to post.');
      navigate('/projects');
    }
  }, [isAuthenticated, role, navigate]); // Removed toast from dependencies

  // Combine platforms and skills for technology selection
  const availableTechnologies = [
    ...platforms.map(p => ({ id: p.id, name: p.name, type: 'platform' })),
    ...skills.map(s => ({ id: s.id, name: s.name, type: 'skill' }))
  ];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleTechnology = (techName) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.includes(techName)
        ? prev.technologies.filter(t => t !== techName)
        : [...prev.technologies, techName]
    }));
    if (errors.technologies) {
      setErrors(prev => ({ ...prev, technologies: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (formData.budget_min && formData.budget_max) {
      const min = parseFloat(formData.budget_min);
      const max = parseFloat(formData.budget_max);
      if (min > max) {
        newErrors.budget_max = 'Maximum budget must be greater than minimum';
      }
    }
    
    if (formData.technologies.length === 0) {
      newErrors.technologies = 'Select at least one technology';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        urgency: formData.urgency,
        technologies: formData.technologies,
        deadline: formData.deadline || null,
        requirements: formData.requirements.trim() || null,
      };
      
      const result = await createProject(projectData);
      
      if (result.success) {
        toast.success('Project posted successfully!');
        navigate('/dashboard?section=overview');
      } else {
        toast.error(result.error || 'Failed to post project');
      }
    } catch (error) {
      console.error('Error posting project:', error);
      toast.error(error.message || 'Failed to post project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formData, createProject, navigate, toast]);

  const isFormDisabled = submitting || isLoading;

  return (
    <div className="min-h-[calc(100vh-4rem)] mt-16 flex items-center justify-center py-12">
      <Container className="w-full max-w-3xl">
        <Link 
          to="/projects" 
          className="inline-flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-sm mb-8 hover:text-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          BACK TO PROJECTS
        </Link>

        <Card className="tech-panel-strong border-glow-red">
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl font-display uppercase tracking-tight mb-2">
              POST A PROJECT
            </CardTitle>
            <CardDescription className="text-muted-foreground font-mono uppercase tracking-[0.2em] text-sm">
              FIND RPA TALENT FOR YOUR AUTOMATION NEEDS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Title */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  PROJECT TITLE <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isFormDisabled}
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Invoice Processing Automation"
                  className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder-muted-foreground font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                    errors.title ? 'border-destructive focus:border-destructive' : 'border-input focus:border-primary'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-destructive font-mono">{errors.title}</p>
                )}
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2">
                  PROJECT DESCRIPTION <span className="text-destructive">*</span>
                </label>
                <Textarea
                  required
                  disabled={isFormDisabled}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe your automation requirements in detail. Include current process, expected outcomes, and any specific requirements..."
                  rows={5}
                  className={`bg-background text-foreground placeholder-muted-foreground font-mono ${
                    errors.description ? 'border-destructive' : 'border-input'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-destructive font-mono">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.description.length}/5000 characters (minimum 20)
                </p>
              </div>

              {/* Budget Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    MINIMUM BUDGET (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isFormDisabled}
                    value={formData.budget_min}
                    onChange={(e) => updateField('budget_min', e.target.value)}
                    placeholder="e.g., 50000"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground font-mono tracking-wide focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    MAXIMUM BUDGET (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isFormDisabled}
                    value={formData.budget_max}
                    onChange={(e) => updateField('budget_max', e.target.value)}
                    placeholder="e.g., 100000"
                    className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder-muted-foreground font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.budget_max ? 'border-destructive focus:border-destructive' : 'border-input focus:border-primary'
                    }`}
                  />
                  {errors.budget_max && (
                    <p className="mt-1 text-sm text-destructive font-mono">{errors.budget_max}</p>
                  )}
                </div>
              </div>

              {/* Urgency & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    URGENCY LEVEL
                  </label>
                  <Select
                    disabled={isFormDisabled}
                    value={formData.urgency}
                    onChange={(e) => updateField('urgency', e.target.value)}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical - ASAP</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    PROJECT DEADLINE
                  </label>
                  <input
                    type="date"
                    disabled={isFormDisabled}
                    value={formData.deadline}
                    onChange={(e) => updateField('deadline', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground font-mono tracking-wide focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                  <Code className="h-3 w-3" />
                  REQUIRED TECHNOLOGIES <span className="text-destructive">*</span>
                </label>
                
                {/* Selected Technologies */}
                {formData.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-mono"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => toggleTechnology(tech)}
                          className="hover:text-destructive transition-colors"
                          disabled={isFormDisabled}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Technology Selection */}
                <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border border-border max-h-48 overflow-y-auto">
                  {loadingTaxonomy ? (
                    <p className="text-muted-foreground text-sm">Loading technologies...</p>
                  ) : availableTechnologies.length > 0 ? (
                    availableTechnologies.map((tech) => (
                      <button
                        key={`${tech.type}-${tech.id}`}
                        type="button"
                        disabled={isFormDisabled}
                        onClick={() => toggleTechnology(tech.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                          formData.technologies.includes(tech.name)
                            ? 'bg-primary text-white'
                            : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary'
                        }`}
                      >
                        {tech.name}
                      </button>
                    ))
                  ) : (
                    // Fallback technologies if taxonomy fails to load
                    ['UiPath', 'Automation Anywhere', 'Blue Prism', 'Power Automate', 'Python', 'JavaScript', 'SQL', 'REST API'].map((tech) => (
                      <button
                        key={tech}
                        type="button"
                        disabled={isFormDisabled}
                        onClick={() => toggleTechnology(tech)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                          formData.technologies.includes(tech)
                            ? 'bg-primary text-white'
                            : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary'
                        }`}
                      >
                        {tech}
                      </button>
                    ))
                  )}
                </div>
                {errors.technologies && (
                  <p className="mt-1 text-sm text-destructive font-mono">{errors.technologies}</p>
                )}
              </div>

              {/* Additional Requirements */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2">
                  ADDITIONAL REQUIREMENTS (Optional)
                </label>
                <Textarea
                  disabled={isFormDisabled}
                  value={formData.requirements}
                  onChange={(e) => updateField('requirements', e.target.value)}
                  placeholder="Any specific requirements, certifications needed, or other details..."
                  rows={3}
                  className="bg-background border-input text-foreground placeholder-muted-foreground font-mono"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1 font-display uppercase tracking-wider glow-red"
                  disabled={isFormDisabled}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      POSTING...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      POST PROJECT
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/projects')}
                  disabled={isFormDisabled}
                  className="font-display uppercase tracking-wider"
                >
                  CANCEL
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
});

RegisterProject.displayName = 'RegisterProject';
