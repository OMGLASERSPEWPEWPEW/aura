// src/lib/api/index.ts
// Re-export all API utilities

export { ANTHROPIC_CONFIG, TOKEN_LIMITS, TIMEOUTS, getApiKey } from './config';
export {
  extractJsonObject,
  extractJsonArray,
  extractJsonObjectWithDebug,
  // Safe variants
  extractJsonObjectSafe,
  extractJsonArraySafe,
} from './jsonExtractor';
export {
  callAnthropicForObject,
  callAnthropicForArray,
  callAnthropicForArraySafe,
  callAnthropicForText,
  callAnthropicWithDebug,
  textContent,
  imageContent,
  // Safe variants
  callAnthropicForObjectSafe,
  callAnthropicForArrayResultSafe,
  callAnthropicForTextSafe,
  // Zod-validated variants
  callAnthropicForObjectValidated,
  callAnthropicForArrayValidated,
  type MessageContent,
  type TextContent,
  type ImageContent,
  type AnthropicRequestOptions,
} from './anthropicClient';
