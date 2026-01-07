import { memo, forwardRef } from 'react';
import clsx from 'clsx';

export const Button = memo(forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled,
  type = 'button',
  loading = false,
  ...props
}, ref) => {
  const baseStyles = `
    font-medium 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    uppercase tracking-wider rounded-md
    relative overflow-hidden
    transition-all duration-200 ease-out
    transform-gpu
    active:scale-[0.97]
    will-change-transform
    inline-flex items-center justify-center
  `;
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary border border-primary hover:shadow-lg hover:shadow-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary border border-secondary hover:shadow-lg hover:shadow-secondary/20',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive border border-destructive',
    ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-ring',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring hover:border-primary',
    terminal: 'bg-card text-foreground border border-border font-mono hover:border-secondary focus:ring-ring',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-base h-10',
    lg: 'px-6 py-3 text-lg h-12',
    xl: 'px-8 py-4 text-xl h-14',
    icon: 'h-10 w-10 p-0 flex items-center justify-center',
    default: 'px-4 py-2 text-sm h-9',
  };
  
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        loading && 'pointer-events-none',
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
      {...props}
    >
      {/* Loading spinner overlay */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit">
          <span 
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            style={{
              animation: 'spin 0.7s linear infinite',
            }}
          />
        </span>
      )}
      
      {/* Content */}
      <span className={clsx(
        'flex items-center justify-center gap-2',
        loading && 'opacity-0'
      )}>
        {children}
      </span>
      
      {/* Ripple effect container */}
      <span className="absolute inset-0 pointer-events-none" aria-hidden="true" />
    </button>
  );
}));

Button.displayName = 'Button';
