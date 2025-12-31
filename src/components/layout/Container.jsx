import clsx from 'clsx';

export const Container = ({ children, className, size = 'default', ...props }) => {
  const sizes = {
    default: 'max-w-7xl',
    sm: 'max-w-4xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
    full: 'max-w-full',
  };
  
  return (
    <div
      className={clsx(
        'mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-12',
        sizes[size],
        'box-border',
        className
      )}
      style={{ maxWidth: '100%' }}
      {...props}
    >
      {children}
    </div>
  );
};

