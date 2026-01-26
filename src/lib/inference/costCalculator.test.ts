// src/lib/inference/costCalculator.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateCost,
  formatCost,
  formatTokens,
  ESTIMATED_COSTS_PER_FEATURE,
  FULL_PROFILE_ANALYSIS_COST,
} from './costCalculator';

describe('costCalculator', () => {
  describe('calculateCost', () => {
    it('calculates cost correctly for Sonnet 4', () => {
      // 5,000 input tokens + 2,000 output tokens
      // Input: (5000 / 1M) * $3 = $0.015
      // Output: (2000 / 1M) * $15 = $0.030
      // Total: $0.045
      const cost = calculateCost(5000, 2000, 'claude-sonnet-4-20250514');
      expect(cost).toBeCloseTo(0.045, 3);
    });

    it('calculates cost for zero tokens', () => {
      const cost = calculateCost(0, 0, 'claude-sonnet-4-20250514');
      expect(cost).toBe(0);
    });

    it('calculates cost for input-only', () => {
      // 10,000 input, 0 output
      // Input: (10000 / 1M) * $3 = $0.030
      const cost = calculateCost(10000, 0, 'claude-sonnet-4-20250514');
      expect(cost).toBeCloseTo(0.03, 4);
    });

    it('calculates cost for output-only', () => {
      // 0 input, 1,000 output
      // Output: (1000 / 1M) * $15 = $0.015
      const cost = calculateCost(0, 1000, 'claude-sonnet-4-20250514');
      expect(cost).toBeCloseTo(0.015, 4);
    });

    it('falls back to default pricing for unknown model', () => {
      // Should use default pricing (same as Sonnet)
      const cost = calculateCost(5000, 2000, 'unknown-model-xyz');
      expect(cost).toBeCloseTo(0.045, 3);
    });

    it('handles large token counts', () => {
      // 1 million input, 500K output
      // Input: (1M / 1M) * $3 = $3.00
      // Output: (500K / 1M) * $15 = $7.50
      // Total: $10.50
      const cost = calculateCost(1_000_000, 500_000, 'claude-sonnet-4-20250514');
      expect(cost).toBeCloseTo(10.5, 2);
    });

    it('returns 6 decimal precision', () => {
      const cost = calculateCost(1, 1, 'claude-sonnet-4-20250514');
      // Very small but precise
      expect(cost).toBeGreaterThan(0);
      expect(cost.toString().split('.')[1]?.length).toBeLessThanOrEqual(6);
    });
  });

  describe('formatCost', () => {
    it('formats standard costs with prefix', () => {
      expect(formatCost(0.05)).toBe('≈ $0.05');
      expect(formatCost(1.23)).toBe('≈ $1.23');
      expect(formatCost(10.00)).toBe('≈ $10.00');
    });

    it('formats costs without prefix when specified', () => {
      expect(formatCost(0.05, false)).toBe('$0.05');
      expect(formatCost(1.23, false)).toBe('$1.23');
    });

    it('formats small costs with more precision', () => {
      expect(formatCost(0.005)).toBe('≈ $0.005');
      expect(formatCost(0.0001)).toBe('≈ $0.0001');
    });

    it('formats zero cost', () => {
      expect(formatCost(0)).toBe('≈ $0.00');
    });
  });

  describe('formatTokens', () => {
    it('formats small numbers as-is', () => {
      expect(formatTokens(0)).toBe('0');
      expect(formatTokens(100)).toBe('100');
      expect(formatTokens(999)).toBe('999');
    });

    it('formats thousands with K suffix', () => {
      expect(formatTokens(1000)).toBe('1.0K');
      expect(formatTokens(5432)).toBe('5.4K');
      expect(formatTokens(45000)).toBe('45.0K');
      expect(formatTokens(999999)).toBe('1000.0K');
    });

    it('formats millions with M suffix', () => {
      expect(formatTokens(1_000_000)).toBe('1.0M');
      expect(formatTokens(2_500_000)).toBe('2.5M');
    });
  });

  describe('ESTIMATED_COSTS_PER_FEATURE', () => {
    it('has costs for all expected features', () => {
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('profile_analysis_chunk1');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('profile_analysis_chunk2');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('profile_analysis_chunk3');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('profile_analysis_chunk4');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('profile_analysis_consolidation');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('user_synthesis');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('compatibility_scoring');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('date_ideas');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('opener_suggestions');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('ask_about_match');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('conversation_coaching');
      expect(ESTIMATED_COSTS_PER_FEATURE).toHaveProperty('zodiac_compatibility');
    });

    it('has positive costs for all features', () => {
      for (const [feature, cost] of Object.entries(ESTIMATED_COSTS_PER_FEATURE)) {
        expect(cost).toBeGreaterThan(0);
        expect(cost).toBeLessThan(1); // All under $1 per call
      }
    });
  });

  describe('FULL_PROFILE_ANALYSIS_COST', () => {
    it('is the sum of all 5 profile analysis components', () => {
      const expected =
        ESTIMATED_COSTS_PER_FEATURE.profile_analysis_chunk1 +
        ESTIMATED_COSTS_PER_FEATURE.profile_analysis_chunk2 +
        ESTIMATED_COSTS_PER_FEATURE.profile_analysis_chunk3 +
        ESTIMATED_COSTS_PER_FEATURE.profile_analysis_chunk4 +
        ESTIMATED_COSTS_PER_FEATURE.profile_analysis_consolidation;

      expect(FULL_PROFILE_ANALYSIS_COST).toBeCloseTo(expected, 4);
    });

    it('is approximately $0.21 per profile', () => {
      expect(FULL_PROFILE_ANALYSIS_COST).toBeGreaterThan(0.2);
      expect(FULL_PROFILE_ANALYSIS_COST).toBeLessThan(0.25);
    });
  });
});
