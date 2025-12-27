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
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={clsx(
          'w-full px-4 py-2 bg-dark-bg border border-primary-blue/30 rounded-lg',
          'text-white font-mono tracking-wide',
          'focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-primary-red focus:ring-primary-red'
            : '',
          className
        )}
        {...props}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value} className="bg-dark-surface">
                {option.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-primary-red font-mono">{error}</p>
      )}
    </div>
  );
};

