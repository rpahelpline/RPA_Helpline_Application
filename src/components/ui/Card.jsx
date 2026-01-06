import { memo, forwardRef } from 'react';
import clsx from 'clsx';

export const Card = memo(forwardRef(({
  children,
  className,
  variant = 'default',
  hover = false,
  glow = false,
  onClick,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-card/80 backdrop-blur-sm border border-border',
    elevated: 'bg-card/80 backdrop-blur-sm border border-border shadow-lg shadow-black/20',
    outline: 'bg-transparent border border-secondary/20',
    terminal: 'bg-background border border-secondary/30 font-mono',
    ghost: 'bg-transparent border-transparent',
    solid: 'bg-card border border-border',
    primary: 'bg-primary/5 border border-primary/30',
    secondary: 'bg-secondary/5 border border-secondary/30',
    destructive: 'bg-destructive/5 border border-destructive/30',
    success: 'bg-emerald-500/5 border border-emerald-500/30',
    warning: 'bg-amber-500/5 border border-amber-500/30',
  };
  
  const glowClasses = glow ? 'shadow-lg shadow-primary/10' : '';
  
  return (
    <div
      ref={ref}
      className={clsx(
        'rounded-lg',
        variants[variant],
        glowClasses,
        // Smooth transitions
        'transition-all duration-300 ease-out',
        'transform-gpu',
        // Hover effects when enabled or clickable
        (hover || onClick) && [
          'cursor-pointer',
          'hover:-translate-y-1',
          'hover:shadow-xl hover:shadow-primary/5',
          'hover:border-primary/30',
          'active:translate-y-0 active:scale-[0.99]',
        ],
        className
      )}
      onClick={onClick}
      style={{
        willChange: hover || onClick ? 'transform, box-shadow' : 'auto',
        backfaceVisibility: 'hidden',
      }}
      {...props}
    >
      {children}
    </div>
  );
}));

Card.displayName = 'Card';

export const CardHeader = memo(({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

export const CardTitle = memo(({
  children,
  className,
  as: Component = 'h3',
  ...props
}) => {
  return (
    <Component
      className={clsx(
        'text-2xl font-semibold leading-none tracking-tight text-foreground',
        'transition-colors duration-200',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

CardTitle.displayName = 'CardTitle';

export const CardDescription = memo(({
  children,
  className,
  ...props
}) => {
  return (
    <p
      className={clsx('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

export const CardContent = memo(({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

export const CardFooter = memo(({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx('flex items-center p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';
