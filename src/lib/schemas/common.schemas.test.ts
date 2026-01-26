// src/lib/schemas/common.schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  nullableString,
  stringArray,
  scoreNumber,
  nullableNumber,
  prioritySchema,
  agendaSchema,
} from './common.schemas';

describe('common.schemas', () => {
  describe('nullableString', () => {
    it('should accept a string', () => {
      expect(nullableString.parse('hello')).toBe('hello');
    });

    it('should accept null', () => {
      expect(nullableString.parse(null)).toBe(null);
    });

    it('should accept undefined', () => {
      expect(nullableString.parse(undefined)).toBe(undefined);
    });

    it('should reject a number', () => {
      expect(() => nullableString.parse(123)).toThrow();
    });
  });

  describe('stringArray', () => {
    it('should accept an array of strings', () => {
      expect(stringArray.parse(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should default to empty array when undefined', () => {
      expect(stringArray.parse(undefined)).toEqual([]);
    });

    it('should accept empty array', () => {
      expect(stringArray.parse([])).toEqual([]);
    });

    it('should reject non-string elements', () => {
      expect(() => stringArray.parse([1, 2, 3])).toThrow();
    });
  });

  describe('scoreNumber', () => {
    it('should accept 0', () => {
      expect(scoreNumber.parse(0)).toBe(0);
    });

    it('should accept 100', () => {
      expect(scoreNumber.parse(100)).toBe(100);
    });

    it('should accept 50', () => {
      expect(scoreNumber.parse(50)).toBe(50);
    });

    it('should reject negative numbers', () => {
      expect(() => scoreNumber.parse(-1)).toThrow();
    });

    it('should reject numbers over 100', () => {
      expect(() => scoreNumber.parse(101)).toThrow();
    });

    it('should reject non-numbers', () => {
      expect(() => scoreNumber.parse('50')).toThrow();
    });
  });

  describe('nullableNumber', () => {
    it('should accept a number', () => {
      expect(nullableNumber.parse(42)).toBe(42);
    });

    it('should accept null', () => {
      expect(nullableNumber.parse(null)).toBe(null);
    });

    it('should accept undefined', () => {
      expect(nullableNumber.parse(undefined)).toBe(undefined);
    });
  });

  describe('prioritySchema', () => {
    it('should accept "primary"', () => {
      expect(prioritySchema.parse('primary')).toBe('primary');
    });

    it('should accept "secondary"', () => {
      expect(prioritySchema.parse('secondary')).toBe('secondary');
    });

    it('should reject invalid values', () => {
      expect(() => prioritySchema.parse('tertiary')).toThrow();
    });
  });

  describe('agendaSchema', () => {
    it('should accept valid agenda', () => {
      const agenda = {
        type: 'approval-seeking',
        evidence: 'Multiple group photos with popular friends',
        priority: 'primary',
      };
      expect(agendaSchema.parse(agenda)).toEqual(agenda);
    });

    it('should reject missing type', () => {
      const agenda = {
        evidence: 'Some evidence',
        priority: 'primary',
      };
      expect(() => agendaSchema.parse(agenda)).toThrow();
    });

    it('should reject invalid priority', () => {
      const agenda = {
        type: 'approval-seeking',
        evidence: 'Some evidence',
        priority: 'high',
      };
      expect(() => agendaSchema.parse(agenda)).toThrow();
    });
  });
});
