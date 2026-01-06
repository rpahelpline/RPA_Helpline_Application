import { memo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileSearch, FolderOpen, Users, Briefcase, BookOpen, 
  MessageCircle, Bell, Search, Plus, ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Preset icons for common empty states
const presetIcons = {
  search: Search,
  files: FolderOpen,
  users: Users,
  jobs: Briefcase,
  projects: Briefcase,
  courses: BookOpen,
  messages: MessageCircle,
  notifications: Bell,
  default: FileSearch,
};

/**
 * Reusable EmptyState component for consistent empty state displays
 * 
 * @param {Object} props
 * @param {string|React.ComponentType} props.icon - Icon name (preset) or custom icon component
 * @param {string} props.title - Main title text
 * @param {string} props.description - Description text
 * @param {string} props.actionLabel - Primary action button label
 * @param {string} props.actionLink - Primary action button link
 * @param {Function} props.onAction - Primary action button click handler
 * @param {string} props.secondaryLabel - Secondary action button label
 * @param {string} props.secondaryLink - Secondary action button link
 * @param {string} props.variant - Visual variant: 'card' | 'inline' | 'minimal'
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg'
 * @param {string} props.className - Additional CSS classes
 */
export const EmptyState = memo(({
  icon = 'default',
  title = 'No items found',
  description,
  actionLabel,
  actionLink,
  onAction,
  secondaryLabel,
  secondaryLink,
  variant = 'card',
  size = 'md',
  className = '',
  children,
}) => {
  // Determine the icon component
  const IconComponent = typeof icon === 'string' 
    ? (presetIcons[icon] || presetIcons.default)
    : icon;
  
  // Size-based classes
  const sizeClasses = {
    sm: {
      container: 'py-6',
      icon: 'w-8 h-8',
      title: 'text-base',
      description: 'text-xs',
    },
    md: {
      container: 'py-10',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
    },
  };
  
  const sizes = sizeClasses[size] || sizeClasses.md;
  
  // Content component
  const Content = (
    <div className={`text-center ${sizes.container} ${className}`}>
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
        <IconComponent className={`${sizes.icon} text-muted-foreground`} />
      </div>
      
      <h3 className={`font-display font-semibold text-foreground mb-2 ${sizes.title}`}>
        {title}
      </h3>
      
      {description && (
        <p className={`text-muted-foreground mb-6 max-w-md mx-auto ${sizes.description}`}>
          {description}
        </p>
      )}
      
      {/* Action buttons */}
      {(actionLabel || secondaryLabel) && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {actionLabel && (
            actionLink ? (
              <Link to={actionLink}>
                <Button variant="primary" className="font-mono text-xs tracking-wider">
                  <Plus className="w-4 h-4 mr-1" />
                  {actionLabel}
                </Button>
              </Link>
            ) : onAction ? (
              <Button 
                variant="primary" 
                onClick={onAction}
                className="font-mono text-xs tracking-wider"
              >
                <Plus className="w-4 h-4 mr-1" />
                {actionLabel}
              </Button>
            ) : null
          )}
          
          {secondaryLabel && secondaryLink && (
            <Link to={secondaryLink}>
              <Button variant="outline" className="font-mono text-xs tracking-wider">
                {secondaryLabel}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      )}
      
      {/* Custom children content */}
      {children}
    </div>
  );
  
  // Render based on variant
  if (variant === 'minimal') {
    return Content;
  }
  
  if (variant === 'inline') {
    return (
      <div className={`border border-dashed border-border rounded-lg ${className}`}>
        {Content}
      </div>
    );
  }
  
  // Default: card variant
  return (
    <Card className={`tech-panel ${className}`}>
      {Content}
    </Card>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * Preset empty states for common use cases
 */
export const EmptyStates = {
  // Search results
  NoSearchResults: (props) => (
    <EmptyState
      icon="search"
      title="No results found"
      description="Try adjusting your search or filters to find what you're looking for."
      {...props}
    />
  ),
  
  // Jobs
  NoJobs: (props) => (
    <EmptyState
      icon="jobs"
      title="No jobs posted yet"
      description="Post your first job to start receiving applications from talented RPA professionals."
      actionLabel="POST A JOB"
      actionLink="/post-job"
      {...props}
    />
  ),
  
  // Projects
  NoProjects: (props) => (
    <EmptyState
      icon="projects"
      title="No projects posted yet"
      description="Create your first project to find skilled RPA developers."
      actionLabel="POST A PROJECT"
      actionLink="/register/project"
      {...props}
    />
  ),
  
  // Applications
  NoApplications: (props) => (
    <EmptyState
      icon="files"
      title="No applications yet"
      description="Applications will appear here once candidates start applying."
      {...props}
    />
  ),
  
  // Courses
  NoCourses: (props) => (
    <EmptyState
      icon="courses"
      title="No courses available"
      description="Check back later for new training programs."
      {...props}
    />
  ),
  
  // Messages
  NoMessages: (props) => (
    <EmptyState
      icon="messages"
      title="No messages yet"
      description="Start a conversation with other users to see your messages here."
      {...props}
    />
  ),
  
  // Notifications
  NoNotifications: (props) => (
    <EmptyState
      icon="notifications"
      title="All caught up!"
      description="You have no new notifications."
      {...props}
    />
  ),
};

export default EmptyState;

