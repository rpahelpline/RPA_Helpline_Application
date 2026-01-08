import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for form validation with consistent error handling
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Form state and handlers
 * 
 * @example
 * const { values, errors, handleChange, validate, setFieldError } = useFormValidation(
 *   { title: '', description: '' },
 *   {
 *     title: [
 *       { required: true, message: 'Title is required' },
 *       { minLength: 5, message: 'Title must be at least 5 characters' }
 *     ],
 *     description: [
 *       { required: true, message: 'Description is required' }
 *     ]
 *   }
 * );
 */
export const useFormValidation = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset form to initial values
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);
  
  // Update a single field value
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);
  
  // Set a field error manually
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);
  
  // Mark field as touched (for showing errors only after interaction)
  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);
  
  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFieldValue(name, fieldValue);
  }, [setFieldValue]);
  
  // Handle input blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name);
  }, [setFieldTouched]);
  
  // Validate a single field
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';
    
    for (const rule of rules) {
      // Required check
      if (rule.required) {
        const isEmpty = 
          value === undefined || 
          value === null || 
          value === '' ||
          (Array.isArray(value) && value.length === 0);
        
        if (isEmpty) {
          return rule.message || `${name} is required`;
        }
      }
      
      // Skip other validations if value is empty and not required
      if (!value && value !== 0) continue;
      
      // Min length
      if (rule.minLength && String(value).length < rule.minLength) {
        return rule.message || `${name} must be at least ${rule.minLength} characters`;
      }
      
      // Max length
      if (rule.maxLength && String(value).length > rule.maxLength) {
        return rule.message || `${name} must be at most ${rule.maxLength} characters`;
      }
      
      // Min value (for numbers)
      if (rule.min !== undefined && Number(value) < rule.min) {
        return rule.message || `${name} must be at least ${rule.min}`;
      }
      
      // Max value (for numbers)
      if (rule.max !== undefined && Number(value) > rule.max) {
        return rule.message || `${name} must be at most ${rule.max}`;
      }
      
      // Pattern (regex)
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `${name} is invalid`;
      }
      
      // Custom validator function
      if (rule.validate && typeof rule.validate === 'function') {
        const result = rule.validate(value, values);
        if (result !== true && result) {
          return result || rule.message || `${name} is invalid`;
        }
      }
      
      // Email validation
      if (rule.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return rule.message || 'Please enter a valid email address';
        }
      }
      
      // URL validation
      if (rule.url) {
        try {
          new URL(value);
        } catch {
          return rule.message || 'Please enter a valid URL';
        }
      }
      
      // Array min items
      if (rule.minItems && Array.isArray(value) && value.length < rule.minItems) {
        return rule.message || `Select at least ${rule.minItems} item(s)`;
      }
    }
    
    return '';
  }, [validationRules, values]);
  
  // Validate all fields
  const validate = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [validationRules, values, validateField]);
  
  // Check if form has any errors
  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error);
  }, [errors]);
  
  // Check if form is valid (all required fields filled and no errors)
  const isValid = useMemo(() => {
    return !hasErrors && Object.keys(validationRules).every(name => {
      const rules = validationRules[name];
      const isRequired = rules?.some(r => r.required);
      if (!isRequired) return true;
      
      const value = values[name];
      return value !== undefined && 
             value !== null && 
             value !== '' &&
             !(Array.isArray(value) && value.length === 0);
    });
  }, [hasErrors, validationRules, values]);
  
  // Get field props for easy binding
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[name] ? errors[name] : undefined,
  }), [values, errors, touched, handleChange, handleBlur]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    hasErrors,
    setValues,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validate,
    validateField,
    reset,
    getFieldProps,
  };
};

/**
 * Common validation rules that can be reused
 */
export const validationRules = {
  required: (message = 'This field is required') => ({ required: true, message }),
  minLength: (length, message) => ({ minLength: length, message: message || `Must be at least ${length} characters` }),
  maxLength: (length, message) => ({ maxLength: length, message: message || `Must be at most ${length} characters` }),
  email: (message = 'Please enter a valid email address') => ({ email: true, message }),
  url: (message = 'Please enter a valid URL') => ({ url: true, message }),
  min: (value, message) => ({ min: value, message: message || `Must be at least ${value}` }),
  max: (value, message) => ({ max: value, message: message || `Must be at most ${value}` }),
  pattern: (regex, message) => ({ pattern: regex, message }),
  minItems: (count, message) => ({ minItems: count, message: message || `Select at least ${count} item(s)` }),
  custom: (validateFn, message) => ({ validate: validateFn, message }),
};

export default useFormValidation;





