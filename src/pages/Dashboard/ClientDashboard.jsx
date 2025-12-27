import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useProjectStore } from '../../store/projectStore';
import { useEffect } from 'react';
import { FaProjectDiagram, FaComments, FaUserCheck, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export const ClientDashboard = () => {
  const navigate = useNavigate();
  const { projects, loadProjects } = useProjectStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const activeProjects = projects.filter(p => p.status === 'open' || p.status === 'in-progress');
  const matchedDevelopers = 12; // Mock data

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" className="bg-dark-surface/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-mono uppercase tracking-wider text-xs mb-1">ACTIVE PROJECTS</p>
              <p className="text-3xl font-black text-white font-display">{activeProjects.length}</p>
            </div>
            <FaProjectDiagram className="text-4xl text-primary-blue opacity-50" />
          </div>
        </Card>
        
        <Card variant="elevated" className="bg-dark-surface/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-mono uppercase tracking-wider text-xs mb-1">MESSAGES</p>
              <p className="text-3xl font-black text-white font-display">8</p>
            </div>
            <FaComments className="text-4xl text-primary-blue opacity-50" />
          </div>
        </Card>
        
        <Card variant="elevated" className="bg-dark-surface/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-mono uppercase tracking-wider text-xs mb-1">MATCHED DEVELOPERS</p>
              <p className="text-3xl font-black text-white font-display">{matchedDevelopers}</p>
            </div>
            <FaUserCheck className="text-4xl text-primary-blue opacity-50" />
          </div>
        </Card>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-primary-blue font-mono uppercase tracking-wider text-sm mb-2">
              // ACTIVE MISSIONS
            </p>
            <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">
              YOUR PROJECTS
            </h2>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/register/project')}
            className="font-mono uppercase tracking-wider"
          >
            <FaPlus className="mr-2" />
            NEW PROJECT
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-center py-8">No projects yet. Create your first project!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Card key={project.id} variant="elevated" className="bg-dark-surface/80 backdrop-blur-sm hover:border-primary-blue/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-white font-display">{project.title}</h3>
                  <Badge variant={project.status === 'open' ? 'success' : 'default'}>
                    {project.status?.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-gray-300 font-mono text-sm mb-4 line-clamp-2">{project.description || 'No description available'}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="info" className="font-mono uppercase text-xs">
                    {project.automationType}
                  </Badge>
                  <Button variant="secondary" size="sm" className="font-mono uppercase tracking-wider text-xs">
                    VIEW DETAILS
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

