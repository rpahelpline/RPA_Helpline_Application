import { memo, Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb item type
 * @typedef {Object} BreadcrumbItem
 * @property {string} label - Display label
 * @property {string} [href] - Optional link href
 * @property {React.ReactNode} [icon] - Optional icon
 */

/**
 * Breadcrumb navigation component
 * 
 * @param {Object} props
 * @param {BreadcrumbItem[]} props.items - Array of breadcrumb items
 * @param {boolean} props.showHome - Whether to show home link at start
 * @param {string} props.separator - Separator character/element
 * @param {string} props.className - Additional CSS classes
 */
export const Breadcrumb = memo(({
  items = [],
  showHome = true,
  separator,
  className = '',
}) => {
  const location = useLocation();
  
  // Build breadcrumb items
  const allItems = showHome 
    ? [{ label: 'Home', href: '/', icon: <Home className="w-3 h-3" /> }, ...items]
    : items;
  
  if (allItems.length === 0) return null;
  
  return (
    <nav 
      aria-label="Breadcrumb"
      className={`flex items-center text-sm font-mono ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isClickable = !isLast && item.href;
          
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className="flex items-center">
                {isClickable ? (
                  <Link
                    to={item.href}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider text-xs"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span 
                    className={`flex items-center gap-1.5 uppercase tracking-wider text-xs ${
                      isLast ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
              
              {!isLast && (
                <li aria-hidden="true" className="text-muted-foreground/50 mx-1">
                  {separator || <ChevronRight className="w-3 h-3" />}
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
});

Breadcrumb.displayName = 'Breadcrumb';

/**
 * Auto-generated breadcrumb from current route
 * Useful for simple hierarchical navigation
 */
export const AutoBreadcrumb = memo(({
  customLabels = {},
  excludePatterns = [],
  className = '',
}) => {
  const location = useLocation();
  
  // Parse path segments
  const pathSegments = location.pathname
    .split('/')
    .filter(segment => segment && !excludePatterns.includes(segment));
  
  // Build items from path
  const items = pathSegments.map((segment, index) => {
    // Build href up to this segment
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    
    // Use custom label if provided, otherwise format the segment
    const label = customLabels[segment] || customLabels[href] || 
      segment
        .replace(/-/g, ' ')
        .replace(/^\w/, c => c.toUpperCase());
    
    return {
      label,
      href: index < pathSegments.length - 1 ? href : undefined,
    };
  });
  
  return <Breadcrumb items={items} className={className} />;
});

AutoBreadcrumb.displayName = 'AutoBreadcrumb';

/**
 * Common breadcrumb labels for the app
 */
export const breadcrumbLabels = {
  'jobs': 'Jobs',
  'projects': 'Projects',
  'courses': 'Courses',
  'talent': 'Talent',
  'dashboard': 'Dashboard',
  'profile': 'Profile',
  'messages': 'Messages',
  'notifications': 'Notifications',
  'settings': 'Settings',
  'post-job': 'Post Job',
  'register': 'Register',
  'sign-in': 'Sign In',
  'admin': 'Admin',
  'create-course': 'Create Course',
  'applications': 'Applications',
};

export default Breadcrumb;

