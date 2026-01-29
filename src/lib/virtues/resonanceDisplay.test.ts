// src/lib/virtues/resonanceDisplay.test.ts
import { describe, it, expect } from 'vitest';
import {
  getResonanceLevel,
  getResonanceDisplay,
  RESONANCE_LABELS,
  RESONANCE_SHORT_LABELS,
  RESONANCE_COLORS,
  RESONANCE_ICONS,
  RESONANCE_DESCRIPTIONS,
  RESONANCE_TOOLTIPS,
} from './resonanceDisplay';
import { Sparkles, Moon, Waves } from 'lucide-react';

describe('resonanceDisplay', () => {
  describe('getResonanceLevel', () => {
    it('returns "strong" for scores >= 7', () => {
      expect(getResonanceLevel(7)).toBe('strong');
      expect(getResonanceLevel(8)).toBe('strong');
      expect(getResonanceLevel(9)).toBe('strong');
      expect(getResonanceLevel(10)).toBe('strong');
    });

    it('returns "converging" for scores 5-6', () => {
      expect(getResonanceLevel(5)).toBe('converging');
      expect(getResonanceLevel(6)).toBe('converging');
      expect(getResonanceLevel(6.9)).toBe('converging');
    });

    it('returns "different" for scores < 5', () => {
      expect(getResonanceLevel(0)).toBe('different');
      expect(getResonanceLevel(1)).toBe('different');
      expect(getResonanceLevel(4)).toBe('different');
      expect(getResonanceLevel(4.9)).toBe('different');
    });
  });

  describe('RESONANCE_LABELS', () => {
    it('has mystical labels for each level', () => {
      expect(RESONANCE_LABELS.strong).toBe('Strong Resonance');
      expect(RESONANCE_LABELS.converging).toBe('Paths Converging');
      expect(RESONANCE_LABELS.different).toBe('Different Frequencies');
    });
  });

  describe('RESONANCE_SHORT_LABELS', () => {
    it('has short labels for compact displays', () => {
      expect(RESONANCE_SHORT_LABELS.strong).toBe('Resonance');
      expect(RESONANCE_SHORT_LABELS.converging).toBe('Converging');
      expect(RESONANCE_SHORT_LABELS.different).toBe('Different');
    });
  });

  describe('RESONANCE_COLORS', () => {
    it('uses violet for strong (not green/emerald)', () => {
      expect(RESONANCE_COLORS.strong).toContain('violet');
    });

    it('uses amber for converging', () => {
      expect(RESONANCE_COLORS.converging).toContain('amber');
    });

    it('uses slate for different (not red)', () => {
      expect(RESONANCE_COLORS.different).toContain('slate');
      expect(RESONANCE_COLORS.different).not.toContain('red');
    });

    it('includes dark mode variants for all levels', () => {
      expect(RESONANCE_COLORS.strong).toContain('dark:');
      expect(RESONANCE_COLORS.converging).toContain('dark:');
      expect(RESONANCE_COLORS.different).toContain('dark:');
    });
  });

  describe('RESONANCE_ICONS', () => {
    it('uses Sparkles for strong resonance', () => {
      expect(RESONANCE_ICONS.strong).toBe(Sparkles);
    });

    it('uses Moon for converging paths', () => {
      expect(RESONANCE_ICONS.converging).toBe(Moon);
    });

    it('uses Waves for different frequencies', () => {
      expect(RESONANCE_ICONS.different).toBe(Waves);
    });
  });

  describe('RESONANCE_DESCRIPTIONS', () => {
    it('has descriptive copy for each level', () => {
      expect(RESONANCE_DESCRIPTIONS.strong).toContain('resonate strongly');
      expect(RESONANCE_DESCRIPTIONS.converging).toContain('converging');
      expect(RESONANCE_DESCRIPTIONS.different).toContain('differ');
    });

    it('uses neutral language for low scores (no shame)', () => {
      // "Different frequencies" doesn't say "bad" or "low compatibility"
      expect(RESONANCE_DESCRIPTIONS.different).not.toContain('bad');
      expect(RESONANCE_DESCRIPTIONS.different).not.toContain('low');
      expect(RESONANCE_DESCRIPTIONS.different).not.toContain('poor');
    });
  });

  describe('RESONANCE_TOOLTIPS', () => {
    it('has hover text for gallery view', () => {
      expect(RESONANCE_TOOLTIPS.strong).toBe('Strong pull toward connection');
      expect(RESONANCE_TOOLTIPS.converging).toBe('Potential worth exploring');
      expect(RESONANCE_TOOLTIPS.different).toBe('Different paths, but chemistry can surprise');
    });
  });

  describe('getResonanceDisplay', () => {
    it('returns all display properties for a score', () => {
      const display = getResonanceDisplay(8);
      expect(display.level).toBe('strong');
      expect(display.label).toBe('Strong Resonance');
      expect(display.shortLabel).toBe('Resonance');
      expect(display.colors).toContain('violet');
      expect(display.Icon).toBe(Sparkles);
      expect(display.description).toContain('resonate strongly');
      expect(display.tooltip).toContain('Strong pull');
    });

    it('handles boundary values correctly', () => {
      expect(getResonanceDisplay(7).level).toBe('strong');
      expect(getResonanceDisplay(6.9).level).toBe('converging');
      expect(getResonanceDisplay(5).level).toBe('converging');
      expect(getResonanceDisplay(4.9).level).toBe('different');
    });
  });
});
