// src/lib/api/anthropicClient.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  textContent,
  imageContent,
  callAnthropicForText,
  callAnthropicForObject,
  callAnthropicForArray,
  callAnthropicForArraySafe,
} from './anthropicClient';
import { extractJsonObject, extractJsonArray } from './jsonExtractor';
import { saveErrorToFile } from '../utils/errorExport';

// Mock dependencies
vi.mock('./config', () => ({
  ANTHROPIC_CONFIG: {
    API_KEY: 'test-key',
    API_ENDPOINT: 'https://api.anthropic.com/v1/messages',
    API_VERSION: '2023-06-01',
    MODEL: 'claude-sonnet-4-5-20250929',
    USE_PROXY: false,
  },
  TOKEN_LIMITS: {
    PROFILE_ANALYSIS: 12288,
  },
  TIMEOUTS: {
    DEFAULT: 60000,
  },
  getApiKey: () => 'test-key',
  isUsingProxy: () => false,
}));

vi.mock('./jsonExtractor', () => ({
  extractJsonObject: vi.fn(),
  extractJsonArray: vi.fn(),
  extractJsonObjectWithDebug: vi.fn(),
}));

vi.mock('../utils/errorExport', () => ({
  saveErrorToFile: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('anthropicClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== textContent ====================
  describe('textContent', () => {
    it('should create a text content block with correct structure', () => {
      const result = textContent('Hello, world!');

      expect(result).toEqual({
        type: 'text',
        text: 'Hello, world!',
      });
    });

    it('should handle empty string', () => {
      const result = textContent('');

      expect(result).toEqual({
        type: 'text',
        text: '',
      });
    });

    it('should preserve special characters', () => {
      const text = 'Line 1\nLine 2\tTabbed "quoted" \'apostrophe\'';
      const result = textContent(text);

      expect(result.text).toBe(text);
    });

    it('should handle long text', () => {
      const longText = 'A'.repeat(10000);
      const result = textContent(longText);

      expect(result.text.length).toBe(10000);
    });
  });

  // ==================== imageContent ====================
  describe('imageContent', () => {
    it('should create image content block from raw base64', () => {
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAA';
      const result = imageContent(base64);

      expect(result.type).toBe('image');
      expect(result.source.type).toBe('base64');
      expect(result.source.media_type).toBe('image/jpeg');
      expect(result.source.data).toBe(base64);
    });

    it('should strip data URL prefix from base64', () => {
      const dataUrl =
        'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAA';
      const result = imageContent(dataUrl);

      expect(result.source.data).toBe(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAA'
      );
      expect(result.source.data).not.toContain('data:image');
    });

    it('should use default media type of image/jpeg', () => {
      const result = imageContent('base64data');

      expect(result.source.media_type).toBe('image/jpeg');
    });

    it('should accept custom media type', () => {
      const result = imageContent('base64data', 'image/png');

      expect(result.source.media_type).toBe('image/png');
    });

    it('should handle image/gif media type', () => {
      const result = imageContent('base64data', 'image/gif');

      expect(result.source.media_type).toBe('image/gif');
    });

    it('should handle image/webp media type', () => {
      const result = imageContent('base64data', 'image/webp');

      expect(result.source.media_type).toBe('image/webp');
    });

    it('should handle data URL with different media types', () => {
      const pngDataUrl = 'data:image/png;base64,actualdata';
      const result = imageContent(pngDataUrl, 'image/png');

      expect(result.source.data).toBe('actualdata');
      expect(result.source.media_type).toBe('image/png');
    });
  });

  // ==================== Content Type Helpers ====================
  describe('Content Type Helpers', () => {
    it('textContent returns TextContent type', () => {
      const result = textContent('test');
      expect(result.type).toBe('text');
      expect('text' in result).toBe(true);
    });

    it('imageContent returns ImageContent type', () => {
      const result = imageContent('data');
      expect(result.type).toBe('image');
      expect('source' in result).toBe(true);
      expect(result.source.type).toBe('base64');
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('should handle base64 with multiple commas (edge case)', () => {
      const weirdData = 'data:image/jpeg;base64,actualBase64Data';
      const result = imageContent(weirdData);

      expect(result.source.data).toBe('actualBase64Data');
    });

    it('should handle Unicode in text content', () => {
      const unicodeText = '你好世界 🌍 Привет мир';
      const result = textContent(unicodeText);

      expect(result.text).toBe(unicodeText);
    });
  });

  // ==================== Network Requests ====================
  describe('callAnthropicForText', () => {
    it('should make successful API request and return text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: 'Hello from Claude!' }],
          }),
      });

      const result = await callAnthropicForText({
        messages: [textContent('Hello')],
        maxTokens: 100,
      });

      expect(result).toBe('Hello from Claude!');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () =>
          Promise.resolve({
            error: { message: 'Invalid request' },
          }),
      });

      await expect(
        callAnthropicForText({
          messages: [textContent('Hello')],
          maxTokens: 100,
        })
      ).rejects.toThrow('API Error');

      expect(saveErrorToFile).toHaveBeenCalled();
    });

    it('should handle missing content in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [] }),
      });

      await expect(
        callAnthropicForText({
          messages: [textContent('Hello')],
          maxTokens: 100,
        })
      ).rejects.toThrow('unexpected response structure');

      expect(saveErrorToFile).toHaveBeenCalled();
    });
  });

  describe('callAnthropicForObject', () => {
    it('should parse JSON object from response', async () => {
      const mockObject = { name: 'Test', value: 42 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: JSON.stringify(mockObject) }],
          }),
      });

      vi.mocked(extractJsonObject).mockReturnValueOnce(mockObject);

      const result = await callAnthropicForObject<{ name: string; value: number }>({
        messages: [textContent('Give me JSON')],
        maxTokens: 100,
      });

      expect(result).toEqual(mockObject);
      expect(extractJsonObject).toHaveBeenCalled();
    });

    it('should propagate extraction errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: 'not valid json' }],
          }),
      });

      vi.mocked(extractJsonObject).mockImplementationOnce(() => {
        throw new Error('Failed to parse JSON');
      });

      await expect(
        callAnthropicForObject({
          messages: [textContent('Give me JSON')],
          maxTokens: 100,
        })
      ).rejects.toThrow('Failed to parse JSON');
    });
  });

  describe('callAnthropicForArray', () => {
    it('should parse JSON array from response', async () => {
      const mockArray = [1, 2, 3, 4, 5];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: JSON.stringify(mockArray) }],
          }),
      });

      vi.mocked(extractJsonArray).mockReturnValueOnce(mockArray);

      const result = await callAnthropicForArray<number>({
        messages: [textContent('Give me array')],
        maxTokens: 100,
      });

      expect(result).toEqual(mockArray);
      expect(extractJsonArray).toHaveBeenCalled();
    });
  });

  describe('callAnthropicForArraySafe', () => {
    it('should return empty array on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: () =>
          Promise.resolve({
            error: { message: 'Server error' },
          }),
      });

      const result = await callAnthropicForArraySafe<number>({
        messages: [textContent('Give me array')],
        maxTokens: 100,
      });

      expect(result).toEqual([]);
    });

    it('should return data on success', async () => {
      const mockArray = ['a', 'b', 'c'];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: JSON.stringify(mockArray) }],
          }),
      });

      vi.mocked(extractJsonArray).mockReturnValueOnce(mockArray);

      const result = await callAnthropicForArraySafe<string>({
        messages: [textContent('Give me array')],
        maxTokens: 100,
      });

      expect(result).toEqual(mockArray);
    });
  });

  // ==================== Request Headers ====================
  describe('Request Headers', () => {
    it('should include all required headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: 'Response' }],
          }),
      });

      await callAnthropicForText({
        messages: [textContent('Hello')],
        maxTokens: 100,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'test-key',
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true',
          }),
        })
      );
    });

    it('should include correct request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: 'Response' }],
          }),
      });

      await callAnthropicForText({
        messages: [textContent('Test message')],
        maxTokens: 500,
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.model).toBe('claude-sonnet-4-5-20250929');
      expect(body.max_tokens).toBe(500);
      expect(body.messages[0].content).toEqual([{ type: 'text', text: 'Test message' }]);
    });
  });

  // ==================== Abort Signal ====================
  describe('Abort Signal', () => {
    it('should pass abort signal to fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: 'Response' }],
          }),
      });

      const controller = new AbortController();

      await callAnthropicForText({
        messages: [textContent('Hello')],
        maxTokens: 100,
        signal: controller.signal,
      });

      // Verify signal was passed to fetch
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  // ==================== Message Content ====================
  describe('Message Content', () => {
    it('should handle multiple message contents', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ type: 'text', text: 'Response' }],
          }),
      });

      await callAnthropicForText({
        messages: [
          textContent('First message'),
          imageContent('base64data'),
          textContent('Second message'),
        ],
        maxTokens: 100,
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.messages[0].content).toHaveLength(3);
      expect(body.messages[0].content[0].type).toBe('text');
      expect(body.messages[0].content[1].type).toBe('image');
      expect(body.messages[0].content[2].type).toBe('text');
    });

  });

  // ==================== Response Handling ====================
  describe('Response Handling', () => {
    it('should handle empty response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(
        callAnthropicForText({
          messages: [textContent('Hello')],
          maxTokens: 100,
        })
      ).rejects.toThrow();
    });
  });

  // ==================== Error Scenarios ====================
  describe('Error Scenarios', () => {
    it('should handle network failure', async () => {
      // Mock all retry attempts to fail with network error
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        callAnthropicForText({
          messages: [textContent('Hello')],
          maxTokens: 100,
          retries: 0, // Disable retries for this test
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle JSON parse failure in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(
        callAnthropicForText({
          messages: [textContent('Hello')],
          maxTokens: 100,
        })
      ).rejects.toThrow('Invalid JSON');
    });

    it('should save error details for 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () =>
          Promise.resolve({
            error: { message: 'Rate limit exceeded' },
          }),
      });

      await expect(
        callAnthropicForText({
          messages: [textContent('Hello')],
          maxTokens: 100,
        })
      ).rejects.toThrow('API Error: Rate limit exceeded');

      expect(saveErrorToFile).toHaveBeenCalled();
    });

    it('should save error details for 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () =>
          Promise.resolve({
            error: { message: 'Server error' },
          }),
      });

      await expect(
        callAnthropicForText({
          messages: [textContent('Hello')],
          maxTokens: 100,
        })
      ).rejects.toThrow('API Error: Server error');

      expect(saveErrorToFile).toHaveBeenCalled();
    });
  });
});
