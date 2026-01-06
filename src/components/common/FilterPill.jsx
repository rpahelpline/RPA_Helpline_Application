import { memo } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable filter pill component for filtering UI
 * 
 * @param {Object} props
 * @param {string} props.label - Filter label text
 * @param {boolean} props.active - Whether the filter is active
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onRemove - Remove/clear handler (shows X button when provided)
 * @param {boolean} props.disabled - Disable the pill
 * @param {string} props.variant - Visual variant: 'default' | 'primary' | 'secondary' | 'outline'
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg'
 * @param {React.ReactNode} props.icon - Optional icon element
 * @param {number} props.count - Optional count badge
 * @param {string} props.className - Additional CSS classes
 */
export const FilterPill = memo(({
  label,
  active = false,
  onClick,
  onRemove,
  disabled = false,
  variant = 'default',
  size = 'md',
  icon,
  count,
  className = '',
}) => {
  // Size-based classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };
  
  // Variant-based classes
  const variantClasses = {
    default: active
      ? 'bg-primary text-white border-primary'
      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50',
    primary: active
      ? 'bg-primary text-white border-primary'
      : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20',
    secondary: active
      ? 'bg-secondary text-white border-secondary'
      : 'bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20',
    outline: active
      ? 'bg-foreground text-background border-foreground'
      : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground',
  };
  
  const baseClasses = 'inline-flex items-center rounded-full border font-mono tracking-wide transition-all duration-200';
  const interactiveClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer';
  
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };
  
  const handleRemove = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove?.();
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          active ? 'bg-white/20' : 'bg-muted'
        }`}>
          {count}
        </span>
      )}
      {onRemove && active && (
        <button
          type="button"
          onClick={handleRemove}
          className={`ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors ${
            size === 'sm' ? '-mr-0.5' : '-mr-1'
          }`}
          aria-label={`Remove ${label} filter`}
        >
          <X className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        </button>
      )}
    </button>
  );
});

FilterPill.displayName = 'FilterPill';

/**
 * Filter pill group for consistent filter layout
 */
export const FilterPillGroup = memo(({
  children,
  label,
  className = '',
}) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    {label && (
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider mr-2">
        {label}:
      </span>
    )}
    {children}
  </div>
));

FilterPillGroup.displayName = 'FilterPillGroup';

/**
 * Active filters display component
 */
export const ActiveFilters = memo(({
  filters = [],
  onRemove,
  onClearAll,
  className = '',
}) => {
  if (filters.length === 0) return null;
  
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        Active Filters:
      </span>
      {filters.map((filter, index) => (
        <FilterPill
          key={`${filter.key || filter.label}-${index}`}
          label={filter.label}
          active={true}
          onRemove={() => onRemove?.(filter)}
          size="sm"
        />
      ))}
      {filters.length > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-mono text-destructive hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
});

ActiveFilters.displayName = 'ActiveFilters';

export default FilterPill;


