// src/lib/inference/index.ts
// Barrel export for inference tracking module

// Types
export type {
  InferenceFeature,
  InferenceRecord,
  LogInferenceParams,
  UsageStats,
  FeatureUsage,
  UsagePeriod,
} from './types';

export { FEATURE_LABELS, FEATURE_VALUE_DESCRIPTIONS } from './types';

// Cost calculator
export {
  calculateCost,
  formatCost,
  formatTokens,
  ESTIMATED_COSTS_PER_FEATURE,
  FULL_PROFILE_ANALYSIS_COST,
} from './costCalculator';

// Feature mapper
export {
  inferFeatureFromOperation,
  getCurrentPage,
  getProfileIdFromPage,
} from './featureMapper';

// Logger
export {
  logInference,
  createLogParams,
  logFailedInference,
  getSessionRecords,
  getRecordsByPeriod,
  getRecentRecords,
  getUsageStats,
  getUsageByFeature,
  pruneOldRecords,
  getProfilesAnalyzedCount,
} from './logger';
