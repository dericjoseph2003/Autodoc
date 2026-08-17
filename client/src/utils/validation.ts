/**
 * Validation Module for Signup Form Fields
 */

export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate Full Name: required, 2-60 chars, letters/spaces/hyphens/apostrophes only
 */
export const validateFullName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full Name is required' };
  }
  if (trimmed.length < 2 || trimmed.length > 60) {
    return { isValid: false, error: 'Full Name must be between 2 and 60 characters' };
  }
  const nameRegex = /^[A-Za-z\s'\-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  return { isValid: true };
};

/**
 * Validate Email: required, valid email format
 */
export const validateEmail = (email: string): ValidationResult => {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email Address is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true };
};

/**
 * Evaluate Password criteria (live checklist)
 */
export const getPasswordCriteria = (password: string): PasswordCriteria => {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password) || /[^A-Za-z0-9]/.test(password)
  };
};

/**
 * Validate Password: required, all criteria must pass
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  const criteria = getPasswordCriteria(password);
  if (!criteria.minLength || !criteria.hasUpper || !criteria.hasLower || !criteria.hasNumber || !criteria.hasSpecial) {
    return { isValid: false, error: 'Password does not meet all security criteria' };
  }
  return { isValid: true };
};

/**
 * Validate Phone: required, exactly 10 digits, numbers only
 */
export const validatePhone = (phone: string): ValidationResult => {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Phone Number is required' };
  }
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(trimmed)) {
    return { isValid: false, error: 'Phone Number must be exactly 10 digits (numbers only)' };
  }
  return { isValid: true };
};
