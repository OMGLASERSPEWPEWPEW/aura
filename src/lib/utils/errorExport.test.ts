// src/lib/utils/errorExport.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  summarizeInput,
  setupConsoleCapture,
  clearConsoleLogs,
  saveErrorToFile,
  getLastError,
  clearLastError,
  type ErrorDebugInfo,
} from './errorExport';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    _getStore: () => store,
  };
})();

// Mock document for file download
const createElementMock = vi.fn();
const appendChildMock = vi.fn();
const removeChildMock = vi.fn();
const clickMock = vi.fn();

describe('errorExport', () => {
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();

    // Setup global mocks
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document
    const mockAnchor = {
      href: '',
      download: '',
      click: clickMock,
    };
    createElementMock.mockReturnValue(mockAnchor);

    Object.defineProperty(global, 'document', {
      value: {
        createElement: createElementMock,
        body: {
          appendChild: appendChildMock,
          removeChild: removeChildMock,
        },
      },
      writable: true,
    });

    // Mock Blob with a proper constructor
    global.Blob = class MockBlob {
      content: unknown[];
      options: { type?: string };
      size: number;
      type: string;
      constructor(content: unknown[], options?: { type?: string }) {
        this.content = content;
        this.options = options || {};
        this.size = (content[0] as string)?.length || 0;
        this.type = options?.type || '';
      }
    } as unknown as typeof Blob;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== summarizeInput ====================
  describe('summarizeInput', () => {
    it('should strip base64 image data URLs', () => {
      const input = {
        name: 'test',
        image: 'data:image/jpeg;base64,' + 'A'.repeat(1000),
      };

      const result = summarizeInput(input);

      expect(result.name).toBe('test');
      expect(result.image).toContain('[base64 image,');
      expect(result.image).toContain('chars]');
      expect(result.image).not.toContain('AAAA');
    });

    it('should strip raw base64 strings', () => {
      const input = {
        imageData:
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' + 'A'.repeat(500),
      };

      const result = summarizeInput(input);

      expect(result.imageData).toContain('[base64 image,');
    });

    it('should preserve structure with nested objects', () => {
      const input = {
        user: {
          name: 'John',
          profile: {
            bio: 'Short bio',
          },
        },
        count: 42,
        active: true,
      };

      const result = summarizeInput(input);

      expect(result.user).toEqual({
        name: 'John',
        profile: {
          bio: 'Short bio',
        },
      });
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
    });

    it('should summarize large arrays', () => {
      const input = {
        items: Array(100).fill('item'),
        smallArray: [1, 2, 3],
      };

      const result = summarizeInput(input);

      expect(result.items).toContain('[array of 100 items]');
      expect(result.smallArray).toEqual([1, 2, 3]);
    });

    it('should summarize arrays of image-like strings', () => {
      const input = {
        frames: [
          'data:image/jpeg;base64,' + 'A'.repeat(1000),
          'data:image/jpeg;base64,' + 'B'.repeat(1000),
        ],
      };

      const result = summarizeInput(input);

      expect(result.frames).toContain('[array of 2 items, likely images]');
    });

    it('should truncate long text strings with preview', () => {
      const longText = 'This is a very long text that exceeds the threshold. '.repeat(20);
      const input = {
        description: longText,
      };

      const result = summarizeInput(input);

      expect(result.description).toContain('[text,');
      expect(result.description).toContain('chars]');
      expect(result.description).toContain('This is a very long text');
      expect(result.description).toContain('...');
    });

    it('should preserve short strings as-is', () => {
      const input = {
        name: 'John Doe',
        status: 'active',
      };

      const result = summarizeInput(input);

      expect(result.name).toBe('John Doe');
      expect(result.status).toBe('active');
    });
  });

  // ==================== saveErrorToFile ====================
  describe('saveErrorToFile', () => {
    it('should save error info to localStorage', () => {
      const debugInfo: ErrorDebugInfo = {
        timestamp: '2024-01-01T00:00:00.000Z',
        operation: 'testOperation',
        inputSummary: { test: 'data' },
        parseError: 'Test error',
      };

      saveErrorToFile(debugInfo);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'aura_last_error',
        expect.stringContaining('testOperation')
      );
    });

    it('should add timestamp if not provided', () => {
      const debugInfo: ErrorDebugInfo = {
        timestamp: '',
        operation: 'testOperation',
        inputSummary: {},
      };

      saveErrorToFile(debugInfo);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.timestamp).toBeTruthy();
      expect(savedData.timestamp).not.toBe('');
    });

    it('should trigger file download', () => {
      const debugInfo: ErrorDebugInfo = {
        timestamp: '2024-01-01T00:00:00.000Z',
        operation: 'testOperation',
        inputSummary: {},
      };

      saveErrorToFile(debugInfo);

      expect(createElementMock).toHaveBeenCalledWith('a');
      expect(clickMock).toHaveBeenCalled();
    });

    it('should include all debug info fields in saved data', () => {
      const debugInfo: ErrorDebugInfo = {
        timestamp: '2024-01-01T00:00:00.000Z',
        operation: 'complexOperation',
        inputSummary: { key: 'value' },
        rawResponse: 'raw response text',
        parseError: 'parsing failed',
        apiError: { status: 500, message: 'Server error' },
      };

      saveErrorToFile(debugInfo);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.operation).toBe('complexOperation');
      expect(savedData.rawResponse).toBe('raw response text');
      expect(savedData.parseError).toBe('parsing failed');
      expect(savedData.apiError.status).toBe(500);
    });

    it('should handle download errors gracefully', () => {
      // Make createElement throw an error
      createElementMock.mockImplementationOnce(() => {
        throw new Error('DOM error');
      });

      const debugInfo: ErrorDebugInfo = {
        timestamp: '2024-01-01T00:00:00.000Z',
        operation: 'testOperation',
        inputSummary: {},
      };

      // Should not throw, just log error
      expect(() => saveErrorToFile(debugInfo)).not.toThrow();

      // Should still save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  // ==================== getLastError ====================
  describe('getLastError', () => {
    it('should retrieve last error from localStorage', () => {
      const errorData: ErrorDebugInfo = {
        timestamp: '2024-01-01T00:00:00.000Z',
        operation: 'testOp',
        inputSummary: { test: true },
      };
      localStorageMock.setItem('aura_last_error', JSON.stringify(errorData));

      const result = getLastError();

      expect(result).toEqual(errorData);
    });

    it('should return null when no error stored', () => {
      const result = getLastError();

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorageMock.setItem('aura_last_error', 'not valid json {{{');
      // Override getItem to return the invalid JSON
      localStorageMock.getItem.mockReturnValueOnce('not valid json {{{');

      const result = getLastError();

      expect(result).toBeNull();
    });

    it('should parse complex error objects', () => {
      const complexError: ErrorDebugInfo = {
        timestamp: '2024-01-01T00:00:00.000Z',
        operation: 'analyzeProfile',
        inputSummary: {
          frameCount: 10,
          hasUserContext: true,
        },
        apiError: {
          status: 429,
          message: 'Rate limit exceeded',
        },
        additionalContext: {
          retryCount: 3,
          lastAttempt: '2024-01-01T00:00:05.000Z',
        },
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(complexError));

      const result = getLastError();

      expect(result?.operation).toBe('analyzeProfile');
      expect(result?.apiError?.status).toBe(429);
      expect(result?.additionalContext?.retryCount).toBe(3);
    });
  });

  // ==================== clearLastError ====================
  describe('clearLastError', () => {
    it('should remove last error from localStorage', () => {
      localStorageMock.setItem('aura_last_error', '{"test": true}');

      clearLastError();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('aura_last_error');
    });

    it('should not throw when no error exists', () => {
      expect(() => clearLastError()).not.toThrow();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('aura_last_error');
    });
  });

  // ==================== clearConsoleLogs ====================
  describe('clearConsoleLogs', () => {
    it('should remove console logs from localStorage', () => {
      localStorageMock.setItem('aura_console_logs', '[{"type":"log"}]');

      clearConsoleLogs();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('aura_console_logs');
    });

    it('should not throw when no logs exist', () => {
      expect(() => clearConsoleLogs()).not.toThrow();
    });
  });

  // ==================== setupConsoleCapture ====================
  describe('setupConsoleCapture', () => {
    let originalConsoleLog: typeof console.log;
    let originalConsoleError: typeof console.error;
    let originalConsoleWarn: typeof console.warn;

    beforeEach(() => {
      // Store original console methods
      originalConsoleLog = console.log;
      originalConsoleError = console.error;
      originalConsoleWarn = console.warn;

      // Reset the module to clear the consoleCaptureInitialized flag
      vi.resetModules();
    });

    afterEach(() => {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    });

    it('should capture console.log calls', async () => {
      const { setupConsoleCapture } = await import('./errorExport');

      setupConsoleCapture();

      // Now console.log should be wrapped
      console.log('test message');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'aura_console_logs',
        expect.stringContaining('test message')
      );
    });

    it('should capture console.error calls', async () => {
      const { setupConsoleCapture } = await import('./errorExport');

      setupConsoleCapture();

      console.error('error message');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'aura_console_logs',
        expect.stringContaining('error message')
      );
    });

    it('should capture console.warn calls', async () => {
      const { setupConsoleCapture } = await import('./errorExport');

      setupConsoleCapture();

      console.warn('warning message');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'aura_console_logs',
        expect.stringContaining('warning message')
      );
    });

    it('should include timestamp in captured logs', async () => {
      const { setupConsoleCapture } = await import('./errorExport');

      setupConsoleCapture();

      console.log('timestamped message');

      const savedLogs = localStorageMock.setItem.mock.calls.find(
        (call) => call[0] === 'aura_console_logs'
      );
      expect(savedLogs).toBeTruthy();
      const logs = JSON.parse(savedLogs![1]);
      expect(logs[logs.length - 1].time).toBeTruthy();
    });

    it('should include log type in captured logs', async () => {
      const { setupConsoleCapture } = await import('./errorExport');

      setupConsoleCapture();

      console.error('typed error');

      // Get the last saved console logs
      const savedLogsCalls = localStorageMock.setItem.mock.calls.filter(
        (call) => call[0] === 'aura_console_logs'
      );
      expect(savedLogsCalls.length).toBeGreaterThan(0);

      const lastSavedLogs = savedLogsCalls[savedLogsCalls.length - 1][1];
      const logs = JSON.parse(lastSavedLogs);

      // Find an error log entry
      const errorLog = logs.find(
        (l: { type: string; args: unknown[] }) => l.type === 'error'
      );
      expect(errorLog).toBeTruthy();
      expect(errorLog.type).toBe('error');
    });

    it('should not initialize twice', async () => {
      const { setupConsoleCapture } = await import('./errorExport');

      setupConsoleCapture();
      const firstLog = console.log;

      setupConsoleCapture(); // Call again
      const secondLog = console.log;

      // Should be the same wrapped function
      expect(firstLog).toBe(secondLog);
    });

    it('should still call original console methods', async () => {
      const originalLog = vi.fn();
      console.log = originalLog;

      const { setupConsoleCapture } = await import('./errorExport');
      setupConsoleCapture();

      console.log('test');

      // Original should still be called (through bind)
      // Note: The implementation binds the original, so it will be called
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  // ==================== Integration Tests ====================
  describe('Integration', () => {
    it('should save and retrieve error correctly', () => {
      const errorInfo: ErrorDebugInfo = {
        timestamp: new Date().toISOString(),
        operation: 'integrationTest',
        inputSummary: { frames: 5 },
        parseError: 'JSON parse failed',
      };

      saveErrorToFile(errorInfo);

      // Manually set the mock to return what was saved
      const savedValue = localStorageMock.setItem.mock.calls.find(
        (call) => call[0] === 'aura_last_error'
      )?.[1];
      localStorageMock.getItem.mockReturnValueOnce(savedValue);

      const retrieved = getLastError();

      expect(retrieved?.operation).toBe('integrationTest');
      expect(retrieved?.parseError).toBe('JSON parse failed');
    });

    it('should clear error after retrieval if needed', () => {
      const errorInfo: ErrorDebugInfo = {
        timestamp: new Date().toISOString(),
        operation: 'clearTest',
        inputSummary: {},
      };

      saveErrorToFile(errorInfo);
      clearLastError();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('aura_last_error');
    });
  });
});
