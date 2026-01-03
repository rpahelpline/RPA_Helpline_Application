import { forwardRef } from 'react';
import clsx from 'clsx';

export const Checkbox = forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      type="checkbox"
      ref={ref}
      className={clsx(
        'h-4 w-4 rounded border-input bg-background text-primary',
        'focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});

Checkbox.displayName = 'Checkbox';




