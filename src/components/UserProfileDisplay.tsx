// src/components/UserProfileDisplay.tsx
// Displays the user's synthesis results with expandable insights and feedback
import { useState, useCallback } from 'react';
import {
  Eye,
  Target,
  Zap,
  MessageCircle,
  Heart,
  Shield,
  Lightbulb,
  TrendingUp,
  MapPin,
  Briefcase,
  Sparkles,
  Landmark,
  HelpCircle,
  X,
  Brain,
  Info,
  CheckCircle,
  Rocket,
  Home,
} from 'lucide-react';
import type { UserSynthesis, PhotoEntry } from '../lib/db';
import { db } from '../lib/db';
import ExpandableInsight, { type FeedbackRating, createInsightFeedback } from './ui/ExpandableInsight';

type LivingSituation = 'solo' | 'roommates' | 'caregiving';

interface UserProfileDisplayProps {
  synthesis: UserSynthesis;
  photos?: PhotoEntry[];
  videoFrames?: string[];
  onRerunSynthesis?: () => void;
  livingSituation?: LivingSituation;
  onLivingSituationChange?: (value: LivingSituation) => void;
}

// Helper function to get confidence badge label and color
function getConfidenceBadge(confidence: number): { label: string; colorClass: string } | null {
  if (confidence < 40) return null; // Don't show if < 40%
  if (confidence < 60) return { label: 'Tentative', colorClass: 'bg-amber-100 text-amber-700' };
  if (confidence < 80) return { label: 'Likely', colorClass: 'bg-blue-100 text-blue-700' };
  return { label: 'Strong signal', colorClass: 'bg-green-100 text-green-700' };
}

// Helper to truncate text to ~150 words with ellipsis
function truncateToWords(text: string, wordCount: number): string {
  const words = text.split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(' ') + '...';
}

export default function UserProfileDisplay({ synthesis, photos: userPhotos, videoFrames, onRerunSynthesis, livingSituation, onLivingSituationChange }: UserProfileDisplayProps) {
  const { basics, photos: photoAnalysis, psychological_profile: psych, dating_strategy, behavioral_insights, partner_virtues, neurodivergence } = synthesis;
  const subtext = psych?.subtext_analysis || {};
  const [showNdHelp, setShowNdHelp] = useState(false);
  const [expandedTrait, setExpandedTrait] = useState<number | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackRating>>({});

  // Get attachment confidence - default to 60 if not specified (show as "Likely")
  const attachmentConfidence = behavioral_insights?.attachment_confidence ?? 60;
  const attachmentBadge = getConfidenceBadge(attachmentConfidence);
  const showAttachmentInsight = attachmentConfidence >= 40;

  // Handle feedback submission
  const handleFeedback = useCallback(async (insightKey: string, rating: FeedbackRating) => {
    setFeedbackMap(prev => ({ ...prev, [insightKey]: rating }));

    // Save to IndexedDB
    try {
      const identity = await db.userIdentity.get(1);
      if (identity) {
        const existingFeedback = identity.insightFeedback || [];
        // Remove old feedback for this key
        const filtered = existingFeedback.filter(f => f.insightKey !== insightKey);
        // Add new feedback
        const newFeedback = createInsightFeedback(insightKey, rating);
        await db.userIdentity.update(1, {
          insightFeedback: [...filtered, newFeedback],
          lastUpdated: new Date()
        });
        console.log(`Feedback saved: ${insightKey} = ${rating}`);
      }
    } catch (error) {
      // Non-critical: feedback not saved but UI continues working
      console.log('UserProfileDisplay: Feedback save failed:', error instanceof Error ? error.message : String(error));
    }
  }, []);

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

        {/* Living Situation */}
        {onLivingSituationChange && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <label className="text-xs text-indigo-200 uppercase tracking-wide flex items-center gap-1 mb-2">
              <Home size={12} />
              Living Situation
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['solo', 'roommates', 'caregiving'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => onLivingSituationChange(option)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    livingSituation === option
                      ? 'bg-white text-indigo-700'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {option === 'solo' && 'Living Solo'}
                  {option === 'roommates' && 'Roommates'}
                  {option === 'caregiving' && 'Caregiving'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-indigo-200 mt-4">
          Last updated: {new Date(synthesis.meta.lastUpdated).toLocaleString()}
          <span className="mx-2">•</span>
          Inputs used: {synthesis.meta.inputsUsed.join(', ')}
        </div>
      </div>

      {/* Archetype Summary - Using ExpandableInsight */}
      {psych?.archetype_summary && (() => {
        const fullText = psych.archetype_summary;
        const truncated = truncateToWords(fullText, 150);
        const needsExpand = truncated !== fullText;
        return (
          <ExpandableInsight
            insightKey="archetype"
            icon={<Eye size={18} className="text-purple-600" />}
            title="Your Psychological Profile"
            summary={truncated}
            detail={needsExpand ? fullText : undefined}
            helpText="This is a synthesis of your dating profile, communication patterns, and presentation style. It identifies the core of who you are romantically."
            currentFeedback={feedbackMap['archetype']}
            onFeedback={handleFeedback}
            className="bg-purple-50 border border-purple-100"
          />
        );
      })()}

      {/* Photo Analysis */}
      {photoAnalysis && photoAnalysis.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-3">Photo Analysis</h3>
          <div className="space-y-4">
            {photoAnalysis.map((analysis, i) => {
              // Use video frames for thumbnails: frames 0, 4, 8, 12 (first frame of each chunk)
              // Fallback to userPhotos for legacy data
              const frameIndex = i * 4; // Chunk boundary frames
              const thumbnailSrc = videoFrames?.[frameIndex] || userPhotos?.[i]?.base64;

              return (
                <div key={i} className="flex gap-4 bg-slate-50 p-3 rounded-lg">
                  {/* Frame thumbnail */}
                  {thumbnailSrc && (
                    <img
                      src={thumbnailSrc}
                      alt={`Frame ${frameIndex + 1}`}
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
              );
            })}
          </div>
        </section>
      )}

      {/* Agendas */}
      {psych?.agendas && psych.agendas.length > 0 && (
        <ExpandableInsight
          insightKey="agendas"
          icon={<Target size={18} className="text-blue-600" />}
          title="Your Agendas (What You Want)"
          summary={`${psych.agendas.filter(a => a.priority === 'primary').length} primary and ${psych.agendas.filter(a => a.priority === 'secondary').length} secondary agendas identified`}
          helpText="Agendas are your underlying motivations in dating - what you're really looking for, even if you haven't fully articulated it yet."
          currentFeedback={feedbackMap['agendas']}
          onFeedback={handleFeedback}
          className="bg-blue-50/50 border border-blue-100"
        >
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
        </ExpandableInsight>
      )}

      {/* Tactics */}
      {(psych?.presentation_tactics || psych?.predicted_tactics) && (
        <ExpandableInsight
          insightKey="tactics"
          icon={<Zap size={18} className="text-amber-600" />}
          title="Your Tactics (How You Operate)"
          summary={`${(psych?.presentation_tactics?.length ?? 0) + (psych?.predicted_tactics?.length ?? 0)} behavioral patterns identified`}
          helpText="Tactics are the conscious and unconscious strategies you use to attract partners and navigate dating interactions."
          currentFeedback={feedbackMap['tactics']}
          onFeedback={handleFeedback}
          className="bg-amber-50/50 border border-amber-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {psych?.presentation_tactics && psych.presentation_tactics.length > 0 && (
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
            {psych?.predicted_tactics && psych.predicted_tactics.length > 0 && (
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
        </ExpandableInsight>
      )}

      {/* Deep Subtext Analysis */}
      {(subtext.sexual_signaling || subtext.power_dynamics || subtext.vulnerability_indicators || subtext.disconnect) && (
        <ExpandableInsight
          insightKey="subtext_analysis"
          icon={<MessageCircle size={18} className="text-rose-600" />}
          title="Deep Subtext Analysis"
          summary="Unconscious signals in your profile - what you're communicating between the lines"
          helpText="This analysis looks at what your profile communicates beyond the literal text - the subtle signals about intimacy, power, vulnerability, and authenticity."
          currentFeedback={feedbackMap['subtext_analysis']}
          onFeedback={handleFeedback}
          className="bg-rose-50/50 border border-rose-100"
        >
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
        </ExpandableInsight>
      )}

      {/* Dating Strategy */}
      {dating_strategy && (
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-pink-600" /> Dating Strategy
          </h3>

          {/* Ideal Partner Profile */}
          {dating_strategy.ideal_partner_profile && (
            <ExpandableInsight
              insightKey="ideal_partner"
              icon={<Heart size={18} className="text-pink-600" />}
              title="Your Ideal Partner"
              summary={dating_strategy.ideal_partner_profile.slice(0, 100) + (dating_strategy.ideal_partner_profile.length > 100 ? '...' : '')}
              detail={dating_strategy.ideal_partner_profile.length > 100 ? dating_strategy.ideal_partner_profile : undefined}
              helpText="Based on your psychology, attachment style, and growth areas, this describes the type of partner who would complement you best."
              currentFeedback={feedbackMap['ideal_partner']}
              onFeedback={handleFeedback}
              className="bg-pink-50 border border-pink-100"
            />
          )}

          {/* Qualities That Energize You */}
          {dating_strategy.what_to_look_for && dating_strategy.what_to_look_for.length > 0 && (
            <ExpandableInsight
              insightKey="energizing_qualities"
              icon={<Sparkles size={18} className="text-green-600" />}
              title="Qualities That Energize You"
              summary={`${dating_strategy.what_to_look_for.length} partner qualities that bring out your best`}
              helpText="Partners with these qualities tend to create a dynamic where you both thrive and grow together."
              currentFeedback={feedbackMap['energizing_qualities']}
              onFeedback={handleFeedback}
              className="bg-green-50 border border-green-100"
            >
              <ul className="text-sm text-green-700 space-y-2">
                {dating_strategy.what_to_look_for.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </ExpandableInsight>
          )}

          {/* Energy-Draining Patterns */}
          {dating_strategy.what_to_avoid && dating_strategy.what_to_avoid.length > 0 && (
            <ExpandableInsight
              insightKey="draining_patterns"
              icon={<Shield size={18} className="text-amber-600" />}
              title="Energy-Draining Patterns"
              summary={`${dating_strategy.what_to_avoid.length} patterns to be mindful of`}
              helpText="These aren't 'red flags' per se - they're patterns that tend to drain YOUR specific energy based on your psychology."
              currentFeedback={feedbackMap['draining_patterns']}
              onFeedback={handleFeedback}
              className="bg-amber-50 border border-amber-100"
            >
              <ul className="text-sm text-amber-700 space-y-2">
                {dating_strategy.what_to_avoid.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </ExpandableInsight>
          )}

          {/* Bio Suggestions */}
          {dating_strategy.bio_suggestions && dating_strategy.bio_suggestions.length > 0 && (
            <ExpandableInsight
              insightKey="bio_suggestions"
              icon={<Lightbulb size={18} className="text-yellow-600" />}
              title="Bio Improvement Suggestions"
              summary={`${dating_strategy.bio_suggestions.length} ways to strengthen your profile`}
              helpText="Specific, actionable suggestions to make your profile more authentic and attractive to your ideal matches."
              currentFeedback={feedbackMap['bio_suggestions']}
              onFeedback={handleFeedback}
              className="bg-white border border-slate-200"
            >
              <ul className="text-sm text-slate-700 space-y-2">
                {dating_strategy.bio_suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-500 font-bold flex-shrink-0">{i + 1}.</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </ExpandableInsight>
          )}

          {/* Opener Recommendations */}
          {dating_strategy.opener_style_recommendations && dating_strategy.opener_style_recommendations.length > 0 && (
            <ExpandableInsight
              insightKey="opener_recommendations"
              icon={<MessageCircle size={18} className="text-blue-600" />}
              title="How to Open Conversations"
              summary={`${dating_strategy.opener_style_recommendations.length} conversation starter strategies`}
              helpText="Opening message strategies tailored to your communication style and the type of connections you're seeking."
              currentFeedback={feedbackMap['opener_recommendations']}
              onFeedback={handleFeedback}
              className="bg-blue-50 border border-blue-100"
            >
              <ul className="text-sm text-blue-900 space-y-2">
                {dating_strategy.opener_style_recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </ExpandableInsight>
          )}
        </section>
      )}

      {/* Partner Virtues (Eudaimonia) */}
      {partner_virtues && partner_virtues.length > 0 && (
        <ExpandableInsight
          insightKey="partner_virtues"
          icon={<Landmark size={18} className="text-amber-600" />}
          title="Your Partner Virtues"
          summary={`${partner_virtues.length} core virtues for relationship flourishing`}
          helpText="Inspired by Greek philosophy (eudaimonia), these are character virtues that would lead to genuine fulfillment for you. When analyzing matches, we score how well they embody these virtues."
          currentFeedback={feedbackMap['partner_virtues']}
          onFeedback={handleFeedback}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
        >
          <div className="space-y-4">
            {partner_virtues.map((virtue, i) => (
              <div key={i} className="bg-white/60 p-3 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 text-sm mb-1">{virtue.name}</h4>
                    <p className="text-sm text-amber-800 mb-2">{virtue.description}</p>
                    <div className="bg-white/80 rounded-lg p-2 space-y-1">
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
        </ExpandableInsight>
      )}


      {/* Behavioral Insights - Using ExpandableInsight */}
      {behavioral_insights && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-600" /> Behavioral Insights
          </h3>

          <div className="space-y-3">
            {/* Strengths Card - Always show first (positive framing) */}
            {behavioral_insights.strengths && behavioral_insights.strengths.length > 0 && (
              <ExpandableInsight
                insightKey="strengths"
                icon={<CheckCircle size={18} className="text-green-600" />}
                title="Your Strengths"
                summary={`${behavioral_insights.strengths.length} key dating strengths identified`}
                helpText="These are the qualities that make you a great partner. Lean into these authentic parts of yourself."
                currentFeedback={feedbackMap['strengths']}
                onFeedback={handleFeedback}
              >
                <ul className="text-sm text-slate-700 space-y-2">
                  {behavioral_insights.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </ExpandableInsight>
            )}

            {/* Communication Style */}
            {behavioral_insights.communication_style && (
              <ExpandableInsight
                insightKey="communication_style"
                icon={<MessageCircle size={18} className="text-blue-600" />}
                title="Communication Style"
                summary={behavioral_insights.communication_style.slice(0, 120) + (behavioral_insights.communication_style.length > 120 ? '...' : '')}
                detail={behavioral_insights.communication_style.length > 120 ? behavioral_insights.communication_style : undefined}
                helpText="How you naturally express yourself in relationships. Understanding this helps you find partners who communicate in complementary ways."
                currentFeedback={feedbackMap['communication_style']}
                onFeedback={handleFeedback}
              />
            )}

            {/* Attachment Patterns - Only show if confidence >= 40% */}
            {behavioral_insights.attachment_patterns && showAttachmentInsight && (
              <ExpandableInsight
                insightKey="attachment_patterns"
                icon={<Heart size={18} className="text-rose-600" />}
                title={
                  <span className="flex items-center gap-2">
                    Attachment Style
                    {attachmentBadge && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${attachmentBadge.colorClass}`}>
                        {attachmentBadge.label}
                      </span>
                    )}
                  </span>
                }
                summary={behavioral_insights.attachment_patterns.slice(0, 120) + (behavioral_insights.attachment_patterns.length > 120 ? '...' : '')}
                detail={behavioral_insights.attachment_patterns.length > 120 ? behavioral_insights.attachment_patterns : undefined}
                helpText="Your attachment style influences how you connect, handle conflict, and experience intimacy. This is based on observable patterns, not a clinical diagnosis."
                currentFeedback={feedbackMap['attachment_patterns']}
                onFeedback={handleFeedback}
              />
            )}

            {/* If attachment confidence is too low, show a gentle message */}
            {behavioral_insights.attachment_patterns && !showAttachmentInsight && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <Heart size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Attachment Style</span>: Need more data to assess accurately
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Add more content to your profile for a detailed attachment analysis.
                </p>
              </div>
            )}

            {/* Growth Areas - Framed positively as "Your Next Level" */}
            {behavioral_insights.growth_areas && behavioral_insights.growth_areas.length > 0 && (
              <ExpandableInsight
                insightKey="growth_areas"
                icon={<Rocket size={18} className="text-amber-600" />}
                title="Your Next Level"
                summary={`${behavioral_insights.growth_areas.length} opportunities for growth identified`}
                helpText="These aren't weaknesses - they're opportunities. Small shifts in these areas can significantly improve your dating success."
                currentFeedback={feedbackMap['growth_areas']}
                onFeedback={handleFeedback}
              >
                <ul className="text-sm text-slate-700 space-y-2">
                  {behavioral_insights.growth_areas.map((g, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </ExpandableInsight>
            )}
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
