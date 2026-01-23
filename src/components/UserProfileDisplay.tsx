// src/components/UserProfileDisplay.tsx
// Displays the user's synthesis results, mirroring ProfileDetail.tsx structure
import { useState } from 'react';
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
  Sparkles,
  Landmark,
  HelpCircle,
  X,
  Brain,
  Info
} from 'lucide-react';
import type { UserSynthesis, PhotoEntry } from '../lib/db';
import AspectConstellationCard from './profile/AspectConstellationCard';

interface UserProfileDisplayProps {
  synthesis: UserSynthesis;
  photos?: PhotoEntry[];
  onRerunSynthesis?: () => void;
}

export default function UserProfileDisplay({ synthesis, photos: userPhotos, onRerunSynthesis }: UserProfileDisplayProps) {
  const { basics, photos: photoAnalysis, psychological_profile: psych, dating_strategy, behavioral_insights, partner_virtues, neurodivergence, aspect_profile } = synthesis;
  const subtext = psych?.subtext_analysis || {};
  const [showVirtueHelp, setShowVirtueHelp] = useState(false);
  const [showNdHelp, setShowNdHelp] = useState(false);
  const [expandedTrait, setExpandedTrait] = useState<number | null>(null);

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
      {photoAnalysis && photoAnalysis.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-3">Photo Analysis</h3>
          <div className="space-y-4">
            {photoAnalysis.map((analysis, i) => (
              <div key={i} className="flex gap-4 bg-slate-50 p-3 rounded-lg">
                {/* Actual photo thumbnail */}
                {userPhotos && userPhotos[i] && (
                  <img
                    src={userPhotos[i].base64}
                    alt={`Photo ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                {/* Analysis text */}
                <div className="flex-1">
                  <span className="inline-block bg-pink-100 text-pink-800 text-xs font-bold px-2 py-0.5 rounded mr-2">
                    {analysis.vibe}
                  </span>
                  <span className="text-sm text-slate-600">{analysis.subtext}</span>
                  {analysis.attractiveness_notes && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Tip: {analysis.attractiveness_notes}
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

      {/* Partner Virtues (Eudaimonia) */}
      {partner_virtues && partner_virtues.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Landmark size={18} className="text-amber-600" /> Your Partner Virtues
            </h3>
            <button
              onClick={() => setShowVirtueHelp(!showVirtueHelp)}
              className="p-1.5 rounded-full hover:bg-amber-100 transition-colors"
              aria-label="What are virtues?"
            >
              <HelpCircle size={18} className="text-amber-600" />
            </button>
          </div>

          {/* Help Modal */}
          {showVirtueHelp && (
            <div className="mb-4 bg-amber-50 p-4 rounded-lg border border-amber-300 relative">
              <button
                onClick={() => setShowVirtueHelp(false)}
                className="absolute top-2 right-2 p-1 hover:bg-amber-200 rounded-full"
              >
                <X size={14} className="text-amber-600" />
              </button>
              <h4 className="font-bold text-amber-900 text-sm mb-2">What are Partner Virtues?</h4>
              <p className="text-sm text-amber-800 mb-2">
                Inspired by Greek philosophy and the concept of <strong>eudaimonia</strong> (human flourishing),
                these are the 5 core character virtues that would lead to a genuinely fulfilling relationship for you.
              </p>
              <p className="text-sm text-amber-800 mb-2">
                Unlike superficial traits, these virtues are derived from your psychological profile, attachment patterns,
                and what you actually need in a partner to thrive.
              </p>
              <p className="text-sm text-amber-800 mb-2">
                <strong>How it works:</strong> When you analyze a match, we score how well they embody each of these virtues
                based on evidence from their profile.
              </p>
              <p className="text-xs text-amber-600 italic">
                Each virtue includes an "anti-virtue" - a red flag to watch for that represents the opposite trait.
              </p>
            </div>
          )}

          <p className="text-sm text-slate-600 mb-4">
            Based on your psychology, these are the 5 character virtues that would lead to genuine flourishing in a relationship for you.
          </p>
          <div className="space-y-4">
            {partner_virtues.map((virtue, i) => (
              <div key={i} className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 text-base mb-1">{virtue.name}</h4>
                    <p className="text-sm text-amber-800 mb-2">{virtue.description}</p>
                    <div className="bg-white/60 rounded-lg p-2 space-y-1">
                      <p className="text-xs text-amber-700">
                        <span className="font-semibold">Evidence:</span> {virtue.evidence}
                      </p>
                      <p className="text-xs text-red-600">
                        <span className="font-semibold">Red flag:</span> {virtue.anti_virtue}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 23 Aspects Profile */}
      {aspect_profile && aspect_profile.scores && aspect_profile.scores.length > 0 && (
        <AspectConstellationCard aspectProfile={aspect_profile} />
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

      {/* Neurodivergence Insights */}
      {neurodivergence && neurodivergence.traits && neurodivergence.traits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Brain size={18} className="text-indigo-600" /> Neurodivergence Insights
            </h3>
            <button
              onClick={() => setShowNdHelp(!showNdHelp)}
              className="p-1.5 rounded-full hover:bg-indigo-100 transition-colors"
              aria-label="What is this?"
            >
              <HelpCircle size={18} className="text-indigo-600" />
            </button>
          </div>

          {/* Help Modal */}
          {showNdHelp && (
            <div className="mb-4 bg-indigo-50 p-4 rounded-lg border border-indigo-300 relative">
              <button
                onClick={() => setShowNdHelp(false)}
                className="absolute top-2 right-2 p-1 hover:bg-indigo-200 rounded-full"
              >
                <X size={14} className="text-indigo-600" />
              </button>
              <h4 className="font-bold text-indigo-900 text-sm mb-2">About Neurodivergence Insights</h4>
              <p className="text-sm text-indigo-800 mb-2">
                This analysis identifies traits that may align with various neurodevelopmental patterns based on your profile data.
                Neurodivergence includes conditions like ADHD, Autism Spectrum, Sensory Processing Sensitivity (HSP), and others.
              </p>
              <p className="text-sm text-indigo-800 mb-2">
                <strong>Why it matters for dating:</strong> Understanding your neurotype can help you communicate your needs,
                find compatible partners, and navigate relationships more authentically.
              </p>
              <div className="bg-amber-50 p-2 rounded border border-amber-200 mt-3">
                <p className="text-xs text-amber-800 flex items-start gap-1">
                  <Info size={12} className="mt-0.5 flex-shrink-0" />
                  <span><strong>Important:</strong> This is NOT a clinical diagnosis. Only a licensed professional can diagnose neurodevelopmental conditions.
                  If these insights resonate, consider seeking a professional evaluation.</span>
                </p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-indigo-50 p-4 rounded-xl mb-4 border border-indigo-100">
            <p className="text-sm text-indigo-900">{neurodivergence.summary}</p>
          </div>

          {/* Traits */}
          <div className="space-y-3">
            {neurodivergence.traits.map((trait, i) => {
              const isExpanded = expandedTrait === i;
              const likelihoodColors = {
                low: 'bg-slate-100 text-slate-700',
                moderate: 'bg-blue-100 text-blue-700',
                notable: 'bg-purple-100 text-purple-700',
                significant: 'bg-indigo-100 text-indigo-700'
              };

              return (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-indigo-100 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedTrait(isExpanded ? null : i)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-indigo-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{
                        trait.condition.toLowerCase().includes('adhd') ? '⚡' :
                        trait.condition.toLowerCase().includes('autism') ? '🧩' :
                        trait.condition.toLowerCase().includes('sensory') || trait.condition.toLowerCase().includes('hsp') ? '🌊' :
                        trait.condition.toLowerCase().includes('anxiety') ? '💭' :
                        trait.condition.toLowerCase().includes('gifted') ? '✨' :
                        '🧠'
                      }</span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{trait.condition}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${likelihoodColors[trait.likelihood]}`}>
                            {trait.likelihood}
                          </span>
                          <span className="text-xs text-slate-500">
                            Confidence: {trait.confidence}/10
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-indigo-400">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-indigo-100 pt-3">
                      {/* Indicators */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-600 uppercase mb-1">What we noticed</h5>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {trait.indicators.map((ind, j) => (
                            <li key={j} className="flex items-start gap-2">
                              <span className="text-indigo-400 mt-1">•</span>
                              {ind}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Dating Implications */}
                      <div className="bg-rose-50 p-3 rounded-lg">
                        <h5 className="text-xs font-bold text-rose-700 uppercase mb-1">In Relationships</h5>
                        <p className="text-sm text-rose-800">{trait.dating_implications}</p>
                      </div>

                      {/* Strengths */}
                      <div className="bg-emerald-50 p-3 rounded-lg">
                        <h5 className="text-xs font-bold text-emerald-700 uppercase mb-1">Your Strengths</h5>
                        <ul className="text-sm text-emerald-800 space-y-1">
                          {trait.strengths.map((s, j) => (
                            <li key={j}>✓ {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Communication Tips */}
          {neurodivergence.communication_tips && neurodivergence.communication_tips.length > 0 && (
            <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="font-bold text-blue-800 text-sm mb-2">Communication Tips for Partners</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {neurodivergence.communication_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Self-Awareness Notes */}
          {neurodivergence.self_awareness_notes && (
            <div className="mt-4 bg-violet-50 p-4 rounded-xl border border-violet-100">
              <h4 className="font-bold text-violet-800 text-sm mb-2">Self-Awareness Insights</h4>
              <p className="text-sm text-violet-700">{neurodivergence.self_awareness_notes}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-4 bg-slate-100 p-3 rounded-lg">
            <p className="text-xs text-slate-600 italic">{neurodivergence.disclaimer}</p>
          </div>
        </section>
      )}
    </div>
  );
}
