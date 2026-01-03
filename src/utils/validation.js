export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Indian phone number validation
export const validatePhone = (phone) => {
  if (!phone) return false;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Remove country code if present (91)
  const cleanNumber = digits.startsWith('91') && digits.length > 10 
    ? digits.substring(2) 
    : digits;
  
  // Must be exactly 10 digits and start with 6, 7, 8, or 9 (Indian mobile numbers)
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(cleanNumber);
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};

export const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, label: '' };
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[@$!%*?&]/.test(password)) strength++;

  const labels = {
    0: '',
    1: 'Very Weak',
    2: 'Weak',
    3: 'Fair',
    4: 'Good',
    5: 'Strong',
    6: 'Very Strong',
  };

  return {
    strength: Math.min(strength, 6),
    label: labels[Math.min(strength, 6)],
  };
};

export const validateForm = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field];
    const value = formData[field];

    if (fieldRules.required && !validateRequired(value)) {
      errors[field] = fieldRules.requiredMessage || `${field} is required`;
      return;
    }

    if (value && fieldRules.email && !validateEmail(value)) {
      errors[field] = fieldRules.emailMessage || 'Invalid email address';
      return;
    }

    if (value && fieldRules.password && !validatePassword(value)) {
      errors[field] = fieldRules.passwordMessage || 'Password must be at least 8 characters with uppercase, lowercase, and number';
      return;
    }

    if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = fieldRules.minLengthMessage || `Must be at least ${fieldRules.minLength} characters`;
      return;
    }

    if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = fieldRules.maxLengthMessage || `Must be no more than ${fieldRules.maxLength} characters`;
      return;
    }

    if (value && fieldRules.custom && !fieldRules.custom(value, formData)) {
      errors[field] = fieldRules.customMessage || 'Invalid value';
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

