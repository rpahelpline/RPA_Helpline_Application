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
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          'w-full px-4 py-2 bg-dark-surface border rounded-md',
          'text-gray-100 placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'resize-vertical',
          error
            ? 'border-primary-red focus:ring-primary-red'
            : 'border-dark-border',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-primary-red">{error}</p>
      )}
    </div>
  );
};

