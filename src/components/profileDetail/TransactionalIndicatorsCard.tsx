// src/components/profileDetail/TransactionalIndicatorsCard.tsx
import { useState } from 'react';
import { AlertTriangle, HelpCircle, X, CheckCircle, Info } from 'lucide-react';
import type { TransactionalIndicators } from '../../lib/db';

interface TransactionalIndicatorsCardProps {
  indicators: TransactionalIndicators;
}

/**
 * Displays transactional/financial motivation indicators for a match profile.
 * Only renders when likelihood is moderate or higher.
 */
export function TransactionalIndicatorsCard({ indicators }: TransactionalIndicatorsCardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if likelihood is none or low
  if (indicators.likelihood === 'none' || indicators.likelihood === 'low') {
    return null;
  }

  const getLikelihoodConfig = () => {
    switch (indicators.likelihood) {
      case 'moderate':
        return {
          bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
          border: 'border-amber-300',
          icon: <Info size={18} className="text-amber-600" />,
          badge: 'bg-amber-200 text-amber-800',
          badgeText: 'Worth Noting',
          accent: 'text-amber-600',
          accentBg: 'bg-amber-100',
        };
      case 'high':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-orange-50',
          border: 'border-red-300',
          icon: <AlertTriangle size={18} className="text-red-600" />,
          badge: 'bg-red-200 text-red-800',
          badgeText: 'High Likelihood',
          accent: 'text-red-600',
          accentBg: 'bg-red-100',
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          icon: <CheckCircle size={18} className="text-slate-600" />,
          badge: 'bg-slate-200 text-slate-800',
          badgeText: 'No Signals',
          accent: 'text-slate-600',
          accentBg: 'bg-slate-100',
        };
    }
  };

  const config = getLikelihoodConfig();

  return (
    <section className={`${config.bg} p-5 rounded-xl border ${config.border}`}>
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          {config.icon} Financial Motivation Radar
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-1.5 rounded-full hover:${config.accentBg} transition-colors`}
            aria-label="What is this?"
          >
            <HelpCircle size={16} className={config.accent} />
          </button>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.badge}`}>
            {config.badgeText}
          </span>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="mb-4 bg-white p-4 rounded-lg border border-slate-300 relative">
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded-full"
          >
            <X size={14} className="text-slate-600" />
          </button>
          <h4 className="font-bold text-slate-900 text-sm mb-2">About This Feature</h4>
          <p className="text-sm text-slate-700 mb-2">
            This analyzes profile patterns that may indicate someone is seeking a transactional
            or financially-motivated relationship (sometimes called "sugar" arrangements).
          </p>
          <p className="text-sm text-slate-700 mb-2">
            <strong>This is not a judgment.</strong> Sugar relationships can be ethical and consensual
            when both parties are transparent about expectations.
          </p>
          <p className="text-sm text-slate-700">
            The goal is simply <strong>awareness</strong> so you can make informed decisions
            about what type of relationship you're pursuing.
          </p>
        </div>
      )}

      {/* Confidence indicator */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-slate-600">Confidence:</span>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < indicators.confidence ? config.accent.replace('text-', 'bg-') : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-500">{indicators.confidence}/10</span>
      </div>

      {/* Context */}
      <p className="text-sm text-slate-700 mb-3">
        {indicators.context}
      </p>

      {/* Expandable signals */}
      {indicators.signals.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-sm font-medium ${config.accent} hover:underline`}
          >
            {isExpanded ? 'Hide signals' : `View ${indicators.signals.length} signals detected`}
          </button>

          {isExpanded && (
            <ul className="mt-2 space-y-1">
              {indicators.signals.map((signal, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className={config.accent}>•</span>
                  {signal}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Ethical note */}
      <div className={`${config.accentBg} p-3 rounded-lg`}>
        <p className="text-xs text-slate-600 italic flex items-start gap-2">
          <CheckCircle size={14} className="flex-shrink-0 mt-0.5 text-slate-500" />
          {indicators.ethical_note}
        </p>
      </div>
    </section>
  );
}
