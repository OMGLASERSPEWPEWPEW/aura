// src/components/UserProfileDisplay.tsx
// Displays the user's synthesis results, mirroring ProfileDetail.tsx structure
import {
  Eye,
  Target,
  Zap,
  MessageCircle,
  Heart,
  Shield,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Briefcase,
  Sparkles
} from 'lucide-react';
import type { UserSynthesis } from '../lib/db';

interface UserProfileDisplayProps {
  synthesis: UserSynthesis;
  onRerunSynthesis?: () => void;
}

export default function UserProfileDisplay({ synthesis, onRerunSynthesis }: UserProfileDisplayProps) {
  const { basics, photos, psychological_profile: psych, dating_strategy, behavioral_insights } = synthesis;
  const subtext = psych?.subtext_analysis || {};

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{basics.name || 'Your Profile'}</h2>
            <div className="flex items-center gap-3 mt-1 text-indigo-100">
              {basics.age && <span>{basics.age} years old</span>}
              {basics.occupation && (
                <span className="flex items-center gap-1">
                  <Briefcase size={14} /> {basics.occupation}
                </span>
              )}
              {basics.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {basics.location}
                </span>
              )}
            </div>
          </div>
          {onRerunSynthesis && (
            <button
              onClick={onRerunSynthesis}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Re-analyze
            </button>
          )}
        </div>

        <div className="text-xs text-indigo-200">
          Last updated: {new Date(synthesis.meta.lastUpdated).toLocaleString()}
          <span className="mx-2">•</span>
          Inputs used: {synthesis.meta.inputsUsed.join(', ')}
        </div>
      </div>

      {/* Archetype Summary */}
      {psych?.archetype_summary && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Eye size={18} className="text-purple-600" /> Your Psychological Profile
          </h3>
          <div className="bg-purple-50 p-4 rounded-xl text-purple-900 border border-purple-100 text-sm leading-relaxed">
            {psych.archetype_summary}
          </div>
        </section>
      )}

      {/* Photo Analysis */}
      {photos && photos.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-3">Photo Analysis</h3>
          <div className="space-y-2">
            {photos.map((photo, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                <span className="text-xs font-bold text-slate-400 mt-0.5">{i + 1}</span>
                <div className="flex-1">
                  <span className="inline-block bg-pink-100 text-pink-800 text-xs font-bold px-2 py-0.5 rounded mr-2">
                    {photo.vibe}
                  </span>
                  <span className="text-sm text-slate-600">{photo.subtext}</span>
                  {photo.attractiveness_notes && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Tip: {photo.attractiveness_notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Agendas */}
      {psych?.agendas && psych.agendas.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Target size={18} className="text-blue-600" /> Your Agendas (What You Want)
          </h3>
          <div className="space-y-3">
            {psych.agendas.map((agenda, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border-l-4 ${
                  agenda.priority === 'primary'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-slate-50 border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold uppercase ${
                      agenda.priority === 'primary' ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {agenda.priority}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{agenda.type}</span>
                </div>
                <p className="text-sm text-slate-600">{agenda.evidence}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tactics */}
      {(psych?.presentation_tactics || psych?.predicted_tactics) && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Zap size={18} className="text-amber-600" /> Your Tactics (How You Operate)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {psych.presentation_tactics && psych.presentation_tactics.length > 0 && (
              <div className="bg-amber-50 p-3 rounded-lg">
                <h4 className="font-bold text-amber-800 text-sm mb-2">In Your Profile</h4>
                <div className="flex flex-wrap gap-1">
                  {psych.presentation_tactics.map((t, i) => (
                    <span key={i} className="bg-amber-200 text-amber-900 text-xs font-medium px-2 py-1 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {psych.predicted_tactics && psych.predicted_tactics.length > 0 && (
              <div className="bg-orange-50 p-3 rounded-lg">
                <h4 className="font-bold text-orange-800 text-sm mb-2">On Dates (Likely)</h4>
                <div className="flex flex-wrap gap-1">
                  {psych.predicted_tactics.map((t, i) => (
                    <span key={i} className="bg-orange-200 text-orange-900 text-xs font-medium px-2 py-1 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Deep Subtext Analysis */}
      {(subtext.sexual_signaling || subtext.power_dynamics || subtext.vulnerability_indicators || subtext.disconnect) && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <MessageCircle size={18} className="text-rose-600" /> Deep Subtext Analysis
          </h3>
          <div className="space-y-3">
            {subtext.sexual_signaling && (
              <div className="bg-rose-50 p-3 rounded-lg border-l-4 border-rose-400">
                <h4 className="font-bold text-rose-800 text-xs uppercase mb-1 flex items-center gap-1">
                  <Heart size={12} /> Sexual Signaling
                </h4>
                <p className="text-sm text-rose-900">{subtext.sexual_signaling}</p>
              </div>
            )}
            {subtext.power_dynamics && (
              <div className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400">
                <h4 className="font-bold text-indigo-800 text-xs uppercase mb-1 flex items-center gap-1">
                  <Zap size={12} /> Power Dynamics
                </h4>
                <p className="text-sm text-indigo-900">{subtext.power_dynamics}</p>
              </div>
            )}
            {subtext.vulnerability_indicators && (
              <div className="bg-teal-50 p-3 rounded-lg border-l-4 border-teal-400">
                <h4 className="font-bold text-teal-800 text-xs uppercase mb-1 flex items-center gap-1">
                  <Shield size={12} /> Vulnerability & Wounds
                </h4>
                <p className="text-sm text-teal-900">{subtext.vulnerability_indicators}</p>
              </div>
            )}
            {subtext.disconnect && (
              <div className="bg-slate-100 p-3 rounded-lg border-l-4 border-slate-400">
                <h4 className="font-bold text-slate-700 text-xs uppercase mb-1">Text vs. Subtext</h4>
                <p className="text-sm text-slate-700">{subtext.disconnect}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Dating Strategy */}
      {dating_strategy && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-pink-600" /> Dating Strategy
          </h3>

          {dating_strategy.ideal_partner_profile && (
            <div className="bg-pink-50 p-4 rounded-xl mb-4 border border-pink-100">
              <h4 className="font-bold text-pink-800 text-sm mb-2">Your Ideal Partner</h4>
              <p className="text-sm text-pink-900">{dating_strategy.ideal_partner_profile}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dating_strategy.what_to_look_for && dating_strategy.what_to_look_for.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-bold text-green-800 text-sm mb-2">Green Flags to Seek</h4>
                <ul className="text-xs text-green-700 list-disc list-inside space-y-1">
                  {dating_strategy.what_to_look_for.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {dating_strategy.what_to_avoid && dating_strategy.what_to_avoid.length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <h4 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Red Flags to Avoid
                </h4>
                <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                  {dating_strategy.what_to_avoid.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {dating_strategy.bio_suggestions && dating_strategy.bio_suggestions.length > 0 && (
            <div className="bg-white p-4 rounded-xl mt-4 border border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1">
                <Lightbulb size={14} className="text-yellow-500" /> Bio Improvement Suggestions
              </h4>
              <ul className="text-sm text-slate-700 space-y-2">
                {dating_strategy.bio_suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-500 font-bold">{i + 1}.</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dating_strategy.opener_style_recommendations && dating_strategy.opener_style_recommendations.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-xl mt-4 border border-blue-100">
              <h4 className="font-bold text-blue-800 text-sm mb-2">How to Open Conversations</h4>
              <ul className="text-sm text-blue-900 space-y-1">
                {dating_strategy.opener_style_recommendations.map((rec, i) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Behavioral Insights */}
      {behavioral_insights && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-600" /> Behavioral Insights
          </h3>

          <div className="space-y-4">
            {behavioral_insights.communication_style && (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-700 text-sm mb-1">Communication Style</h4>
                <p className="text-sm text-slate-600">{behavioral_insights.communication_style}</p>
              </div>
            )}

            {behavioral_insights.attachment_patterns && (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-700 text-sm mb-1">Attachment Patterns</h4>
                <p className="text-sm text-slate-600">{behavioral_insights.attachment_patterns}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {behavioral_insights.strengths && behavioral_insights.strengths.length > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-bold text-green-800 text-sm mb-2">Your Strengths</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    {behavioral_insights.strengths.map((s, i) => (
                      <li key={i}>✓ {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {behavioral_insights.growth_areas && behavioral_insights.growth_areas.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-bold text-yellow-800 text-sm mb-2">Growth Areas</h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {behavioral_insights.growth_areas.map((g, i) => (
                      <li key={i}>→ {g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
