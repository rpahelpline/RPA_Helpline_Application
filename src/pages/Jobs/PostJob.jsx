import { memo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jobApi } from '../../services/api';
import { useTaxonomy } from '../../contexts/TaxonomyContext';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import {
  ArrowLeft, Briefcase, MapPin, DollarSign, Clock, CheckCircle,
  Loader2, Plus, X, Globe
} from 'lucide-react';

export const PostJob = memo(() => {
  const navigate = useNavigate();
  const { user, role, isAuthenticated } = useAuthStore();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const { platforms: taxonomyPlatforms, skills: taxonomySkills, loading: loadingTaxonomy } = useTaxonomy();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'full_time',
    location: '',
    is_remote: false,
    salary_min: '',
    salary_max: '',
    technologies: [],
    requirements: '',
    benefits: '',
    application_deadline: ''
  });

  const [errors, setErrors] = useState({});

  // Use taxonomy from context
  const platforms = taxonomyPlatforms || [];
  const skills = taxonomySkills || [];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleTechnology = (tech) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.includes(tech)
        ? prev.technologies.filter(t => t !== tech)
        : [...prev.technologies, tech]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (formData.technologies.length === 0) newErrors.technologies = 'Select at least one technology';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        job_type: formData.job_type,
        location: formData.location || null,
        is_remote: formData.is_remote,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        technologies: formData.technologies,
        requirements: formData.requirements || null,
        benefits: formData.benefits || null,
        application_deadline: formData.application_deadline || null
      };

      const response = await jobApi.create(jobData);
      toast.success('Job posted successfully!');
      navigate(`/jobs/${response.job.id}`);
    } catch (error) {
      toast.error(error.error || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-xs mb-4 hover:text-secondary transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          BACK TO DASHBOARD
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground tracking-wider">
                POST A JOB
              </h1>
              <p className="text-muted-foreground text-sm">Create a new job listing to find RPA talent</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="tech-panel border-border bg-card/50 mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-display">BASIC INFORMATION</CardTitle>
              <CardDescription>Enter the job details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>JOB TITLE *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="e.g., Senior UiPath Developer"
                  className="bg-background"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label>DESCRIPTION *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  rows={6}
                  className="bg-background"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>JOB TYPE</Label>
                  <Select
                    value={formData.job_type}
                    onChange={(e) => updateFormData('job_type', e.target.value)}
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </Select>
                </div>

                <div>
                  <Label>LOCATION</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    placeholder="e.g., New York, NY"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_remote"
                  checked={formData.is_remote}
                  onChange={(e) => updateFormData('is_remote', e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="is_remote" className="cursor-pointer flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Remote position
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Salary */}
          <Card className="tech-panel border-border bg-card/50 mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                SALARY RANGE
              </CardTitle>
              <CardDescription>Optional: Specify the salary range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>MINIMUM (₹/year)</Label>
                  <Input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => updateFormData('salary_min', e.target.value)}
                    placeholder="e.g., 500000"
                    className="bg-background"
                  />
                </div>
                <div>
                  <Label>MAXIMUM (₹/year)</Label>
                  <Input
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => updateFormData('salary_max', e.target.value)}
                    placeholder="e.g., 1000000"
                    className="bg-background"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technologies */}
          <Card className="tech-panel border-border bg-card/50 mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-display">REQUIRED TECHNOLOGIES *</CardTitle>
              <CardDescription>Select the RPA platforms and technologies required</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTaxonomy ? (
                <p className="text-sm text-muted-foreground">Loading technologies...</p>
              ) : (
                <>
                  <div className="mb-4">
                    <Label className="mb-2 block">RPA PLATFORMS</Label>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map(platform => (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => toggleTechnology(platform.name)}
                          className={`px-4 py-2 rounded-full text-sm font-mono transition-all ${
                            formData.technologies.includes(platform.name)
                              ? 'bg-primary text-white'
                              : 'tech-panel text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {platform.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">SKILLS</Label>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 20).map(skill => (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => toggleTechnology(skill.name)}
                          className={`px-4 py-2 rounded-full text-sm font-mono transition-all ${
                            formData.technologies.includes(skill.name)
                              ? 'bg-secondary text-white'
                              : 'tech-panel text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {skill.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {errors.technologies && <p className="text-red-500 text-sm mt-2">{errors.technologies}</p>}
              
              {formData.technologies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Label className="mb-2 block">SELECTED ({formData.technologies.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.technologies.map(tech => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-mono"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => toggleTechnology(tech)}
                          className="hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements & Benefits */}
          <Card className="tech-panel border-border bg-card/50 mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-display">ADDITIONAL DETAILS</CardTitle>
              <CardDescription>Requirements and benefits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>REQUIREMENTS</Label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) => updateFormData('requirements', e.target.value)}
                  placeholder="List the qualifications, experience, and skills required..."
                  rows={4}
                  className="bg-background"
                />
              </div>

              <div>
                <Label>BENEFITS</Label>
                <Textarea
                  value={formData.benefits}
                  onChange={(e) => updateFormData('benefits', e.target.value)}
                  placeholder="Health insurance, flexible hours, remote work, etc..."
                  rows={3}
                  className="bg-background"
                />
              </div>

              <div>
                <Label>APPLICATION DEADLINE</Label>
                <Input
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => updateFormData('application_deadline', e.target.value)}
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="font-mono text-xs tracking-wider"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="font-mono text-xs tracking-wider glow-red"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  POSTING...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  POST JOB
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
});

PostJob.displayName = 'PostJob';

