import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, SkeletonLoader } from '../components/common/LoadingSpinner';
import { useProjectStore } from '../store/projectStore';
import { useEffect, useState, memo, useCallback } from 'react';
import { Clock, DollarSign, Building2, ArrowLeft, CheckCircle, Activity } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';

export const ProjectDetail = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProject } = useProjectStore();
  const { isAuthenticated, role } = useAuthStore();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = () => {
      try {
        const projectData = getProject(id);
        if (projectData) {
          setProject(projectData);
        } else {
          toast.error('Project not found');
          navigate('/projects');
        }
      } catch {
        toast.error('Failed to load project');
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, getProject, navigate, toast]);

  const handleApply = useCallback(() => {
    if (!isAuthenticated) {
      toast.warning('Please sign in to apply');
      navigate('/sign-in');
      return;
    }

    if (role === 'client') {
      toast.warning('Clients cannot apply to projects');
      return;
    }

    toast.success('Application submitted successfully!');
  }, [isAuthenticated, role, navigate, toast]);

  if (loading) {
    return (
      <Container className="py-12">
        <div className="max-w-4xl mx-auto">
          <SkeletonLoader lines={3} className="mb-6" />
          <SkeletonLoader lines={5} />
        </div>
      </Container>
    );
  }

  if (!project) {
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

  return (
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
                  <div className="flex items-center text-muted-foreground">
                    <Building2 className="mr-1.5 h-3 w-3 text-secondary" />
                    {project.industry}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="mr-1.5 h-3 w-3 text-secondary" />
                    {project.timeline}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <DollarSign className="mr-1.5 h-3 w-3 text-secondary" />
                    {project.budget}
                  </div>
                </div>

                <div className="mb-4">
                  <h2 className="text-base font-black text-foreground mb-2 font-display uppercase">DESCRIPTION</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono text-xs">
                    {project.description}
                  </p>
                </div>

                <div className="mb-4">
                  <h2 className="text-base font-black text-foreground mb-2 font-display uppercase">AUTOMATION TYPE</h2>
                  <Badge variant="info" className="text-sm px-3 py-1 font-mono uppercase">
                    {project.automationType}
                  </Badge>
                </div>

                {project.requirements && (
                  <div>
                    <h2 className="text-base font-black text-foreground mb-2 font-display uppercase">REQUIREMENTS</h2>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 font-mono text-xs">
                      {project.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
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
                    <p className="text-foreground font-semibold font-display text-sm">{project.budget}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5 font-mono uppercase">Timeline</p>
                    <p className="text-foreground font-semibold font-display text-sm">{project.timeline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {project.status === 'open' && (
              <Card className="tech-panel border-glow-red">
                <CardContent className="pt-4 pb-4">
                  <Button
                    variant="primary"
                    className="w-full font-display uppercase tracking-wider glow-red text-sm"
                    onClick={handleApply}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    APPLY TO PROJECT
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-muted-foreground text-xs mt-2 text-center font-mono">
                      Sign in to apply
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
});

ProjectDetail.displayName = 'ProjectDetail';

