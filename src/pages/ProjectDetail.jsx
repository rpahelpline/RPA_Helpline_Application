import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, SkeletonLoader } from '../components/common/LoadingSpinner';
import { useProjectStore } from '../store/projectStore';
import { useEffect, useState } from 'react';
import { FaClock, FaDollarSign, FaIndustry, FaUser, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/common/ToastContainer';

export const ProjectDetail = () => {
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

  const handleApply = () => {
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
  };

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
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-white font-mono uppercase tracking-wider text-sm mb-6 hover:text-primary-blue transition-colors"
        >
          <FaArrowLeft className="text-xs" />
          BACK TO PROJECTS
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="elevated" className="bg-dark-surface/80 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-black text-white font-display">{project.title}</h1>
                <Badge variant={getUrgencyColor(project.urgency)} className="font-mono uppercase">
                  {project.urgency}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="flex items-center text-gray-400">
                  <FaIndustry className="mr-2 text-primary-blue" />
                  {project.industry}
                </div>
                <div className="flex items-center text-gray-400">
                  <FaClock className="mr-2 text-primary-blue" />
                  {project.timeline}
                </div>
                <div className="flex items-center text-gray-400">
                  <FaDollarSign className="mr-2 text-primary-blue" />
                  {project.budget}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-black text-white mb-3 font-display uppercase">DESCRIPTION</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                  {project.description}
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-black text-white mb-3 font-display uppercase">AUTOMATION TYPE</h2>
                <Badge variant="info" className="text-lg px-4 py-2 font-mono uppercase">
                  {project.automationType}
                </Badge>
              </div>

              {project.requirements && (
                <div>
                  <h2 className="text-xl font-black text-white mb-3 font-display uppercase">REQUIREMENTS</h2>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 font-mono text-sm">
                    {project.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card variant="elevated" className="bg-dark-surface/80 backdrop-blur-sm">
              <h3 className="text-xl font-black text-white mb-4 font-display uppercase">PROJECT DETAILS</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <Badge variant={project.status === 'open' ? 'success' : 'default'}>
                    {project.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Urgency</p>
                  <Badge variant={getUrgencyColor(project.urgency)}>{project.urgency}</Badge>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Budget</p>
                  <p className="text-white font-semibold">{project.budget}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Timeline</p>
                  <p className="text-white font-semibold">{project.timeline}</p>
                </div>
              </div>
            </Card>

            {project.status === 'open' && (
              <Card variant="elevated" className="bg-dark-surface/80 backdrop-blur-sm">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleApply}
                >
                  <FaCheckCircle className="mr-2" />
                  APPLY TO PROJECT
                </Button>
                {!isAuthenticated && (
                  <p className="text-gray-400 text-sm mt-3 text-center">
                    Sign in to apply for this project
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

