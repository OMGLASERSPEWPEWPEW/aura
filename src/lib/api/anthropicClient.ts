// src/lib/api/anthropicClient.ts
// Centralized Anthropic API client

import { ANTHROPIC_CONFIG, getApiKey } from './config';
import { extractJsonObject, extractJsonArray, extractJsonObjectWithDebug } from './jsonExtractor';

// Content types for API messages
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
}

export type MessageContent = TextContent | ImageContent;

export interface AnthropicRequestOptions {
  messages: MessageContent[];
  maxTokens: number;
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

/**
 * Make a request to the Anthropic API and return the raw text response.
 */
async function makeRequest(options: AnthropicRequestOptions): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(ANTHROPIC_CONFIG.API_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_CONFIG.API_VERSION,
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_CONFIG.MODEL,
      max_tokens: options.maxTokens,
      messages: [
        {
          role: 'user',
          content: options.messages,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('API Error:', errorData);
    throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data: AnthropicResponse = await response.json();

  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error('API returned unexpected response structure');
  }

  return data.content[0].text;
}

/**
 * Call Anthropic API and parse response as JSON object.
 */
export async function callAnthropicForObject<T>(options: AnthropicRequestOptions): Promise<T> {
  const rawText = await makeRequest(options);
  console.log('AI Raw Response:', rawText);
  return extractJsonObject<T>(rawText);
}

/**
 * Call Anthropic API and parse response as JSON array.
 */
export async function callAnthropicForArray<T>(options: AnthropicRequestOptions): Promise<T[]> {
  const rawText = await makeRequest(options);
  console.log('AI Raw Response:', rawText);
  return extractJsonArray<T>(rawText);
}

/**
 * Call Anthropic API and parse response as JSON array, returning empty array on failure.
 */
export async function callAnthropicForArraySafe<T>(options: AnthropicRequestOptions): Promise<T[]> {
  try {
    return await callAnthropicForArray<T>(options);
  } catch (error) {
    console.error('API call failed, returning empty array:', error);
    return [];
  }
}

/**
 * Call Anthropic API with detailed debug info saved on failure.
 * Used for complex operations that need debugging capabilities.
 */
export async function callAnthropicWithDebug<T>(
  options: AnthropicRequestOptions,
  debugInfo: Record<string, unknown>
): Promise<T> {
  const apiKey = getApiKey();

  debugInfo.timestamp = new Date().toISOString();

  const response = await fetch(ANTHROPIC_CONFIG.API_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_CONFIG.API_VERSION,
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_CONFIG.MODEL,
      max_tokens: options.maxTokens,
      messages: [
        {
          role: 'user',
          content: options.messages,
        },
      ],
    }),
  });

  debugInfo.responseStatus = response.status;
  debugInfo.responseOk = response.ok;

  if (!response.ok) {
    const errorData = await response.json();
    debugInfo.errorData = errorData;
    localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));
    throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data: AnthropicResponse = await response.json();
  debugInfo.hasContent = !!data.content;
  debugInfo.contentLength = data.content?.length;

  if (!data.content || !data.content[0] || !data.content[0].text) {
    debugInfo.fullResponse = data;
    localStorage.setItem('aura_debug_info', JSON.stringify(debugInfo, null, 2));
    throw new Error('API returned unexpected response structure');
  }

  const rawText = data.content[0].text;
  debugInfo.rawTextLength = rawText.length;
  debugInfo.rawTextPreview = rawText.substring(0, 2000);

  return extractJsonObjectWithDebug<T>(rawText, debugInfo);
}

/**
 * Helper to create text content
 */
export function textContent(text: string): TextContent {
  return { type: 'text', text };
}

/**
 * Helper to create image content from a base64 data URL or raw base64 string
 */
export function imageContent(
  base64Data: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
): ImageContent {
  // Handle both raw base64 and data URL formats
  const data = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaType,
      data,
    },
  };
}
