// src/lib/inference/logger.ts
// Non-blocking inference logging to IndexedDB

import { db } from '../db';
import { calculateCost } from './costCalculator';
import { inferFeatureFromOperation, getCurrentPage, getProfileIdFromPage } from './featureMapper';
import type { InferenceRecord, LogInferenceParams, InferenceFeature } from './types';
import { getAccessToken } from '../supabase';

/**
 * Log an inference to IndexedDB.
 * This function is NON-BLOCKING - it does not await the database write.
 * Errors are caught and logged but do not propagate.
 *
 * @param params - The inference parameters to log
 */
export function logInference(params: LogInferenceParams): void {
  // Fire and forget - don't block the API response
  logInferenceAsync(params).catch(error => {
    // Non-blocking: if logging fails, just log to console
    console.warn('[InferenceTracker] Failed to log inference:', error);
  });
}

/**
 * Internal async implementation of inference logging.
 */
async function logInferenceAsync(params: LogInferenceParams): Promise<void> {
  const cost = calculateCost(params.inputTokens, params.outputTokens, params.model);

  // Get current user ID if logged in (non-blocking)
  const userId = await getUserIdIfLoggedIn();

  const record: Omit<InferenceRecord, 'id'> = {
    timestamp: new Date(),
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    estimatedCostUsd: cost,
    model: params.model,
    feature: params.feature,
    page: params.page,
    userId,
    profileId: params.profileId,
    success: params.success,
    errorType: params.errorType,
  };

  await db.inferenceHistory.add(record);

  // Debug logging (remove in production)
  console.log('[InferenceTracker] Logged:', {
    feature: params.feature,
    tokens: `${params.inputTokens} in / ${params.outputTokens} out`,
    cost: `$${cost.toFixed(4)}`,
    success: params.success,
  });
}

/**
 * Create inference logging parameters from API response.
 * Call this from the API client after receiving a response.
 *
 * @param inputTokens - Tokens sent to API
 * @param outputTokens - Tokens received from API
 * @param model - Model used
 * @param operationName - Operation name for feature mapping
 * @param success - Whether the call succeeded
 * @param errorType - Error type if failed
 * @param profileId - Optional profile ID for context
 */
export function createLogParams(
  inputTokens: number,
  outputTokens: number,
  model: string,
  operationName?: string,
  success = true,
  errorType?: string,
  profileId?: number
): LogInferenceParams {
  return {
    inputTokens,
    outputTokens,
    model,
    feature: inferFeatureFromOperation(operationName),
    page: getCurrentPage(),
    success,
    errorType,
    profileId: profileId ?? getProfileIdFromPage(),
  };
}

/**
 * Log a failed inference (for error tracking).
 *
 * @param operationName - Operation that failed
 * @param model - Model used
 * @param errorType - Type of error
 * @param profileId - Optional profile ID
 */
export function logFailedInference(
  operationName: string,
  model: string,
  errorType: string,
  profileId?: number
): void {
  logInference({
    inputTokens: 0,
    outputTokens: 0,
    model,
    feature: inferFeatureFromOperation(operationName),
    page: getCurrentPage(),
    success: false,
    errorType,
    profileId,
  });
}

/**
 * Get user ID from JWT token if logged in.
 * Non-blocking, returns undefined if not logged in.
 */
async function getUserIdIfLoggedIn(): Promise<string | undefined> {
  try {
    const token = await getAccessToken();
    if (!token) return undefined;

    // Decode JWT to extract user ID (simple parse, no verification needed for local logging)
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;

    const payload = JSON.parse(atob(parts[1]));
    return payload.sub; // Supabase user UUID
  } catch {
    // Token parsing failed - user not logged in or token malformed
    return undefined;
  }
}

// ============================================
// Query functions for usage dashboard
// ============================================

/**
 * Get all inference records for the current session.
 * A "session" is defined as records from the last browser session start.
 */
export async function getSessionRecords(): Promise<InferenceRecord[]> {
  // For now, treat "session" as last 24 hours
  // In future, could use sessionStorage to track actual session start
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return db.inferenceHistory
    .where('timestamp')
    .above(oneDayAgo)
    .reverse()
    .toArray();
}

/**
 * Get inference records for a specific time period.
 *
 * @param period - Time period to query
 * @returns Array of inference records
 */
export async function getRecordsByPeriod(
  period: 'today' | 'week' | 'month' | 'all'
): Promise<InferenceRecord[]> {
  const now = Date.now();

  let startDate: Date;
  switch (period) {
    case 'today':
      startDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      return db.inferenceHistory.reverse().toArray();
  }

  return db.inferenceHistory
    .where('timestamp')
    .above(startDate)
    .reverse()
    .toArray();
}

/**
 * Get the most recent N inference records.
 *
 * @param limit - Maximum number of records to return
 * @returns Array of inference records
 */
export async function getRecentRecords(limit = 20): Promise<InferenceRecord[]> {
  return db.inferenceHistory
    .orderBy('timestamp')
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Get total usage stats for a time period.
 *
 * @param period - Time period to query
 * @returns Aggregated usage statistics
 */
export async function getUsageStats(
  period: 'today' | 'week' | 'month' | 'all'
): Promise<{
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
}> {
  const records = await getRecordsByPeriod(period);

  return records.reduce(
    (acc, record) => ({
      totalInputTokens: acc.totalInputTokens + record.inputTokens,
      totalOutputTokens: acc.totalOutputTokens + record.outputTokens,
      totalCostUsd: acc.totalCostUsd + record.estimatedCostUsd,
      totalCalls: acc.totalCalls + 1,
      successfulCalls: acc.successfulCalls + (record.success ? 1 : 0),
      failedCalls: acc.failedCalls + (record.success ? 0 : 1),
    }),
    {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
    }
  );
}

/**
 * Get usage breakdown by feature.
 *
 * @param period - Time period to query
 * @returns Array of feature usage stats, sorted by cost descending
 */
export async function getUsageByFeature(
  period: 'today' | 'week' | 'month' | 'all'
): Promise<Array<{
  feature: InferenceFeature;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  callCount: number;
  percentage: number;
}>> {
  const records = await getRecordsByPeriod(period);

  // Aggregate by feature
  const byFeature = new Map<InferenceFeature, {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    callCount: number;
  }>();

  let totalCost = 0;

  for (const record of records) {
    totalCost += record.estimatedCostUsd;

    const existing = byFeature.get(record.feature);
    if (existing) {
      existing.inputTokens += record.inputTokens;
      existing.outputTokens += record.outputTokens;
      existing.costUsd += record.estimatedCostUsd;
      existing.callCount += 1;
    } else {
      byFeature.set(record.feature, {
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        costUsd: record.estimatedCostUsd,
        callCount: 1,
      });
    }
  }

  // Convert to array with percentages
  const result = Array.from(byFeature.entries()).map(([feature, stats]) => ({
    feature,
    ...stats,
    percentage: totalCost > 0 ? (stats.costUsd / totalCost) * 100 : 0,
  }));

  // Sort by cost descending
  result.sort((a, b) => b.costUsd - a.costUsd);

  return result;
}

/**
 * Delete records older than the specified number of days.
 * Used for auto-pruning to prevent unbounded IndexedDB growth.
 *
 * @param daysOld - Delete records older than this many days
 * @returns Number of records deleted
 */
export async function pruneOldRecords(daysOld = 90): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  const oldRecords = await db.inferenceHistory
    .where('timestamp')
    .below(cutoffDate)
    .primaryKeys();

  await db.inferenceHistory.bulkDelete(oldRecords);

  console.log(`[InferenceTracker] Pruned ${oldRecords.length} records older than ${daysOld} days`);
  return oldRecords.length;
}

/**
 * Get the count of profiles analyzed (unique profile IDs).
 *
 * @param period - Time period to query
 * @returns Number of unique profiles analyzed
 */
export async function getProfilesAnalyzedCount(
  period: 'today' | 'week' | 'month' | 'all'
): Promise<number> {
  const records = await getRecordsByPeriod(period);

  // Count unique profile IDs from profile analysis features
  const profileIds = new Set<number>();

  for (const record of records) {
    if (
      record.profileId &&
      record.feature.startsWith('profile_analysis_')
    ) {
      profileIds.add(record.profileId);
    }
  }

  return profileIds.size;
}
