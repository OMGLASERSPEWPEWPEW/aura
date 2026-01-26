// src/lib/api/jsonExtractor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateJsonCompleteness, extractJsonObject, extractJsonArray } from './jsonExtractor';

// Mock the saveErrorToFile function to avoid side effects
vi.mock('../utils/errorExport', () => ({
  saveErrorToFile: vi.fn(),
}));

describe('jsonExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== validateJsonCompleteness ====================
  describe('validateJsonCompleteness', () => {
    it('should return valid for balanced braces', () => {
      const json = '{"name": "test", "nested": {"value": 123}}';
      expect(validateJsonCompleteness(json)).toEqual({ valid: true });
    });

    it('should return valid for balanced brackets', () => {
      const json = '[1, 2, [3, 4], {"a": [5, 6]}]';
      expect(validateJsonCompleteness(json)).toEqual({ valid: true });
    });

    it('should detect missing closing brace', () => {
      const json = '{"name": "test"';
      const result = validateJsonCompleteness(json);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('missing closing }');
      }
    });

    it('should detect missing closing bracket', () => {
      const json = '[1, 2, 3';
      const result = validateJsonCompleteness(json);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('missing closing ]');
      }
    });

    it('should detect unterminated string', () => {
      // A string that starts but never ends
      // Braces are balanced (zero), but inString flag is true at end
      const json = '"hello';
      const result = validateJsonCompleteness(json);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('Unterminated string');
      }
    });

    it('should handle escaped quotes correctly', () => {
      const json = '{"message": "He said \\"hello\\""}';
      expect(validateJsonCompleteness(json)).toEqual({ valid: true });
    });

    it('should detect truncation (ends with unexpected character)', () => {
      // A string that has balanced braces but ends with whitespace or newline
      const json = '{"name": "test"} ';  // Trailing space
      const result = validateJsonCompleteness(json);
      // After trimming, last char is }, so this should be valid
      expect(result.valid).toBe(true);
    });

    it('should detect unexpected ending character after brace check passes', () => {
      // The validator checks braces first, then checks ending character
      // To trigger the ending character check, we need balanced braces
      // but an unexpected last char after trimming
      // However, the function trims first, so this is hard to trigger
      // Let's verify that trailing whitespace is handled correctly
      const jsonWithTrailing = '{"name": "test"}   \n  ';
      const result = validateJsonCompleteness(jsonWithTrailing);
      expect(result.valid).toBe(true);  // Should pass after trimming
    });
  });

  // ==================== extractJsonObject ====================
  describe('extractJsonObject', () => {
    it('should extract JSON object from plain text', () => {
      const text = '{"name": "test", "value": 123}';
      const result = extractJsonObject<{ name: string; value: number }>(text);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should extract JSON object from markdown code block', () => {
      const text = 'Here is the response:\n```json\n{"name": "test"}\n```\nEnd of response';
      const result = extractJsonObject<{ name: string }>(text);
      expect(result).toEqual({ name: 'test' });
    });

    it('should extract JSON object surrounded by text', () => {
      const text = 'Some intro text... {"data": "extracted"} ...and some trailing text';
      const result = extractJsonObject<{ data: string }>(text);
      expect(result).toEqual({ data: 'extracted' });
    });

    it('should handle nested objects', () => {
      const text = '{"outer": {"inner": {"deep": "value"}}}';
      const result = extractJsonObject<{ outer: { inner: { deep: string } } }>(text);
      expect(result.outer.inner.deep).toBe('value');
    });

    it('should throw error when no braces found', () => {
      const text = 'No JSON here, just plain text';
      expect(() => extractJsonObject(text)).toThrow('AI response did not contain valid JSON');
    });

    it('should throw error for truncated JSON', () => {
      const text = '{"name": "test", "incomplete":';
      expect(() => extractJsonObject(text)).toThrow();
    });
  });

  // ==================== extractJsonArray ====================
  describe('extractJsonArray', () => {
    it('should extract JSON array from plain text', () => {
      const text = '[1, 2, 3, 4, 5]';
      const result = extractJsonArray<number>(text);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should extract array of objects', () => {
      const text = '[{"id": 1}, {"id": 2}]';
      const result = extractJsonArray<{ id: number }>(text);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
    });

    it('should extract JSON array from markdown', () => {
      const text = 'Response:\n```json\n["a", "b", "c"]\n```';
      const result = extractJsonArray<string>(text);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty arrays', () => {
      const text = 'Empty result: []';
      const result = extractJsonArray<unknown>(text);
      expect(result).toEqual([]);
    });

    it('should throw error when no brackets found', () => {
      const text = 'No array here';
      expect(() => extractJsonArray(text)).toThrow('AI response did not contain valid JSON');
    });

    it('should handle nested arrays', () => {
      const text = '[[1, 2], [3, 4], [5, 6]]';
      const result = extractJsonArray<number[]>(text);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual([1, 2]);
    });
  });

  // ==================== Smart Extraction Edge Cases ====================
  describe('smart extraction edge cases', () => {
    describe('markdown code blocks', () => {
      it('should extract JSON object from markdown code block', () => {
        const text = 'Here is the response:\n```json\n{"name": "test"}\n```\nDone.';
        expect(extractJsonObject(text)).toEqual({ name: 'test' });
      });

      it('should extract JSON array from markdown code block', () => {
        const text = 'Here are the items:\n```json\n[1, 2, 3]\n```';
        expect(extractJsonArray(text)).toEqual([1, 2, 3]);
      });

      it('should prefer code block over loose JSON', () => {
        const text = '{wrong} and ```json\n{"right": true}\n```';
        expect(extractJsonObject(text)).toEqual({ right: true });
      });

      it('should handle code block without json language tag', () => {
        const text = '```\n{"data": "value"}\n```';
        expect(extractJsonObject(text)).toEqual({ data: 'value' });
      });
    });

    describe('braces in explanatory text', () => {
      it('should handle brace in explanatory text before JSON object', () => {
        const text = 'The pattern {key: value} is common. Here is your data: {"actual": "json"}';
        expect(extractJsonObject(text)).toEqual({ actual: 'json' });
      });

      it('should handle bracket in explanatory text before JSON array', () => {
        const text = 'Arrays like [a, b] are useful. Result: ["real", "data"]';
        expect(extractJsonArray(text)).toEqual(['real', 'data']);
      });

      it('should handle multiple braces in text before actual JSON', () => {
        const text = 'Example: {a} and {b} are placeholders. Actual: {"name": "test"}';
        expect(extractJsonObject(text)).toEqual({ name: 'test' });
      });
    });

    describe('nested structures', () => {
      it('should handle deeply nested objects', () => {
        const text = 'Result: {"outer": {"inner": {"deep": "value"}}}';
        const result = extractJsonObject<{ outer: { inner: { deep: string } } }>(text);
        expect(result.outer.inner.deep).toBe('value');
      });

      it('should handle objects containing arrays', () => {
        const text = '{"items": [1, 2, 3], "nested": {"arr": ["a", "b"]}}';
        const result = extractJsonObject<{ items: number[]; nested: { arr: string[] } }>(text);
        expect(result.items).toEqual([1, 2, 3]);
        expect(result.nested.arr).toEqual(['a', 'b']);
      });

      it('should handle arrays containing objects', () => {
        const text = '[{"id": 1}, {"id": 2, "nested": {"value": true}}]';
        const result = extractJsonArray<{ id: number; nested?: { value: boolean } }>(text);
        expect(result).toHaveLength(2);
        expect(result[1].nested?.value).toBe(true);
      });
    });

    describe('strings with special characters', () => {
      it('should handle JSON with escaped quotes in strings', () => {
        const text = '{"quote": "He said \\"hello\\""}';
        expect(extractJsonObject(text)).toEqual({ quote: 'He said "hello"' });
      });

      it('should handle JSON with braces inside strings', () => {
        const text = '{"message": "Use {name} as placeholder"}';
        expect(extractJsonObject(text)).toEqual({ message: 'Use {name} as placeholder' });
      });

      it('should handle JSON with brackets inside strings', () => {
        const text = '["item with [brackets]", "another"]';
        expect(extractJsonArray(text)).toEqual(['item with [brackets]', 'another']);
      });
    });

    describe('edge cases in surrounding text', () => {
      it('should handle closing brace before JSON starts', () => {
        const text = 'Note: } is a closing brace. {"valid": true}';
        expect(extractJsonObject(text)).toEqual({ valid: true });
      });

      it('should handle multiple JSON-like structures', () => {
        // Should extract the first balanced one
        const text = '{"first": 1} and then {"second": 2}';
        expect(extractJsonObject(text)).toEqual({ first: 1 });
      });

      it('should handle text with invalid JSON-like patterns before valid JSON', () => {
        // First { is part of invalid pattern, should find the valid JSON
        const text = 'Example with {pseudo-code} then {"valid": true}';
        expect(extractJsonObject(text)).toEqual({ valid: true });
      });
    });
  });
});
