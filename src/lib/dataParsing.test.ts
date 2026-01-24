// src/lib/dataParsing.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseTinderData } from './dataParsing';

// Suppress console.log during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('dataParsing', () => {
  // ==================== parseTinderData ====================
  describe('parseTinderData', () => {
    it('should parse valid Tinder data and calculate stats', () => {
      const data = {
        Messages: [
          {
            match_id: '1',
            messages: [
              { to: 1, from: 'You', message: 'Hey there!', sent_date: '2024-01-01T10:00:00Z' },
              { to: 1, from: 'Them', message: 'Hi!', sent_date: '2024-01-01T10:05:00Z' },
              { to: 1, from: 'You', message: 'How are you?', sent_date: '2024-01-01T10:10:00Z' },
            ],
          },
          {
            match_id: '2',
            messages: [
              { to: 2, from: 'Them', message: 'Hello!', sent_date: '2024-01-02T10:00:00Z' },
              { to: 2, from: 'You', message: 'Hi there', sent_date: '2024-01-02T10:05:00Z' },
            ],
          },
        ],
      };

      const result = parseTinderData(data);

      expect(result.matches).toBe(2);
      expect(result.conversations).toBe(2);
      expect(result.initiatorRatio).toBe(0.5); // 1 out of 2 conversations initiated
      expect(result.avgMessageLength).toBeGreaterThan(0);
    });

    it('should calculate correct initiator ratio', () => {
      const data = {
        Messages: [
          {
            match_id: '1',
            messages: [
              { to: 1, from: 'You', message: 'First message', sent_date: '2024-01-01T10:00:00Z' },
            ],
          },
          {
            match_id: '2',
            messages: [
              { to: 2, from: 'You', message: 'First message', sent_date: '2024-01-02T10:00:00Z' },
            ],
          },
          {
            match_id: '3',
            messages: [
              { to: 3, from: 'You', message: 'First message', sent_date: '2024-01-03T10:00:00Z' },
            ],
          },
        ],
      };

      const result = parseTinderData(data);
      expect(result.initiatorRatio).toBe(1); // User initiated all 3 conversations
    });

    it('should handle missing Messages field', () => {
      const data = {};
      const result = parseTinderData(data);

      expect(result.matches).toBe(0);
      expect(result.conversations).toBe(0);
      expect(result.initiatorRatio).toBe(0);
      expect(result.doubleTextRatio).toBe(0);
      expect(result.avgMessageLength).toBe(0);
    });

    it('should handle matches with empty conversations', () => {
      const data = {
        Messages: [
          { match_id: '1', messages: [] },
          { match_id: '2', messages: [] },
          {
            match_id: '3',
            messages: [
              { to: 3, from: 'You', message: 'Hello', sent_date: '2024-01-01T10:00:00Z' },
            ],
          },
        ],
      };

      const result = parseTinderData(data);

      expect(result.matches).toBe(3);
      expect(result.conversations).toBe(1); // Only 1 has actual messages
    });

    it('should calculate double text ratio correctly', () => {
      const data = {
        Messages: [
          {
            match_id: '1',
            messages: [
              { to: 1, from: 'You', message: 'Hey', sent_date: '2024-01-01T10:00:00Z' },
              { to: 1, from: 'You', message: 'Are you there?', sent_date: '2024-01-01T10:05:00Z' },
              { to: 1, from: 'Them', message: 'Sorry, was busy', sent_date: '2024-01-01T10:10:00Z' },
              { to: 1, from: 'You', message: 'No problem', sent_date: '2024-01-01T10:15:00Z' },
            ],
          },
        ],
      };

      const result = parseTinderData(data);

      // User sent 3 messages, double-texted once
      expect(result.doubleTextRatio).toBeGreaterThan(0);
      // Double text count = 1, total user messages = 3
      expect(result.doubleTextRatio).toBeCloseTo(1 / 3, 2);
    });
  });
});
