// src/lib/utils/passwordValidation.test.ts
import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  isPasswordValid,
  isEmailValid,
  type PasswordValidationResult,
} from './passwordValidation';

describe('passwordValidation', () => {
  describe('validatePassword', () => {
    describe('minLength requirement', () => {
      it('should fail for passwords shorter than 8 characters', () => {
        const result = validatePassword('Pass1!', 'Pass1!');
        expect(result.minLength).toBe(false);
      });

      it('should pass for passwords with exactly 8 characters', () => {
        const result = validatePassword('Pass12!@', 'Pass12!@');
        expect(result.minLength).toBe(true);
      });

      it('should pass for passwords longer than 8 characters', () => {
        const result = validatePassword('Password123!', 'Password123!');
        expect(result.minLength).toBe(true);
      });

      it('should respect custom minLength config', () => {
        const result = validatePassword('Pass1!', 'Pass1!', { minLength: 6 });
        expect(result.minLength).toBe(true);
      });
    });

    describe('hasNumber requirement', () => {
      it('should fail for passwords without numbers', () => {
        const result = validatePassword('Password!', 'Password!');
        expect(result.hasNumber).toBe(false);
      });

      it('should pass for passwords with at least one number', () => {
        const result = validatePassword('Password1!', 'Password1!');
        expect(result.hasNumber).toBe(true);
      });

      it('should pass for passwords with multiple numbers', () => {
        const result = validatePassword('Pass12345!', 'Pass12345!');
        expect(result.hasNumber).toBe(true);
      });
    });

    describe('hasSpecial requirement', () => {
      it('should fail for passwords without special characters', () => {
        const result = validatePassword('Password1', 'Password1');
        expect(result.hasSpecial).toBe(false);
      });

      it('should pass for passwords with !', () => {
        const result = validatePassword('Password1!', 'Password1!');
        expect(result.hasSpecial).toBe(true);
      });

      it('should pass for passwords with @', () => {
        const result = validatePassword('Password1@', 'Password1@');
        expect(result.hasSpecial).toBe(true);
      });

      it('should pass for passwords with #', () => {
        const result = validatePassword('Password1#', 'Password1#');
        expect(result.hasSpecial).toBe(true);
      });

      it('should pass for passwords with various special chars', () => {
        const specialChars = ['$', '%', '^', '&', '*', '(', ')', ',', '.', '?', '"', ':', '{', '}', '|', '<', '>'];
        for (const char of specialChars) {
          const result = validatePassword(`Password1${char}`, `Password1${char}`);
          expect(result.hasSpecial).toBe(true);
        }
      });
    });

    describe('matches requirement', () => {
      it('should fail when passwords do not match', () => {
        const result = validatePassword('Password1!', 'Password2!');
        expect(result.matches).toBe(false);
      });

      it('should pass when passwords match', () => {
        const result = validatePassword('Password1!', 'Password1!');
        expect(result.matches).toBe(true);
      });

      it('should fail when password is empty even if confirmPassword matches', () => {
        const result = validatePassword('', '');
        expect(result.matches).toBe(false);
      });

      it('should fail when confirmPassword is not provided', () => {
        const result = validatePassword('Password1!');
        expect(result.matches).toBe(false);
      });
    });

    describe('combined validation', () => {
      it('should return all false for empty password', () => {
        const result = validatePassword('', '');
        expect(result).toEqual({
          minLength: false,
          hasNumber: false,
          hasSpecial: false,
          matches: false,
        });
      });

      it('should return all true for valid password', () => {
        const result = validatePassword('SecurePass123!', 'SecurePass123!');
        expect(result).toEqual({
          minLength: true,
          hasNumber: true,
          hasSpecial: true,
          matches: true,
        });
      });
    });
  });

  describe('isPasswordValid', () => {
    it('should return true when all requirements are met', () => {
      const validation: PasswordValidationResult = {
        minLength: true,
        hasNumber: true,
        hasSpecial: true,
        matches: true,
      };
      expect(isPasswordValid(validation)).toBe(true);
    });

    it('should return false when minLength is not met', () => {
      const validation: PasswordValidationResult = {
        minLength: false,
        hasNumber: true,
        hasSpecial: true,
        matches: true,
      };
      expect(isPasswordValid(validation)).toBe(false);
    });

    it('should return false when hasNumber is not met', () => {
      const validation: PasswordValidationResult = {
        minLength: true,
        hasNumber: false,
        hasSpecial: true,
        matches: true,
      };
      expect(isPasswordValid(validation)).toBe(false);
    });

    it('should return false when hasSpecial is not met', () => {
      const validation: PasswordValidationResult = {
        minLength: true,
        hasNumber: true,
        hasSpecial: false,
        matches: true,
      };
      expect(isPasswordValid(validation)).toBe(false);
    });

    it('should return false when matches is not met', () => {
      const validation: PasswordValidationResult = {
        minLength: true,
        hasNumber: true,
        hasSpecial: true,
        matches: false,
      };
      expect(isPasswordValid(validation)).toBe(false);
    });
  });

  describe('isEmailValid', () => {
    it('should return true for valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@domain.co.uk',
        'a@b.co',
      ];
      for (const email of validEmails) {
        expect(isEmailValid(email)).toBe(true);
      }
    });

    it('should return false for invalid email formats', () => {
      const invalidEmails = [
        '',
        'notanemail',
        '@domain.com',
        'user@',
        'user@.com',
        'user @domain.com',
        'user@ domain.com',
      ];
      for (const email of invalidEmails) {
        expect(isEmailValid(email)).toBe(false);
      }
    });
  });
});
