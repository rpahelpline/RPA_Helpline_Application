import { forwardRef } from 'react';
import clsx from 'clsx';

export const Label = forwardRef(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={clsx(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
});

Label.displayName = 'Label';


