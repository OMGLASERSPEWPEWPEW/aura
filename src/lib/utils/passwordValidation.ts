// src/lib/utils/passwordValidation.ts
// Password validation utilities for signup and reset password flows

export interface PasswordValidationResult {
  minLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  matches: boolean;
}

export interface PasswordValidationConfig {
  minLength?: number;
  specialChars?: string;
}

const DEFAULT_CONFIG: Required<PasswordValidationConfig> = {
  minLength: 8,
  specialChars: '!@#$%^&*(),.?":{}|<>',
};

/**
 * Validates a password against security requirements
 */
export function validatePassword(
  password: string,
  confirmPassword: string = '',
  config: PasswordValidationConfig = {}
): PasswordValidationResult {
  const { minLength, specialChars } = { ...DEFAULT_CONFIG, ...config };

  // Build regex for special characters (escape special regex chars)
  const escapedChars = specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const specialRegex = new RegExp(`[${escapedChars}]`);

  return {
    minLength: password.length >= minLength,
    hasNumber: /\d/.test(password),
    hasSpecial: specialRegex.test(password),
    matches: password === confirmPassword && password.length > 0,
  };
}

/**
 * Checks if all password requirements are met
 */
export function isPasswordValid(validation: PasswordValidationResult): boolean {
  return (
    validation.minLength &&
    validation.hasNumber &&
    validation.hasSpecial &&
    validation.matches
  );
}

/**
 * Validates an email address format
 */
export function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
