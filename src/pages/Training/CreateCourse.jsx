import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Clock, DollarSign, Users, Calendar, 
  Video, Monitor, Globe, Plus, X, Loader2
} from 'lucide-react';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { trainingApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useTaxonomy } from '../../contexts/TaxonomyContext';
import { useToast } from '../../hooks/useToast';

export const CreateCourse = memo(() => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();
  const { platforms, skills, loading: loadingTaxonomy } = useTaxonomy();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'beginner',
    format: 'online',
    duration: '',
    price: '',
    max_students: '',
    technologies: [],
    prerequisites: '',
    learning_outcomes: '',
    syllabus: '',
    next_batch_date: '',
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Check authorization
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/sign-in', { state: { returnTo: '/create-course' } });
      return;
    }
    if (role !== 'trainer') {
      toast.error('Only trainers can create courses');
      navigate('/courses');
    }
  }, [isAuthenticated, role, navigate, toast]);

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
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!formData.duration.trim()) {
      newErrors.duration = 'Course duration is required';
    }
    
    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a valid number';
    }
    
    if (formData.max_students && isNaN(parseInt(formData.max_students))) {
      newErrors.max_students = 'Max students must be a valid number';
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
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        level: formData.level,
        format: formData.format,
        duration: formData.duration.trim(),
        price: formData.price ? parseFloat(formData.price) : 0,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
        technologies: formData.technologies,
        prerequisites: formData.prerequisites.trim() || null,
        learning_outcomes: formData.learning_outcomes.trim() || null,
        syllabus: formData.syllabus.trim() || null,
        next_batch_date: formData.next_batch_date || null,
      };
      
      const result = await trainingApi.create(courseData);
      
      if (result.program || result.success) {
        toast.success('Course created successfully!');
        navigate('/courses');
      } else {
        toast.error(result.error || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(error.message || 'Failed to create course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formData, navigate, toast]);

  const isFormDisabled = submitting;

  return (
    <div className="min-h-[calc(100vh-4rem)] mt-16 flex items-center justify-center py-12">
      <Container className="w-full max-w-3xl">
        <Link 
          to="/courses" 
          className="inline-flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-sm mb-8 hover:text-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          BACK TO COURSES
        </Link>

        <Card className="tech-panel-strong border-glow-blue">
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl font-display uppercase tracking-tight mb-2">
              CREATE A COURSE
            </CardTitle>
            <CardDescription className="text-muted-foreground font-mono uppercase tracking-[0.2em] text-sm">
              SHARE YOUR RPA EXPERTISE WITH LEARNERS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Title */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                  <BookOpen className="h-3 w-3" />
                  COURSE TITLE <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  disabled={isFormDisabled}
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Complete UiPath Developer Bootcamp"
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-destructive font-mono">{errors.title}</p>
                )}
              </div>

              {/* Course Description */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2">
                  COURSE DESCRIPTION <span className="text-destructive">*</span>
                </label>
                <Textarea
                  required
                  disabled={isFormDisabled}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe what students will learn, key topics covered, and who this course is for..."
                  rows={4}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-destructive font-mono">{errors.description}</p>
                )}
              </div>

              {/* Level & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2">
                    SKILL LEVEL
                  </label>
                  <Select
                    disabled={isFormDisabled}
                    value={formData.level}
                    onChange={(e) => updateField('level', e.target.value)}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all_levels">All Levels</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2">
                    FORMAT
                  </label>
                  <Select
                    disabled={isFormDisabled}
                    value={formData.format}
                    onChange={(e) => updateField('format', e.target.value)}
                  >
                    <option value="online">Online Live</option>
                    <option value="offline">In-Person</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="self_paced">Self-Paced</option>
                  </Select>
                </div>
              </div>

              {/* Duration & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    DURATION <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    disabled={isFormDisabled}
                    value={formData.duration}
                    onChange={(e) => updateField('duration', e.target.value)}
                    placeholder="e.g., 8 weeks"
                    className={errors.duration ? 'border-destructive' : ''}
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-destructive font-mono">{errors.duration}</p>
                  )}
                </div>
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    PRICE (₹)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    disabled={isFormDisabled}
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    placeholder="0 for free"
                    className={errors.price ? 'border-destructive' : ''}
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-destructive font-mono">{errors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    MAX STUDENTS
                  </label>
                  <Input
                    type="number"
                    min="1"
                    disabled={isFormDisabled}
                    value={formData.max_students}
                    onChange={(e) => updateField('max_students', e.target.value)}
                    placeholder="Unlimited"
                    className={errors.max_students ? 'border-destructive' : ''}
                  />
                </div>
              </div>

              {/* Next Batch Date */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  NEXT BATCH START DATE
                </label>
                <Input
                  type="date"
                  disabled={isFormDisabled}
                  value={formData.next_batch_date}
                  onChange={(e) => updateField('next_batch_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2">
                  TECHNOLOGIES COVERED
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
                <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border border-border max-h-40 overflow-y-auto">
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
                    ['UiPath', 'Automation Anywhere', 'Blue Prism', 'Power Automate', 'Python', 'SQL'].map((tech) => (
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
              </div>

              {/* Prerequisites */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2">
                  PREREQUISITES
                </label>
                <Textarea
                  disabled={isFormDisabled}
                  value={formData.prerequisites}
                  onChange={(e) => updateField('prerequisites', e.target.value)}
                  placeholder="List any required prior knowledge or skills..."
                  rows={2}
                />
              </div>

              {/* Learning Outcomes */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2">
                  LEARNING OUTCOMES
                </label>
                <Textarea
                  disabled={isFormDisabled}
                  value={formData.learning_outcomes}
                  onChange={(e) => updateField('learning_outcomes', e.target.value)}
                  placeholder="What will students be able to do after completing this course?"
                  rows={3}
                />
              </div>

              {/* Syllabus */}
              <div>
                <label className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2">
                  SYLLABUS / CURRICULUM
                </label>
                <Textarea
                  disabled={isFormDisabled}
                  value={formData.syllabus}
                  onChange={(e) => updateField('syllabus', e.target.value)}
                  placeholder="Outline the topics and modules covered..."
                  rows={4}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1 font-display uppercase tracking-wider glow-blue"
                  disabled={isFormDisabled}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      CREATING...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      CREATE COURSE
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/courses')}
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

CreateCourse.displayName = 'CreateCourse';

export default CreateCourse;






