import clsx from 'clsx';

export const Card = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-dark-surface/80 backdrop-blur-sm border border-dark-border',
    elevated: 'bg-dark-surface/80 backdrop-blur-sm border border-dark-border shadow-lg shadow-black/20',
    outline: 'bg-transparent border border-primary-blue/20',
    terminal: 'bg-dark-bg border border-primary-blue/30 font-mono',
  };
  
  return (
    <div
      className={clsx(
        'rounded-lg p-6',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

