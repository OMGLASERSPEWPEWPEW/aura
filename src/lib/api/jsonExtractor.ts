// src/lib/api/jsonExtractor.ts
// Centralized JSON extraction from AI responses

/**
 * Extract a JSON object from a text response that may contain markdown or other text.
 * Finds the first '{' and last '}' and parses the content between them.
 */
export function extractJsonObject<T>(text: string): T {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('AI did not return a valid JSON object.');
  }

  const jsonString = text.substring(startIndex, endIndex + 1);

  try {
    return JSON.parse(jsonString) as T;
  } catch {
    console.error('JSON Parse Failed on:', jsonString);
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
    throw new Error('AI did not return a valid JSON array.');
  }

  const jsonString = text.substring(startIndex, endIndex + 1);

  try {
    return JSON.parse(jsonString) as T[];
  } catch {
    console.error('JSON Parse Failed on:', jsonString);
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
    throw new Error('AI did not return a valid JSON object.');
  }

  const jsonString = text.substring(startIndex, endIndex + 1);
  debugInfo.extractedJsonLength = jsonString.length;

  try {
    const parsed = JSON.parse(jsonString) as T;
    localStorage.removeItem('aura_debug_info');
    return parsed;
  } catch (parseError) {
    debugInfo.parseError = String(parseError);
    debugInfo.extractedJson = jsonString;
    localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));
    throw new Error('Failed to parse AI response. Debug info saved - click "Download Debug" to see details.');
  }
}
