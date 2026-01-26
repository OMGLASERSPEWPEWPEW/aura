// src/lib/api/jsonExtractor.ts
// Centralized JSON extraction from AI responses

import { saveErrorToFile } from '../utils/errorExport';
import { ParseError, type Result, Ok, Err } from '../errors';

/**
 * Validates that a JSON string appears to be complete (not truncated mid-response).
 * Returns { valid: true } if OK, or { valid: false, reason: string } if truncated.
 */
export function validateJsonCompleteness(jsonString: string): { valid: true } | { valid: false; reason: string } {
  // Count brackets - if unbalanced, likely truncated
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }
  }

  if (braceCount !== 0) {
    return { valid: false, reason: `Unbalanced braces (${braceCount > 0 ? 'missing closing }' : 'extra closing }'})` };
  }
  if (bracketCount !== 0) {
    return { valid: false, reason: `Unbalanced brackets (${bracketCount > 0 ? 'missing closing ]' : 'extra closing ]'})` };
  }
  if (inString) {
    return { valid: false, reason: 'Unterminated string (JSON truncated mid-string)' };
  }

  // Check for common truncation patterns - string ending without closing punctuation
  const trimmed = jsonString.trim();
  const lastChar = trimmed[trimmed.length - 1];
  if (lastChar !== '}' && lastChar !== ']') {
    return { valid: false, reason: `JSON ends with unexpected character: '${lastChar}'` };
  }

  return { valid: true };
}

/**
 * Extract a JSON object from a text response that may contain markdown or other text.
 * Finds the first '{' and last '}' and parses the content between them.
 */
export function extractJsonObject<T>(text: string): T {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');

  if (startIndex === -1 || endIndex === -1) {
    // Auto-save error for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonObject',
      inputSummary: { textLength: text.length },
      rawResponse: text.substring(0, 3000),
      parseError: 'AI did not return a valid JSON object - no { or } found',
    });
    throw new Error('AI did not return a valid JSON object.');
  }

  const jsonString = text.substring(startIndex, endIndex + 1);

  // Validate completeness before attempting parse
  const validation = validateJsonCompleteness(jsonString);
  if (!validation.valid) {
    console.error('JSON appears truncated:', validation.reason);
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonObject',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(jsonString.length - 500),
      parseError: `Truncated response: ${validation.reason}`,
    });
    throw new Error(`AI response was truncated (${validation.reason}). Please try again.`);
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (parseError) {
    console.error('JSON Parse Failed on:', jsonString);
    // Auto-save error for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonObject',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(0, 1500),
      parseError: String(parseError),
    });
    throw new Error('Failed to parse AI response. Check console for raw output.');
  }
}

/**
 * Extract a JSON array from a text response that may contain markdown or other text.
 * Finds the first '[' and last ']' and parses the content between them.
 */
export function extractJsonArray<T>(text: string): T[] {
  const startIndex = text.indexOf('[');
  const endIndex = text.lastIndexOf(']');

  if (startIndex === -1 || endIndex === -1) {
    // Auto-save error for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonArray',
      inputSummary: { textLength: text.length },
      rawResponse: text.substring(0, 3000),
      parseError: 'AI did not return a valid JSON array - no [ or ] found',
    });
    throw new Error('AI did not return a valid JSON array.');
  }

  const jsonString = text.substring(startIndex, endIndex + 1);

  // Validate completeness before attempting parse
  const validation = validateJsonCompleteness(jsonString);
  if (!validation.valid) {
    console.error('JSON appears truncated:', validation.reason);
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonArray',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(jsonString.length - 500),
      parseError: `Truncated response: ${validation.reason}`,
    });
    throw new Error(`AI response was truncated (${validation.reason}). Please try again.`);
  }

  try {
    return JSON.parse(jsonString) as T[];
  } catch (parseError) {
    console.error('JSON Parse Failed on:', jsonString);
    // Auto-save error for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonArray',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(0, 1500),
      parseError: String(parseError),
    });
    throw new Error('Failed to parse AI response. Check console for raw output.');
  }
}

/**
 * Extract JSON with additional debug info saved to localStorage on failure.
 * Used for more complex operations that need detailed debugging.
 */
export function extractJsonObjectWithDebug<T>(
  text: string,
  debugInfo: Record<string, unknown>
): T {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');

  debugInfo.jsonStartIndex = startIndex;
  debugInfo.jsonEndIndex = endIndex;

  if (startIndex === -1 || endIndex === -1) {
    debugInfo.fullRawText = text;
    localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));

    // Auto-save error file for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: (debugInfo.operation as string) || 'extractJsonObjectWithDebug',
      inputSummary: debugInfo,
      rawResponse: text.substring(0, 3000),
      parseError: 'AI did not return a valid JSON object - no { or } found',
    });

    throw new Error('AI did not return a valid JSON object.');
  }

  const jsonString = text.substring(startIndex, endIndex + 1);
  debugInfo.extractedJsonLength = jsonString.length;

  // Validate completeness before attempting parse
  const validation = validateJsonCompleteness(jsonString);
  if (!validation.valid) {
    debugInfo.truncationReason = validation.reason;
    debugInfo.extractedJsonTail = jsonString.substring(jsonString.length - 500);
    localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));

    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: (debugInfo.operation as string) || 'extractJsonObjectWithDebug',
      inputSummary: debugInfo,
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(jsonString.length - 500),
      parseError: `Truncated response: ${validation.reason}`,
    });

    throw new Error(`AI response was truncated (${validation.reason}). Please try again.`);
  }

  try {
    const parsed = JSON.parse(jsonString) as T;
    localStorage.removeItem('aura_debug_info');
    return parsed;
  } catch (parseError) {
    debugInfo.parseError = String(parseError);
    debugInfo.extractedJson = jsonString;
    localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));

    // Auto-save error file for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: (debugInfo.operation as string) || 'extractJsonObjectWithDebug',
      inputSummary: debugInfo,
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(0, 1500),
      parseError: String(parseError),
    });

    throw new Error('Failed to parse AI response. Debug info saved - click "Download Debug" to see details.');
  }
}

// ============================================
// Safe variants that return Result<T, ParseError>
// ============================================

/**
 * Extract a JSON object from text, returning a Result instead of throwing.
 *
 * @example
 * ```typescript
 * const result = extractJsonObjectSafe<Profile>(text);
 * if (result.ok) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error.getUserMessage());
 * }
 * ```
 */
export function extractJsonObjectSafe<T>(text: string): Result<T, ParseError> {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');

  if (startIndex === -1 || endIndex === -1) {
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonObjectSafe',
      inputSummary: { textLength: text.length },
      rawResponse: text.substring(0, 3000),
      parseError: 'AI did not return a valid JSON object - no { or } found',
    });

    return Err(new ParseError('no_json', {
      rawText: text.substring(0, 500),
      context: { textLength: text.length },
    }));
  }

  const jsonString = text.substring(startIndex, endIndex + 1);

  const validation = validateJsonCompleteness(jsonString);
  if (!validation.valid) {
    console.error('JSON appears truncated:', validation.reason);
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonObjectSafe',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(jsonString.length - 500),
      parseError: `Truncated response: ${validation.reason}`,
    });

    return Err(new ParseError('truncated', {
      message: validation.reason,
      rawText: jsonString.substring(jsonString.length - 200),
      context: { textLength: text.length, jsonStringLength: jsonString.length },
    }));
  }

  try {
    return Ok(JSON.parse(jsonString) as T);
  } catch (parseError) {
    console.error('JSON Parse Failed on:', jsonString);
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonObjectSafe',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(0, 1500),
      parseError: String(parseError),
    });

    return Err(new ParseError('invalid_json', {
      rawText: jsonString.substring(0, 500),
      context: { parseError: String(parseError) },
      cause: parseError instanceof Error ? parseError : undefined,
    }));
  }
}

/**
 * Extract a JSON array from text, returning a Result instead of throwing.
 */
export function extractJsonArraySafe<T>(text: string): Result<T[], ParseError> {
  const startIndex = text.indexOf('[');
  const endIndex = text.lastIndexOf(']');

  if (startIndex === -1 || endIndex === -1) {
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonArraySafe',
      inputSummary: { textLength: text.length },
      rawResponse: text.substring(0, 3000),
      parseError: 'AI did not return a valid JSON array - no [ or ] found',
    });

    return Err(new ParseError('no_json', {
      rawText: text.substring(0, 500),
      context: { textLength: text.length },
    }));
  }

  const jsonString = text.substring(startIndex, endIndex + 1);

  const validation = validateJsonCompleteness(jsonString);
  if (!validation.valid) {
    console.error('JSON appears truncated:', validation.reason);
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonArraySafe',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(jsonString.length - 500),
      parseError: `Truncated response: ${validation.reason}`,
    });

    return Err(new ParseError('truncated', {
      message: validation.reason,
      rawText: jsonString.substring(jsonString.length - 200),
      context: { textLength: text.length, jsonStringLength: jsonString.length },
    }));
  }

  try {
    return Ok(JSON.parse(jsonString) as T[]);
  } catch (parseError) {
    console.error('JSON Parse Failed on:', jsonString);
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonArraySafe',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(0, 1500),
      parseError: String(parseError),
    });

    return Err(new ParseError('invalid_json', {
      rawText: jsonString.substring(0, 500),
      context: { parseError: String(parseError) },
      cause: parseError instanceof Error ? parseError : undefined,
    }));
  }
}
