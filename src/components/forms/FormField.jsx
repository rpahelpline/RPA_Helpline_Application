import { memo, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';

/**
 * Standardized form field component with consistent error handling
 */
export const FormField = memo(forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  icon: Icon,
  helpText,
  className = '',
  options,
  rows,
  min,
  max,
  ...props
}, ref)) => {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  
  const hasError = !!error;
  
  const baseInputClasses = `w-full ${hasError ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}`;
  
  // Render the appropriate input type
  const renderInput = () => {
    if (type === 'select' && options) {
      return (
        <Select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={baseInputClasses}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helpText ? helpId : undefined}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      );
    }
    
    if (type === 'textarea') {
      return (
        <Textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows || 4}
          className={`${baseInputClasses} bg-background text-foreground placeholder-muted-foreground font-mono`}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helpText ? helpId : undefined}
          ref={ref}
          {...props}
        />
      );
    }
    
    return (
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        className={`${baseInputClasses} px-4 py-3 bg-background border ${hasError ? 'border-destructive' : 'border-input'} rounded-lg text-foreground placeholder-muted-foreground font-mono tracking-wide focus:outline-none focus:ring-2 ${hasError ? 'focus:ring-destructive/20' : 'focus:ring-primary/20'} focus:border-primary transition-all`}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : helpText ? helpId : undefined}
        ref={ref}
        {...props}
      />
    );
  };
  
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-foreground font-mono uppercase tracking-wider text-xs mb-2 flex items-center gap-2"
        >
          {Icon && <Icon className="h-3 w-3" />}
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      
      {renderInput()}
      
      {/* Error message */}
      {hasError && (
        <p 
          id={errorId}
          role="alert"
          className="mt-1 text-sm text-destructive font-mono flex items-center gap-1"
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <p 
          id={helpId}
          className="mt-1 text-xs text-muted-foreground"
        >
          {helpText}
        </p>
      )}
    </div>
  );
}));

FormField.displayName = 'FormField';

/**
 * Form section wrapper for grouping related fields
 */
export const FormSection = memo(({ title, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {title && (
      <h3 className="text-lg font-display font-semibold text-foreground tracking-wider uppercase">
        {title}
      </h3>
    )}
    {children}
  </div>
));

FormSection.displayName = 'FormSection';

/**
 * Form error summary for displaying multiple errors at once
 */
export const FormErrorSummary = memo(({ errors, className = '' }) => {
  const errorMessages = Object.entries(errors).filter(([_, value]) => value);
  
  if (errorMessages.length === 0) return null;
  
  return (
    <div 
      role="alert"
      className={`p-4 rounded-lg bg-destructive/10 border border-destructive/30 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <h4 className="font-semibold text-destructive">
          Please fix the following errors:
        </h4>
      </div>
      <ul className="list-disc list-inside space-y-1">
        {errorMessages.map(([field, message]) => (
          <li key={field} className="text-sm text-destructive">
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
});

FormErrorSummary.displayName = 'FormErrorSummary';




