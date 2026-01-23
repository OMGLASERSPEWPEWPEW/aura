// src/lib/utils/errorExport.ts
// Utility for auto-saving error information as JSON files for debugging

// Console capture types
interface CapturedLog {
  type: 'log' | 'error' | 'warn' | 'uncaught';
  args: unknown[];
  time: string;
}

// Track if console capture has been set up
let consoleCaptureInitialized = false;
let consoleCaptureLogs: CapturedLog[] = [];

/**
 * Sets up console capture to save ALL logs to localStorage.
 * Call this once at app startup (in main.tsx).
 */
export function setupConsoleCapture(): void {
  // Don't set up twice
  if (consoleCaptureInitialized) return;
  consoleCaptureInitialized = true;

  consoleCaptureLogs = [];

  // Capture originals in const to avoid null issues
  const origLog = console.log.bind(console);
  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);

  console.log = (...args: unknown[]) => {
    consoleCaptureLogs.push({ type: 'log', args, time: new Date().toISOString() });
    try {
      localStorage.setItem('aura_console_logs', JSON.stringify(consoleCaptureLogs));
    } catch { /* localStorage full, ignore */ }
    origLog(...args);
  };

  console.error = (...args: unknown[]) => {
    consoleCaptureLogs.push({ type: 'error', args, time: new Date().toISOString() });
    try {
      localStorage.setItem('aura_console_logs', JSON.stringify(consoleCaptureLogs));
    } catch { /* localStorage full, ignore */ }
    origError(...args);
  };

  console.warn = (...args: unknown[]) => {
    consoleCaptureLogs.push({ type: 'warn', args, time: new Date().toISOString() });
    try {
      localStorage.setItem('aura_console_logs', JSON.stringify(consoleCaptureLogs));
    } catch { /* localStorage full, ignore */ }
    origWarn(...args);
  };

  // Global error handler for uncaught errors
  window.onerror = (msg, url, line, col, error) => {
    consoleCaptureLogs.push({
      type: 'uncaught',
      args: [msg, url, line, col, error?.stack || error?.message || 'unknown'],
      time: new Date().toISOString()
    });
    try {
      localStorage.setItem('aura_console_logs', JSON.stringify(consoleCaptureLogs));
    } catch { /* localStorage full, ignore */ }
    return false; // Allow default error handling
  };

  // Handle unhandled promise rejections
  window.onunhandledrejection = (event) => {
    consoleCaptureLogs.push({
      type: 'uncaught',
      args: ['Unhandled Promise Rejection:', event.reason],
      time: new Date().toISOString()
    });
    try {
      localStorage.setItem('aura_console_logs', JSON.stringify(consoleCaptureLogs));
    } catch { /* localStorage full, ignore */ }
  };

  console.log('[ConsoleCapture] Initialized - logs will be captured');
}

/**
 * Downloads all captured console logs as a JSON file.
 */
export function downloadConsoleLogs(): void {
  const logs = localStorage.getItem('aura_console_logs') || '[]';
  const blob = new Blob([logs], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `aura_debug_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/**
 * Clears captured console logs.
 */
export function clearConsoleLogs(): void {
  consoleCaptureLogs = [];
  localStorage.removeItem('aura_console_logs');
}

export interface ErrorDebugInfo {
  timestamp: string;
  operation: string;
  inputSummary: Record<string, unknown>;
  rawResponse?: string;
  parseError?: string;
  apiError?: { status: number; message: string };
  extractedJson?: string;
  additionalContext?: Record<string, unknown>;
}

/**
 * Saves error debug information to a downloadable JSON file and localStorage.
 * Automatically triggers download for easy airdrop debugging.
 */
export function saveErrorToFile(debugInfo: ErrorDebugInfo): void {
  // Ensure timestamp is set
  if (!debugInfo.timestamp) {
    debugInfo.timestamp = new Date().toISOString();
  }

  const jsonContent = JSON.stringify(debugInfo, null, 2);

  // Save to localStorage for later retrieval
  localStorage.setItem('aura_last_error', jsonContent);

  // Auto-download the error file
  try {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_error_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Error debug info auto-downloaded:', debugInfo.operation);
  } catch (downloadError) {
    console.error('Failed to auto-download error file:', downloadError);
    // At least it's saved in localStorage
  }
}

/**
 * Retrieves the last saved error from localStorage.
 */
export function getLastError(): ErrorDebugInfo | null {
  const stored = localStorage.getItem('aura_last_error');
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ErrorDebugInfo;
  } catch {
    return null;
  }
}

/**
 * Clears the last saved error from localStorage.
 */
export function clearLastError(): void {
  localStorage.removeItem('aura_last_error');
}

/**
 * Creates a summary of input data for error reporting (avoids saving full base64 images).
 */
export function summarizeInput(input: Record<string, unknown>): Record<string, unknown> {
  const summary: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.length > 500) {
      // Likely base64 or long text - summarize
      if (value.startsWith('data:image') || value.match(/^[A-Za-z0-9+/=]{100,}$/)) {
        summary[key] = `[base64 image, ${value.length} chars]`;
      } else {
        summary[key] = `[text, ${value.length} chars]: ${value.substring(0, 100)}...`;
      }
    } else if (Array.isArray(value)) {
      // Summarize arrays
      if (value.length > 0 && typeof value[0] === 'string' && value[0].length > 500) {
        summary[key] = `[array of ${value.length} items, likely images]`;
      } else {
        summary[key] = value.length <= 5 ? value : `[array of ${value.length} items]`;
      }
    } else {
      summary[key] = value;
    }
  }

  return summary;
}
