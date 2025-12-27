import clsx from 'clsx';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider';
  
  const variants = {
    primary: 'bg-primary-red text-white hover:bg-primary-red/90 focus:ring-primary-red border border-primary-red shadow-[0_0_10px_rgba(255,51,51,0.3)]',
    secondary: 'bg-transparent text-white border-2 border-primary-blue hover:bg-primary-blue/10 focus:ring-primary-blue',
    danger: 'bg-primary-red text-white hover:bg-primary-red/90 focus:ring-primary-red',
    ghost: 'text-white hover:text-primary-blue hover:bg-dark-surface focus:ring-primary-blue',
    terminal: 'bg-dark-surface text-primary-blue border border-primary-blue/30 font-mono hover:border-primary-blue focus:ring-primary-blue',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };
  
  return (
    <button
      type={type}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

