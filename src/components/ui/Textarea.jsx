import { useState } from 'react';
import clsx from 'clsx';

export const Textarea = ({
  label,
  error,
  className,
  id,
  ...props
}) => {
  const [inputId] = useState(() => id || `textarea-${crypto.randomUUID()}`);
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground mb-2 font-mono uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          'w-full px-4 py-2 bg-background border rounded-md',
          'text-foreground placeholder-muted-foreground font-mono tracking-wide',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'resize-vertical',
          error
            ? 'border-destructive focus:ring-destructive'
            : 'border-input',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive font-mono">{error}</p>
      )}
    </div>
  );
};

