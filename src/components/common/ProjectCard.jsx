import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';

export const ProjectCard = memo(({ project, getUrgencyBgColor }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/projects/${project.id}`);
  };

  return (
    <Card
      variant="elevated"
      className="hover:border-primary-blue/50 transition-all duration-300 cursor-pointer bg-dark-surface/80 backdrop-blur-sm transform hover:scale-[1.02] will-change-transform"
      onClick={handleClick}
    >
      {/* Job Title */}
      <h3 className="text-xl font-bold text-white mb-3 font-display">
        {project.title}
      </h3>

      {/* Company */}
      <p className="text-gray-300 font-mono text-sm mb-3">
        {project.company || 'Company Name'}
      </p>

      {/* Location and Type */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs font-mono text-gray-400">
        <span>{project.location || 'Location'}</span>
        <span className="text-primary-blue">•</span>
        <span>{project.type || 'Type'}</span>
      </div>

      {/* Salary */}
      <p className="text-white font-semibold mb-4 font-mono">
        {project.salary || project.budget || 'Salary not specified'}
      </p>

      {/* Urgency Badge */}
      <div className="flex justify-end">
        <span
          className={`${getUrgencyBgColor(project.urgency)} text-dark-bg px-3 py-1 rounded font-mono uppercase text-xs font-bold`}
        >
          {project.urgency || 'MEDIUM'}
        </span>
      </div>
    </Card>
  );
});

ProjectCard.displayName = 'ProjectCard';


