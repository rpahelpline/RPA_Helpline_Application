import { useState, memo, forwardRef } from 'react';
import clsx from 'clsx';

export const Input = memo(forwardRef(({
  label,
  error,
  className,
  id,
  ...props
}, ref) => {
  const [inputId] = useState(() => id || `input-${Math.random().toString(36).slice(2, 11)}`);
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground mb-2 font-mono uppercase tracking-wider transition-colors duration-150"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'w-full px-4 py-2 bg-background border rounded-md',
          'text-foreground placeholder-muted-foreground font-mono tracking-wide',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Smooth transitions
          'transition-all duration-200 ease-out',
          'focus:outline-none',
          'focus:ring-2 focus:ring-offset-0',
          'focus:border-primary focus:ring-primary/20',
          'hover:border-muted-foreground/50',
          // Error state
          error
            ? 'border-destructive focus:ring-destructive/20 focus:border-destructive'
            : 'border-input',
          className
        )}
        style={{
          willChange: 'border-color, box-shadow',
        }}
        {...props}
      />
      {error && (
        <p 
          className="mt-1 text-sm text-destructive font-mono"
          style={{
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}));

Input.displayName = 'Input';
