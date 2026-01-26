// src/lib/api/jsonExtractor.ts
// Centralized JSON extraction from AI responses

import { z } from 'zod';
import { saveErrorToFile } from '../utils/errorExport';
import { ParseError, SchemaError, type Result, Ok, Err } from '../errors';

// ============================================
// Smart Extraction Helpers
// ============================================

/**
 * Try to extract JSON from a markdown code block.
 * Returns null if no code block found or content doesn't look like JSON.
 */
function extractFromCodeBlock(text: string): string | null {
  // Match ```json...``` or ```...``` containing JSON
  const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/;
  const match = text.match(codeBlockRegex);
  if (match && match[1]) {
    const content = match[1].trim();
    if (content.startsWith('{') || content.startsWith('[')) {
      return content;
    }
  }
  return null;
}

/**
 * Find a balanced JSON structure starting at a specific index.
 * Returns the end index (inclusive) or -1 if unbalanced.
 */
function findBalancedEnd(text: string, startIndex: number, startChar: '{' | '['): number {
  const endChar = startChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === startChar) depth++;
      else if (char === endChar) {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
  }
  return -1; // Unbalanced
}

/**
 * Find balanced JSON structures and return the first one that parses as valid JSON.
 * Tries each potential starting position until finding valid JSON.
 */
function extractBalancedJson(text: string, startChar: '{' | '['): string | null {
  let searchStart = 0;

  while (searchStart < text.length) {
    const startIndex = text.indexOf(startChar, searchStart);
    if (startIndex === -1) break;

    const endIndex = findBalancedEnd(text, startIndex, startChar);
    if (endIndex !== -1) {
      const candidate = text.substring(startIndex, endIndex + 1);
      // Try to parse - if valid JSON, return it
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // Not valid JSON, try next candidate
      }
    }

    // Move past this start position to find next candidate
    searchStart = startIndex + 1;
  }

  return null; // No valid balanced JSON found
}

/**
 * Smart extraction strategy for JSON objects.
 * Tries multiple approaches in order of reliability:
 * 1. Markdown code block (most explicit)
 * 2. Balanced bracket matching (handles text before JSON)
 * 3. First/last fallback (legacy behavior)
 */
function smartExtractObject(text: string): string | null {
  // Strategy 1: Try markdown code block first
  const codeBlockJson = extractFromCodeBlock(text);
  if (codeBlockJson && codeBlockJson.startsWith('{')) {
    return codeBlockJson;
  }

  // Strategy 2: Try balanced bracket matching
  const balancedJson = extractBalancedJson(text, '{');
  if (balancedJson) {
    return balancedJson;
  }

  // Strategy 3: Fall back to first/last (legacy behavior)
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return text.substring(startIndex, endIndex + 1);
  }

  return null;
}

/**
 * Smart extraction strategy for JSON arrays.
 * Same multi-strategy approach as objects.
 */
function smartExtractArray(text: string): string | null {
  // Strategy 1: Try markdown code block first
  const codeBlockJson = extractFromCodeBlock(text);
  if (codeBlockJson && codeBlockJson.startsWith('[')) {
    return codeBlockJson;
  }

  // Strategy 2: Try balanced bracket matching
  const balancedJson = extractBalancedJson(text, '[');
  if (balancedJson) {
    return balancedJson;
  }

  // Strategy 3: Fall back to first/last (legacy behavior)
  const startIndex = text.indexOf('[');
  const endIndex = text.lastIndexOf(']');
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return text.substring(startIndex, endIndex + 1);
  }

  return null;
}

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
 * Uses smart extraction: tries code blocks, then balanced matching, then first/last fallback.
 */
export function extractJsonObject<T>(text: string): T {
  const jsonString = smartExtractObject(text);

  if (!jsonString) {
    // Auto-save error for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonObject',
      inputSummary: { textLength: text.length },
      rawResponse: text.substring(0, 3000),
      parseError: 'AI did not return a valid JSON object - no { or } found',
    });
    throw new ParseError('no_json', {
      rawText: text.substring(0, 500),
      context: { textLength: text.length },
    });
  }

  // Validate completeness before attempting parse
  const validation = validateJsonCompleteness(jsonString);
  if (!validation.valid) {
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonObject',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(jsonString.length - 500),
      parseError: `Truncated response: ${validation.reason}`,
    });
    throw new ParseError('truncated', {
      message: validation.reason,
      rawText: jsonString.substring(jsonString.length - 200),
      context: { textLength: text.length, jsonStringLength: jsonString.length },
    });
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (parseError) {
    // Auto-save error for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonObject',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(0, 1500),
      parseError: String(parseError),
    });
    throw new ParseError('invalid_json', {
      rawText: jsonString.substring(0, 500),
      context: { parseError: String(parseError) },
      cause: parseError instanceof Error ? parseError : undefined,
    });
  }
}

/**
 * Extract a JSON array from a text response that may contain markdown or other text.
 * Uses smart extraction: tries code blocks, then balanced matching, then first/last fallback.
 */
export function extractJsonArray<T>(text: string): T[] {
  const jsonString = smartExtractArray(text);

  if (!jsonString) {
    // Auto-save error for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonArray',
      inputSummary: { textLength: text.length },
      rawResponse: text.substring(0, 3000),
      parseError: 'AI did not return a valid JSON array - no [ or ] found',
    });
    throw new ParseError('no_json', {
      rawText: text.substring(0, 500),
      context: { textLength: text.length },
    });
  }

  // Validate completeness before attempting parse
  const validation = validateJsonCompleteness(jsonString);
  if (!validation.valid) {
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonArray',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(jsonString.length - 500),
      parseError: `Truncated response: ${validation.reason}`,
    });
    throw new ParseError('truncated', {
      message: validation.reason,
      rawText: jsonString.substring(jsonString.length - 200),
      context: { textLength: text.length, jsonStringLength: jsonString.length },
    });
  }

  try {
    return JSON.parse(jsonString) as T[];
  } catch (parseError) {
    // Auto-save error for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractJsonArray',
      inputSummary: { textLength: text.length, jsonStringLength: jsonString.length },
      rawResponse: text.substring(0, 1500),
      extractedJson: jsonString.substring(0, 1500),
      parseError: String(parseError),
    });
    throw new ParseError('invalid_json', {
      rawText: jsonString.substring(0, 500),
      context: { parseError: String(parseError) },
      cause: parseError instanceof Error ? parseError : undefined,
    });
  }
}

/**
 * Extract JSON with additional debug info saved to localStorage on failure.
 * Used for more complex operations that need detailed debugging.
 * Uses smart extraction: tries code blocks, then balanced matching, then first/last fallback.
 */
export function extractJsonObjectWithDebug<T>(
  text: string,
  debugInfo: Record<string, unknown>
): T {
  const jsonString = smartExtractObject(text);

  debugInfo.extractionMethod = jsonString ? 'smart' : 'failed';

  if (!jsonString) {
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

    throw new ParseError('no_json', {
      rawText: text.substring(0, 500),
      context: { textLength: text.length, debugInfo },
    });
  }

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

    throw new ParseError('truncated', {
      message: validation.reason,
      rawText: jsonString.substring(jsonString.length - 200),
      context: { textLength: text.length, jsonStringLength: jsonString.length, debugInfo },
    });
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

    throw new ParseError('invalid_json', {
      rawText: jsonString.substring(0, 500),
      context: { parseError: String(parseError), debugInfo },
      cause: parseError instanceof Error ? parseError : undefined,
    });
  }
}

// ============================================
// Safe variants that return Result<T, ParseError>
// ============================================

/**
 * Extract a JSON object from text, returning a Result instead of throwing.
 * Uses smart extraction: tries code blocks, then balanced matching, then first/last fallback.
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
  const jsonString = smartExtractObject(text);

  if (!jsonString) {
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

  const validation = validateJsonCompleteness(jsonString);
  if (!validation.valid) {
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
 * Uses smart extraction: tries code blocks, then balanced matching, then first/last fallback.
 */
export function extractJsonArraySafe<T>(text: string): Result<T[], ParseError> {
  const jsonString = smartExtractArray(text);

  if (!jsonString) {
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

  const validation = validateJsonCompleteness(jsonString);
  if (!validation.valid) {
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

// ============================================
// Zod-validated extraction functions
// ============================================

/**
 * Extract JSON and validate against a Zod schema.
 * Returns a Result with validated data or an error.
 *
 * @example
 * ```typescript
 * const result = extractAndValidate(text, VirtueScoreResultSchema);
 * if (result.ok) {
 *   // result.value is typed as VirtueScoreResult
 *   console.log(result.value.virtue_scores);
 * } else {
 *   // result.error is ParseError | SchemaError
 *   console.error(result.error.getUserMessage());
 * }
 * ```
 */
export function extractAndValidate<T>(
  text: string,
  schema: z.ZodSchema<T>
): Result<T, ParseError | SchemaError> {
  // First, extract the JSON
  const extractResult = extractJsonObjectSafe<unknown>(text);

  if (!extractResult.ok) {
    return extractResult as Result<T, ParseError>;
  }

  // Then validate against the schema
  const parseResult = schema.safeParse(extractResult.value);

  if (!parseResult.success) {
    const issues = parseResult.error.issues;
    const missingFields: string[] = [];
    const invalidFields: string[] = [];

    for (const issue of issues) {
      const path = issue.path.join('.');
      // Check for missing fields (invalid_type with undefined message)
      if (issue.code === 'invalid_type' && issue.message.includes('Required')) {
        missingFields.push(path || issue.message);
      } else {
        invalidFields.push(path ? `${path}: ${issue.message}` : issue.message);
      }
    }

    // Save error for debugging
    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractAndValidate',
      inputSummary: { textLength: text.length },
      rawResponse: text.substring(0, 2000),
      parseError: `Schema validation failed: ${parseResult.error.message}`,
      additionalContext: {
        zodErrors: issues.map(i => ({ path: i.path.join('.'), message: i.message, code: i.code })),
      },
    });

    return Err(new SchemaError(
      `AI response failed schema validation: ${issues.map(i => i.message).join('; ')}`,
      {
        missingFields: missingFields.length > 0 ? missingFields : undefined,
        invalidFields: invalidFields.length > 0 ? invalidFields : undefined,
        context: { zodErrors: issues },
      }
    ));
  }

  return Ok(parseResult.data);
}

/**
 * Extract JSON array and validate against a Zod array schema.
 * Returns a Result with validated array or an error.
 */
export function extractAndValidateArray<T>(
  text: string,
  itemSchema: z.ZodSchema<T>
): Result<T[], ParseError | SchemaError> {
  // First, extract the JSON array
  const extractResult = extractJsonArraySafe<unknown>(text);

  if (!extractResult.ok) {
    return extractResult as Result<T[], ParseError>;
  }

  // Then validate each item against the schema
  const arraySchema = z.array(itemSchema);
  const parseResult = arraySchema.safeParse(extractResult.value);

  if (!parseResult.success) {
    const issues = parseResult.error.issues;
    const invalidFields: string[] = [];

    for (const issue of issues) {
      const path = issue.path.join('.');
      invalidFields.push(path ? `${path}: ${issue.message}` : issue.message);
    }

    saveErrorToFile({
      timestamp: new Date().toISOString(),
      operation: 'extractAndValidateArray',
      inputSummary: { textLength: text.length },
      rawResponse: text.substring(0, 2000),
      parseError: `Schema validation failed: ${parseResult.error.message}`,
      additionalContext: {
        zodErrors: issues.map(i => ({ path: i.path.join('.'), message: i.message, code: i.code })),
      },
    });

    return Err(new SchemaError(
      `AI response array failed schema validation: ${issues.map(i => i.message).join('; ')}`,
      {
        invalidFields: invalidFields.length > 0 ? invalidFields : undefined,
        context: { zodErrors: issues },
      }
    ));
  }

  return Ok(parseResult.data);
}
