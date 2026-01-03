import clsx from 'clsx';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-card text-foreground border border-border',
    success: 'bg-green-500/20 text-green-500 border border-green-500/30',
    warning: 'bg-accent/20 text-accent border border-accent/30',
    danger: 'bg-destructive/20 text-destructive border border-destructive/30',
    info: 'bg-secondary/20 text-secondary border border-secondary/30',
    primary: 'bg-primary/20 text-primary border border-primary/30',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

