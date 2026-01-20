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
import { useEffect, useState, memo, useCallback, useRef } from 'react';
import { Clock, DollarSign, Building2, ArrowLeft, CheckCircle, Activity, Loader2, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';

export const ProjectDetail = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, profile } = useAuthStore();
  const role = profile?.user_type || user?.user_type || null;
  const toast = useToast();
  const toastRef = useRef(toast);
  const rateLimitRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const loadingTimeoutRef = useRef(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({
    cover_letter: '',
    proposed_rate: '',
    estimated_duration: ''
  });
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Reset flags when ID changes
    const currentProjectId = project?.id;
    if (currentProjectId !== id) {
      hasLoadedRef.current = false;
      rateLimitRef.current = false;
      setLoadError(null);
    }

    // Only skip if we've successfully loaded THIS specific project
    if (hasLoadedRef.current && currentProjectId === id && project && !loadError) {
      return;
    }

    // Don't auto-retry if we're rate limited (manual retry only)
    if (rateLimitRef.current && loadError?.status === 429 && !hasLoadedRef.current) {
      setLoading(false);
      return;
    }

    // Safety timeout: Always stop loading after 15 seconds max
    loadingTimeoutRef.current = setTimeout(() => {
      if (!cancelled) {
        console.warn('[ProjectDetail] Loading timeout - forcing stop');
        setLoading(false);
        setLoadError(prev => prev || {
          status: 0,
          error: 'Request timeout',
          message: 'The request took too long. Please try again.'
        });
      }
    }, 15000);

    const loadProject = async () => {
      if (!cancelled) {
        setLoading(true);
        setLoadError(null);
        rateLimitRef.current = false;
      }

      try {
        console.log('[ProjectDetail] Fetching project:', id);
        const response = await projectApi.getById(id);
        console.log('[ProjectDetail] API response:', response);
        
        const projectData = response?.project || response;
        console.log('[ProjectDetail] Extracted project data:', projectData);
        
        if (!cancelled) {
          if (!projectData || !projectData.id) {
            console.error('[ProjectDetail] Invalid project data received:', projectData);
            setLoadError({
              status: 500,
              error: 'Invalid response',
              message: 'The server returned invalid project data.'
            });
            setLoading(false);
            hasLoadedRef.current = false;
          } else {
            console.log('[ProjectDetail] Setting project:', projectData.id);
            setProject(projectData);
            setLoading(false);
            rateLimitRef.current = false;
            hasLoadedRef.current = true;
          }
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        }
      } catch (err) {
        console.error('[ProjectDetail] Failed to load project:', err);
        if (!cancelled) {
          setLoadError(err);
          setLoading(false);
          hasLoadedRef.current = false;
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
          // Mark rate limit so we don't retry automatically
          if (err?.status === 429) {
            rateLimitRef.current = true;
            console.warn('[ProjectDetail] Rate limited - stopping automatic retries');
          } else {
            // Only show toast for non-429 errors
            toastRef.current?.error?.(err?.error || err?.message || 'Failed to load project');
          }
        }
      }
    };

    if (id) {
      loadProject();
    } else {
      setLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
    
    return () => {
      cancelled = true;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id

  const handleRetryLoad = useCallback(async () => {
    if (!id) return;
    try {
      // Reset flags on manual retry
      rateLimitRef.current = false;
      hasLoadedRef.current = false;
      setLoading(true);
      setLoadError(null);
      
      // Wait a bit before retrying if it was a rate limit error
      const wasRateLimited = loadError?.status === 429;
      if (wasRateLimited) {
        const retryAfter = loadError?.data?.retryAfter || 5;
        console.log(`[ProjectDetail] Waiting ${retryAfter}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      }
      
      const response = await projectApi.getById(id);
      const projectData = response?.project || response;
      if (!projectData || !projectData.id) {
        throw new Error('Invalid project data received');
      }
      setProject(projectData);
      setLoading(false);
      rateLimitRef.current = false; // Reset on success
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load project (retry):', err);
      setLoadError(err);
      setLoading(false); // CRITICAL: Always stop loading
      hasLoadedRef.current = false;
      // Mark rate limit again if still rate limited
      if (err?.status === 429) {
        rateLimitRef.current = true;
      }
      // Only show toast for non-429 errors
      if (err?.status !== 429) {
        toastRef.current?.error?.(err?.error || err?.message || 'Failed to load project');
      }
    }
  }, [id, loadError]);

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
      const response = await projectApi.getById(id);
      const updatedProject = response?.project || response;
      if (updatedProject && updatedProject.id) {
        setProject(updatedProject);
      }
    } catch (err) {
      toast.error(err.error || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  }, [isAuthenticated, role, navigate, toast, id, applicationData]);

  // Debug logging
  useEffect(() => {
    console.log('[ProjectDetail] Render state:', {
      id,
      loading,
      hasProject: !!project,
      projectId: project?.id,
      hasError: !!loadError,
      errorStatus: loadError?.status
    });
  }, [id, loading, project, loadError]);

  // Show loading state
  if (loading && !project) {
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

  // Show error state
  if (loadError) {
    const isRateLimited = loadError?.status === 429;
    const retryAfter = loadError?.data?.retryAfter;

    return (
      <div className="min-h-screen pt-20">
        <Container className="py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="tech-panel border-border">
              <CardHeader>
                <CardTitle className="text-lg font-display">Unable to load project</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {isRateLimited
                    ? `Rate limited${retryAfter ? ` (retry after ~${retryAfter}s)` : ''}. Please wait and try again.`
                    : (loadError?.error || loadError?.message || 'An unexpected error occurred.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate('/projects')} className="font-mono text-xs">
                  BACK TO PROJECTS
                </Button>
                <Button onClick={handleRetryLoad} className="font-mono text-xs">
                  RETRY
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  if (!project && !loading && !loadError) {
    return (
      <div className="min-h-screen pt-20">
        <Container className="py-12">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-muted-foreground">Project not found</p>
            <Button onClick={handleRetryLoad} className="mt-4 font-mono text-xs">
              RETRY
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  if (!project) {
    // Still loading or in error state - already handled above
    return null;
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
    <div className="min-h-screen pt-16 md:pt-20">
      <Container className="py-6 md:py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-xs mb-4 hover:text-secondary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK TO PROJECTS
          </Link>

          {/* Mobile-first grid: sidebar shows first on mobile (order-first), second on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <Card className="tech-panel-strong border-glow-blue">
                <CardHeader className="pb-3 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                    <CardTitle className="text-xl sm:text-2xl font-display">{project.title}</CardTitle>
                    <Badge variant={getUrgencyColor(project.urgency)} className="font-mono uppercase text-xs">
                      {project.urgency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 text-sm">
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
                    <h2 className="text-sm md:text-base font-black text-foreground mb-2 font-display uppercase">DESCRIPTION</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono text-xs md:text-sm">
                      {project.description}
                    </p>
                  </div>

                  {/* Technologies */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-sm md:text-base font-black text-foreground mb-2 font-display uppercase">TECHNOLOGIES</h2>
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {project.technologies.map((tech, index) => (
                          <Badge key={index} variant="info" className="text-[10px] md:text-sm px-2 md:px-3 py-0.5 md:py-1 font-mono uppercase">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.requirements && (
                    <div>
                      <h2 className="text-sm md:text-base font-black text-foreground mb-2 font-display uppercase">REQUIREMENTS</h2>
                      <div className="text-muted-foreground whitespace-pre-wrap font-mono text-xs md:text-sm">
                        {typeof project.requirements === 'string'
                          ? project.requirements
                          : Array.isArray(project.requirements)
                            ? project.requirements.map((req, index) => <div key={index} className="mb-1">• {req}</div>)
                            : JSON.stringify(project.requirements)
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Shows first on mobile via order */}
            <div className="space-y-4 order-first lg:order-last">
              <Card className="tech-panel border-glow-blue">
                <CardHeader className="pb-2 px-4 md:px-6">
                  <CardTitle className="text-sm md:text-base font-display uppercase">PROJECT DETAILS</CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
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
                  <CardContent className="p-4 md:pt-4 md:pb-4">
                    {/* Show Manage Applications if user is the project poster */}
                    {isAuthenticated && user && project.client_id === user.id && (
                      <Button
                        onClick={() => setShowApplicationsModal(true)}
                        variant="primary"
                        className="w-full font-display uppercase tracking-wider glow-red text-xs md:text-sm min-h-[44px]"
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
                          className="w-full font-display uppercase tracking-wider text-xs cursor-default min-h-[44px]"
                          disabled
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          APPLICATION SUBMITTED
                        </Button>
                        <p className="text-muted-foreground text-[10px] md:text-xs text-center font-mono">
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
                          className="w-full font-display uppercase tracking-wider glow-red text-xs md:text-sm min-h-[44px]"
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
                          className="w-full font-display uppercase tracking-wider glow-red text-xs md:text-sm min-h-[44px]"
                          onClick={() => navigate('/sign-in', { state: { returnTo: `/projects/${id}` } })}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          SIGN IN TO APPLY
                        </Button>
                        <p className="text-muted-foreground text-[10px] md:text-xs mt-2 text-center font-mono">
                          Sign in to apply for this project
                        </p>
                      </>
                    )}

                    {/* Show message for roles that can't apply */}
                    {isAuthenticated && user && project.client_id !== user.id &&
                      role !== 'freelancer' && role !== 'ba_pm' && role !== 'trainer' && role !== 'developer' && role !== 'job_seeker' &&
                      role !== null && !showApplicationForm && (
                        <p className="text-muted-foreground text-[10px] md:text-xs text-center font-mono">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                          <div>
                            <Label className="text-xs font-mono uppercase mb-1">PROPOSED RATE</Label>
                            <Input
                              type="number"
                              value={applicationData.proposed_rate}
                              onChange={(e) => setApplicationData(prev => ({ ...prev, proposed_rate: e.target.value }))}
                              placeholder="₹/hr"
                              className="bg-background border-input text-foreground placeholder-muted-foreground font-mono text-sm mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-mono uppercase mb-1">EST. DURATION</Label>
                            <Input
                              value={applicationData.estimated_duration}
                              onChange={(e) => setApplicationData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                              placeholder="e.g., 4 weeks"
                              className="bg-background border-input text-foreground placeholder-muted-foreground font-mono text-sm mt-1"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={handleApply}
                            disabled={applying}
                            className="flex-1 font-mono text-xs tracking-wider min-h-[44px]"
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
                            className="font-mono text-xs min-h-[44px]"
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

