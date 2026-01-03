import { useState } from 'react';
import clsx from 'clsx';

export const Select = ({
  label,
  error,
  className,
  id,
  children,
  options,
  ...props
}) => {
  const [inputId] = useState(() => id || `select-${crypto.randomUUID()}`);
  
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
      <select
        id={inputId}
        className={clsx(
          'w-full px-4 py-2 bg-background border border-input rounded-lg',
          'text-foreground font-mono tracking-wide',
          'focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-destructive focus:ring-destructive'
            : '',
          className
        )}
        {...props}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value} className="bg-card text-foreground">
                {option.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-destructive font-mono">{error}</p>
      )}
    </div>
  );
};

