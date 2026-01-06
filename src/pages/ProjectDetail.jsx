import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { LoadingSpinner, SkeletonLoader } from '../components/common/LoadingSpinner';
import { ProjectApplicationsManager } from '../components/applications/ProjectApplicationsManager';
import { projectApi } from '../services/api';
import { useEffect, useState, memo, useCallback } from 'react';
import { Clock, DollarSign, Building2, ArrowLeft, CheckCircle, Activity, Loader2, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';

export const ProjectDetail = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, profile } = useAuthStore();
  const role = profile?.user_type || user?.user_type || null;
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({
    cover_letter: '',
    proposed_rate: '',
    estimated_duration: ''
  });
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const { project: projectData } = await projectApi.getById(id);
        setProject(projectData);
      } catch (err) {
        console.error('Failed to load project:', err);
        toast.error(err.error || 'Failed to load project');
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProject();
    }
  }, [id, navigate, toast]);

  const handleApply = useCallback(async () => {
    if (!isAuthenticated) {
      toast.warning('Please sign in to apply');
      navigate('/sign-in', { state: { returnTo: `/projects/${id}` } });
      return;
    }

    if (role === 'client' || role === 'employer') {
      toast.warning('Clients cannot apply to projects');
      return;
    }

    if (!applicationData.cover_letter.trim()) {
      toast.error('Please provide a cover letter');
      return;
    }

    setApplying(true);
    try {
      await projectApi.apply(id, {
        cover_letter: applicationData.cover_letter,
        proposed_rate: applicationData.proposed_rate ? parseFloat(applicationData.proposed_rate) : null,
        estimated_duration: applicationData.estimated_duration || null
      });
      toast.success('Application submitted successfully!');
      setApplicationData({ cover_letter: '', proposed_rate: '', estimated_duration: '' });
      setShowApplicationForm(false);
      // Reload project to update application count and has_applied flag
      const { project: updatedProject } = await projectApi.getById(id);
      setProject(updatedProject);
    } catch (err) {
      toast.error(err.error || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  }, [isAuthenticated, role, navigate, toast, id, applicationData]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20">
        <Container className="py-12">
          <div className="max-w-4xl mx-auto">
            <SkeletonLoader lines={3} className="mb-6" />
            <SkeletonLoader lines={5} />
          </div>
        </Container>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen pt-20">
        <Container className="py-12">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-muted-foreground">Project not found</p>
          </div>
        </Container>
      </div>
    );
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatBudget = () => {
    if (project.budget_min && project.budget_max) {
      return `₹${project.budget_min.toLocaleString()} - ₹${project.budget_max.toLocaleString()}`;
    } else if (project.budget_min) {
      return `₹${project.budget_min.toLocaleString()}+`;
    } else if (project.budget_max) {
      return `Up to ₹${project.budget_max.toLocaleString()}`;
    }
    return 'Not specified';
  };

  return (
    <div className="min-h-screen pt-20">
      <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-xs mb-4 hover:text-secondary transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          BACK TO PROJECTS
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="tech-panel-strong border-glow-blue">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-3">
                  <CardTitle className="text-2xl font-display">{project.title}</CardTitle>
                  <Badge variant={getUrgencyColor(project.urgency)} className="font-mono uppercase text-xs">
                    {project.urgency}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-4 text-sm">
                  {project.client && (
                    <div className="flex items-center text-muted-foreground">
                      <Building2 className="mr-1.5 h-3 w-3 text-secondary" />
                      {project.client.company_name || project.client.full_name || 'Client'}
                    </div>
                  )}
                  {project.deadline && (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-1.5 h-3 w-3 text-secondary" />
                      Deadline: {new Date(project.deadline).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center text-muted-foreground">
                    <DollarSign className="mr-1.5 h-3 w-3 text-secondary" />
                    {formatBudget()}
                  </div>
                </div>

                <div className="mb-4">
                  <h2 className="text-base font-black text-foreground mb-2 font-display uppercase">DESCRIPTION</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono text-xs">
                    {project.description}
                  </p>
                </div>

                {/* Technologies */}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-base font-black text-foreground mb-2 font-display uppercase">TECHNOLOGIES</h2>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, index) => (
                        <Badge key={index} variant="info" className="text-sm px-3 py-1 font-mono uppercase">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.requirements && (
                  <div>
                    <h2 className="text-base font-black text-foreground mb-2 font-display uppercase">REQUIREMENTS</h2>
                    <div className="text-muted-foreground whitespace-pre-wrap font-mono text-xs">
                      {typeof project.requirements === 'string' 
                        ? project.requirements 
                        : Array.isArray(project.requirements)
                          ? project.requirements.map((req, index) => <div key={index}>• {req}</div>)
                          : JSON.stringify(project.requirements)
                      }
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="tech-panel border-glow-blue">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display uppercase">PROJECT DETAILS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5 font-mono uppercase">Status</p>
                    <Badge variant={project.status === 'open' ? 'success' : 'default'} className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5 font-mono uppercase">Urgency</p>
                    <Badge variant={getUrgencyColor(project.urgency)} className="text-xs">{project.urgency}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5 font-mono uppercase">Budget</p>
                    <p className="text-foreground font-semibold font-display text-sm">{formatBudget()}</p>
                  </div>
                  {project.deadline && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5 font-mono uppercase">Deadline</p>
                      <p className="text-foreground font-semibold font-display text-sm">
                        {new Date(project.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {project.application_count !== undefined && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5 font-mono uppercase">Applications</p>
                      <p className="text-foreground font-semibold font-display text-sm">
                        {project.application_count}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {project.status === 'open' && (
              <Card className="tech-panel border-glow-red">
                <CardContent className="pt-4 pb-4">
                  {/* Show Manage Applications if user is the project poster */}
                  {isAuthenticated && user && project.client_id === user.id && (
                    <Button
                      onClick={() => setShowApplicationsModal(true)}
                      variant="primary"
                      className="w-full font-display uppercase tracking-wider glow-red text-sm"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      MANAGE APPLICATIONS
                    </Button>
                  )}

                  {/* If already applied, show submitted state */}
                  {isAuthenticated && project.has_applied && project.client_id !== user?.id && (
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        variant="outline"
                        className="w-full font-display uppercase tracking-wider text-xs cursor-default"
                        disabled
                      >
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        APPLICATION SUBMITTED
                      </Button>
                      <p className="text-muted-foreground text-xs text-center font-mono">
                        You have already applied to this project.
                      </p>
                    </div>
                  )}

                  {/* Show Apply button only for freelancer, ba_pm, trainer roles if not yet applied */}
                  {!project.has_applied &&
                   !showApplicationForm &&
                   isAuthenticated &&
                   user &&
                   project.client_id !== user.id &&
                   (role === 'freelancer' || role === 'ba_pm' || role === 'trainer' || role === 'developer' || role === 'job_seeker') && (
                    <Button
                      variant="primary"
                      className="w-full font-display uppercase tracking-wider glow-red text-sm"
                      onClick={() => setShowApplicationForm(true)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      APPLY TO PROJECT
                    </Button>
                  )}

                  {/* Show sign in prompt for non-authenticated users */}
                  {!isAuthenticated && !showApplicationForm && (
                    <>
                      <Button
                        variant="primary"
                        className="w-full font-display uppercase tracking-wider glow-red text-sm"
                        onClick={() => navigate('/sign-in', { state: { returnTo: `/projects/${id}` } })}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        SIGN IN TO APPLY
                      </Button>
                      <p className="text-muted-foreground text-xs mt-2 text-center font-mono">
                        Sign in to apply for this project
                      </p>
                    </>
                  )}

                  {/* Show message for roles that can't apply */}
                  {isAuthenticated && user && project.client_id !== user.id && 
                   role !== 'freelancer' && role !== 'ba_pm' && role !== 'trainer' && role !== 'developer' && role !== 'job_seeker' && 
                   role !== null && !showApplicationForm && (
                    <p className="text-muted-foreground text-xs text-center font-mono">
                      Only freelancers, trainers, BA/PMs, developers, and job seekers can apply to projects
                    </p>
                  )}

                  {/* Application form */}
                  {showApplicationForm && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-mono uppercase mb-1">COVER LETTER *</Label>
                        <Textarea
                          value={applicationData.cover_letter}
                          onChange={(e) => setApplicationData(prev => ({ ...prev, cover_letter: e.target.value }))}
                          placeholder="Explain why you're a good fit for this project..."
                          rows={4}
                          className="bg-background border-input text-foreground placeholder-muted-foreground font-mono text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-mono uppercase mb-1">PROPOSED RATE</Label>
                          <Input
                            type="number"
                            value={applicationData.proposed_rate}
                            onChange={(e) => setApplicationData(prev => ({ ...prev, proposed_rate: e.target.value }))}
                            placeholder="₹/hr"
                            className="bg-background border-input text-foreground placeholder-muted-foreground font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-mono uppercase mb-1">EST. DURATION</Label>
                          <Input
                            value={applicationData.estimated_duration}
                            onChange={(e) => setApplicationData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                            placeholder="e.g., 4 weeks"
                            className="bg-background border-input text-foreground placeholder-muted-foreground font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleApply}
                          disabled={applying}
                          className="flex-1 font-mono text-xs tracking-wider"
                        >
                          {applying ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              SUBMITTING...
                            </>
                          ) : (
                            'SUBMIT APPLICATION'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowApplicationForm(false);
                            setApplicationData({ cover_letter: '', proposed_rate: '', estimated_duration: '' });
                          }}
                          className="font-mono text-xs"
                        >
                          CANCEL
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Applications Management Modal */}
      <Modal
        isOpen={showApplicationsModal}
        onClose={() => setShowApplicationsModal(false)}
        size="xl"
        title="Manage Applications"
      >
        <ProjectApplicationsManager 
          projectId={id} 
          onClose={() => setShowApplicationsModal(false)} 
        />
      </Modal>
      </Container>
    </div>
  );
});

ProjectDetail.displayName = 'ProjectDetail';

