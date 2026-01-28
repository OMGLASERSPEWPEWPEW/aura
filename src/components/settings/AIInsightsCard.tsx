// src/components/settings/AIInsightsCard.tsx
// AI Usage/Insights card for Settings page
// Follows UX guidelines: empowering language, value pairing, progressive disclosure

import { useState, useEffect } from 'react';
import { Activity, ChevronDown, Sparkles, TrendingUp, AlertCircle, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getUsageStats,
  getUsageByFeature,
  getRecentRecords,
  getProfilesAnalyzedCount,
  formatCost,
  formatTokens,
  FEATURE_LABELS,
  FEATURE_VALUE_DESCRIPTIONS,
  type InferenceRecord,
  type InferenceFeature,
} from '../../lib/inference';

type Period = 'month' | 'all';

interface UsageData {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
}

interface FeatureData {
  feature: InferenceFeature;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  callCount: number;
  percentage: number;
}

export default function AIInsightsCard() {
  const [period, setPeriod] = useState<Period>('month');
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [monthStats, setMonthStats] = useState<UsageData | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<UsageData | null>(null);
  const [featureBreakdown, setFeatureBreakdown] = useState<FeatureData[]>([]);
  const [recentRecords, setRecentRecords] = useState<InferenceRecord[]>([]);
  const [profilesAnalyzed, setProfilesAnalyzed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [month, all, features, recent, profiles] = await Promise.all([
        getUsageStats('month'),
        getUsageStats('all'),
        getUsageByFeature(period),
        getRecentRecords(10),
        getProfilesAnalyzedCount(period),
      ]);

      setMonthStats(month);
      setAllTimeStats(all);
      setFeatureBreakdown(features);
      setRecentRecords(recent);
      setProfilesAnalyzed(profiles);
    } catch (error) {
      console.error('Failed to load inference stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = period === 'month' ? monthStats : allTimeStats;
  const isEmpty = !stats || stats.totalCalls === 0;

  // Calculate value metrics (estimated insights generated)
  const compatibilityScores = featureBreakdown
    .filter(f => f.feature === 'compatibility_scoring')
    .reduce((sum, f) => sum + f.callCount, 0);
  const openerSuggestions = featureBreakdown
    .filter(f => f.feature === 'opener_suggestions')
    .reduce((sum, f) => sum + f.callCount * 5, 0); // ~5 openers per call
  const dateIdeas = featureBreakdown
    .filter(f => f.feature === 'date_ideas')
    .reduce((sum, f) => sum + f.callCount * 3, 0); // ~3 ideas per call

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-blue-500" />
        <h3 className="font-semibold text-slate-900 dark:text-slate-50">AI Insights</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 dark:border-slate-600 border-t-blue-500" />
        </div>
      ) : isEmpty ? (
        // Empty state
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="text-indigo-500 dark:text-indigo-400" size={24} />
          </div>
          <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-1">No insights generated yet</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Upload your first profile to see AI analysis stats
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            <Upload size={16} />
            Upload Profile
          </Link>
        </div>
      ) : (
        <>
          {/* Period Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                period === 'month'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                period === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Level 1: Summary (Always Visible) */}
          <div className="space-y-3">
            {/* Main Stats */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-blue-900/30 rounded-lg border border-slate-100 dark:border-slate-600">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">{profilesAnalyzed}</span>
                <span className="text-sm text-slate-600 dark:text-slate-300">profiles analyzed</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatCost(stats?.totalCostUsd || 0)} invested
              </p>
            </div>

            {/* Value Delivered */}
            {(compatibilityScores > 0 || openerSuggestions > 0 || dateIdeas > 0) && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Value Delivered</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {compatibilityScores > 0 && (
                    <div>
                      <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">{compatibilityScores}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Compatibility scores</p>
                    </div>
                  )}
                  {openerSuggestions > 0 && (
                    <div>
                      <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">{openerSuggestions}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Opener ideas</p>
                    </div>
                  )}
                  {dateIdeas > 0 && (
                    <div>
                      <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">{dateIdeas}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Date suggestions</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Expand Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 mt-4 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors min-h-[44px]"
          >
            <span>View breakdown</span>
            <ChevronDown
              size={16}
              className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Level 2: Feature Breakdown (Expandable) */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Insights by Feature</h4>

              {featureBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No breakdown data yet</p>
              ) : (
                <div className="space-y-3">
                  {featureBreakdown.slice(0, 5).map((item) => (
                    <div key={item.feature} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {FEATURE_LABELS[item.feature] || item.feature}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {item.callCount} {item.callCount === 1 ? 'call' : 'calls'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 w-14 text-right">
                          {formatCost(item.costUsd, false)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Show Activity Log Button */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors min-h-[44px] border border-slate-100 dark:border-slate-600"
              >
                <span>View activity log</span>
                <ChevronDown
                  size={16}
                  className={`transform transition-transform ${showHistory ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Level 3: Activity Log (Debug View) */}
              {showHistory && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recent Activity</h4>

                  {recentRecords.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentRecords.map((record) => (
                        <div
                          key={record.id}
                          className={`p-3 rounded-lg border ${
                            record.success
                              ? 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600'
                              : 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {record.success ? (
                                <span className="text-emerald-500">✓</span>
                              ) : (
                                <AlertCircle size={14} className="text-red-500" />
                              )}
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                                {FEATURE_LABELS[record.feature] || record.feature}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {formatRelativeTime(record.timestamp)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-5">
                            {FEATURE_VALUE_DESCRIPTIONS[record.feature] || 'AI analysis completed'}
                          </p>

                          <div className="flex items-center gap-3 mt-2 ml-5 text-[10px] text-slate-400 font-mono">
                            <span>{formatCost(record.estimatedCostUsd)}</span>
                            <span>
                              {formatTokens(record.inputTokens)} in / {formatTokens(record.outputTokens)} out
                            </span>
                          </div>

                          {!record.success && record.errorType && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-5">
                              Error: {record.errorType}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Privacy Notice */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-medium">Privacy:</span> Only metadata is tracked (timestamps, token counts, feature names).
              No personal information from profiles or messages is stored.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Format a timestamp as relative time (e.g., "2 mins ago")
 */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return new Date(date).toLocaleDateString();
}
