// src/lib/ai.ts
import {
  callAnthropicForObject,
  callAnthropicForArray,
  callAnthropicForArraySafe,
  callAnthropicForText,
  callAnthropicWithDebug,
  textContent,
  imageContent,
  TOKEN_LIMITS,
  TIMEOUTS,
  type MessageContent,
} from './api';
import {
  PROFILE_ANALYSIS_PROMPT,
  PROFILE_BASICS_PROMPT,
  PROFILE_DEEP_PROMPT,
  USER_CONTEXT_PROMPT,
  USER_SELF_ANALYSIS_PROMPT,
  USER_CONTEXT_FOR_MATCH,
  ZODIAC_COMPATIBILITY_PROMPT,
  REGENERATE_OPENERS_PROMPT,
  REGENERATE_PROMPT_OPENER_PROMPT,
  CONVERSATION_COACH_PROMPT,
  SCORE_RESPONSE_PROMPT,
  DATE_ASK_PROMPT,
  PARTNER_VIRTUES_PROMPT,
  VIRTUE_SCORING_PROMPT,
  ASK_ABOUT_MATCH_PROMPT,
  NEURODIVERGENCE_ANALYSIS_PROMPT,
  USER_ASPECTS_PROMPT,
  MATCH_ASPECTS_PROMPT,
  USER_VIRTUES_11_PROMPT,
  MATCH_VIRTUES_11_PROMPT,
  // Streaming chunk prompts
  CHUNK_1_BASICS_PROMPT,
  CHUNK_2_IMPRESSIONS_PROMPT,
  CHUNK_3_OBSERVATIONS_PROMPT,
  CHUNK_4_FLAGS_PROMPT,
} from './prompts';
import type {
  AccumulatedProfile,
  ChunkBasicsResult,
  ChunkImpressionsResult,
  ChunkObservationsResult,
  ChunkFlagsResult,
} from './streaming/types';
import {
  mergeChunkBasics,
  mergeChunkImpressions,
  mergeChunkObservations,
  mergeChunkFlags,
  createInitialAccumulatedProfile,
} from './streaming/types';
import type { UserAspectProfile, MatchAspectScores, UserVirtueProfile, MatchVirtueCompatibility, VirtueScore as VirtueScore11 } from './virtues/types';
import type { DatingGoals, DataExport, ManualEntry, DateSuggestion, ZodiacCompatibility, CoachingResponse, MatchCoachingAnalysis, PartnerVirtue, VirtueScore, ProfileAnalysis, NeurodivergenceAnalysis } from './db';
import type { WeatherForecast } from './weather';
import { calculateMatchCompatibility } from './virtues';

// Date suggestions options
export interface DateSuggestionsOptions {
  targetDate?: Date;
  weatherForecast?: WeatherForecast;
  localEvents?: string[];
}

// User context for personalized match analysis
export interface UserContextForMatch {
  goal_type?: string;
  archetype_summary?: string;
  communication_style?: string;
  what_to_look_for?: string[];
  what_to_avoid?: string[];
  opener_style_recommendations?: string[];
  location?: string;
  relationship_style?: string[];
}

// Recommended opener interface
export interface RecommendedOpener {
  type: 'like_comment' | 'match_opener';
  message: string;
  tactic: string;
  why_it_works: string;
}

// Prompt opener interface
export interface PromptOpener {
  message: string;
  tactic: string;
  why_it_works: string;
}

// User self-analysis input interface
interface UserSelfAnalysisInput {
  frames?: string[];
  photos?: string[];
  textContext?: string;
  dataExports?: DataExport[];
  datingGoals?: DatingGoals;
  manualInfo?: ManualEntry;
}

/**
 * Build full prompt with optional user context for personalized analysis
 */
function buildPromptWithUserContext(basePrompt: string, userContext?: UserContextForMatch): string {
  if (!userContext) return basePrompt;

  // Format relationship style for display
  const relationshipStyleText = userContext.relationship_style?.length
    ? userContext.relationship_style.join(', ')
    : 'Not specified';

  return (
    basePrompt +
    USER_CONTEXT_FOR_MATCH.replace('{goal_type}', userContext.goal_type || 'Not specified')
      .replace('{archetype_summary}', userContext.archetype_summary || 'Not available')
      .replace('{communication_style}', userContext.communication_style || 'Not available')
      .replace('{what_to_look_for}', userContext.what_to_look_for?.join(', ') || 'Not specified')
      .replace('{what_to_avoid}', userContext.what_to_avoid?.join(', ') || 'Not specified')
      .replace('{opener_style_recommendations}', userContext.opener_style_recommendations?.join(', ') || 'Not specified')
      .replace('{user_location}', userContext.location || 'Not specified')
      .replace('{relationship_style}', relationshipStyleText)
  );
}

/**
 * Build user context string for openers
 */
function buildUserContextString(userContext?: UserContextForMatch): string {
  if (!userContext) return 'Not available';

  return `
- Dating Goal: ${userContext.goal_type || 'Not specified'}
- User Archetype: ${userContext.archetype_summary || 'Not available'}
- Opener Style: ${userContext.opener_style_recommendations?.join(', ') || 'Not specified'}`;
}

export async function analyzeProfile(frames: string[], userContext?: UserContextForMatch) {
  if (!frames || frames.length === 0) {
    throw new Error('No frames provided for analysis.');
  }

  console.log(`src/lib/ai.ts: Sending ${frames.length} frames to Claude...`);
  if (userContext) {
    console.log('src/lib/ai.ts: Including user context for personalized analysis');
  }

  const messages: MessageContent[] = [
    ...frames.map((frame) => imageContent(frame)),
    textContent(buildPromptWithUserContext(PROFILE_ANALYSIS_PROMPT, userContext)),
  ];

  return callAnthropicForObject({
    messages,
    maxTokens: TOKEN_LIMITS.PROFILE_ANALYSIS,
  });
}

// --- SPLIT ANALYSIS (Progressive Loading) ---

// Quick extraction result (basics only)
export interface QuickBasicsResult {
  meta: {
    app_name?: string;
    best_photo_index?: number;
  };
  basics: {
    name?: string;
    age?: number;
    height?: string;
    job?: string;
    location?: string;
    school?: string;
    hometown?: string;
    zodiac_sign?: string;
  };
}

export interface ProfileDeepAnalysis {
  photos: Array<{
    description: string;
    vibe: string;
    subtext: string;
  }>;
  prompts: Array<{
    question: string;
    answer: string;
    analysis: string;
    suggested_opener?: {
      message: string;
      tactic: string;
      why_it_works: string;
    };
  }>;
  psychological_profile: {
    agendas: Array<{
      type: string;
      evidence: string;
      priority: 'primary' | 'secondary';
    }>;
    presentation_tactics: string[];
    predicted_tactics: string[];
    subtext_analysis: {
      sexual_signaling: string;
      power_dynamics: string;
      vulnerability_indicators: string;
      disconnect: string;
    };
    archetype_summary: string;
  };
  recommended_openers: Array<{
    type: 'like_comment' | 'match_opener';
    message: string;
    tactic: string;
    why_it_works: string;
  }>;
  transactional_indicators: {
    likelihood: 'none' | 'low' | 'moderate' | 'high';
    confidence: number;
    signals: string[];
    context: string;
    ethical_note: string;
  };
  relationship_style_inference: {
    likely_preference: string;
    confidence: number;
    signals: string[];
    note: string;
  };
}

/**
 * Quick extraction of basic profile info (name, age, location, etc.)
 * Uses only first 3 frames for speed.
 */
export async function analyzeQuickBasicsResult(
  frames: string[],
  options?: { signal?: AbortSignal }
): Promise<QuickBasicsResult> {
  if (!frames || frames.length === 0) {
    throw new Error('No frames provided for analysis.');
  }

  // Use only first 3 frames for quick extraction
  const quickFrames = frames.slice(0, 3);
  console.log(`src/lib/ai.ts: Quick basics extraction with ${quickFrames.length} frames...`);

  const messages: MessageContent[] = [
    ...quickFrames.map((frame) => imageContent(frame)),
    textContent(PROFILE_BASICS_PROMPT),
  ];

  return callAnthropicForObject<QuickBasicsResult>({
    messages,
    maxTokens: TOKEN_LIMITS.PROFILE_BASICS,
    signal: options?.signal,
    timeout: 30000, // 30 second timeout for basics
  });
}

/**
 * Deep psychological analysis with all frames.
 * Takes previously extracted basics to avoid redundant work.
 */
export async function analyzeProfileDeep(
  frames: string[],
  basics: QuickBasicsResult,
  userContext?: UserContextForMatch,
  options?: { signal?: AbortSignal }
): Promise<ProfileDeepAnalysis> {
  if (!frames || frames.length === 0) {
    throw new Error('No frames provided for analysis.');
  }

  // Limit frames to prevent token overflow - use at most 12 frames
  // If more than 12, sample evenly across the video
  const maxFrames = 12;
  const framesToUse = frames.length > maxFrames
    ? frames.filter((_, i) => i % Math.ceil(frames.length / maxFrames) === 0).slice(0, maxFrames)
    : frames;

  console.log(`src/lib/ai.ts: Deep analysis with ${framesToUse.length} frames (from ${frames.length} total)...`);

  // Build the deep prompt with basics info
  const deepPrompt = PROFILE_DEEP_PROMPT.replace(
    '{basics_json}',
    JSON.stringify(basics, null, 2)
  );

  const messages: MessageContent[] = [
    ...framesToUse.map((frame) => imageContent(frame)),
    textContent(buildPromptWithUserContext(deepPrompt, userContext)),
  ];

  return callAnthropicForObject<ProfileDeepAnalysis>({
    messages,
    maxTokens: TOKEN_LIMITS.PROFILE_DEEP,
    signal: options?.signal,
    timeout: 90000, // 90 second timeout for deep analysis
  });
}

/**
 * Combined split analysis - returns basics quickly, then full analysis.
 * Calls onBasicsReady when basics are available for progressive UI update.
 */
export async function analyzeProfileProgressive(
  frames: string[],
  userContext?: UserContextForMatch,
  options?: {
    signal?: AbortSignal;
    onBasicsReady?: (basics: QuickBasicsResult) => void;
  }
): Promise<ProfileAnalysis> {
  // Step 1: Quick basics extraction
  const basics = await analyzeQuickBasicsResult(frames, { signal: options?.signal });

  // Notify UI that basics are ready
  if (options?.onBasicsReady) {
    options.onBasicsReady(basics);
  }

  // Step 2: Deep analysis with all frames
  const deepAnalysis = await analyzeProfileDeep(frames, basics, userContext, { signal: options?.signal });

  // Merge basics and deep analysis into full ProfileAnalysis format
  const fullAnalysis: ProfileAnalysis = {
    meta: basics.meta,
    basics: basics.basics,
    photos: deepAnalysis.photos,
    prompts: deepAnalysis.prompts,
    psychological_profile: deepAnalysis.psychological_profile,
    recommended_openers: deepAnalysis.recommended_openers,
    transactional_indicators: deepAnalysis.transactional_indicators,
    relationship_style_inference: deepAnalysis.relationship_style_inference,
  };

  return fullAnalysis;
}

export async function analyzeUserBackstory(textContext: string) {
  if (!textContext || textContext.length < 10) {
    throw new Error('Context is too short. Please add more details to your biography or upload files.');
  }

  console.log(`src/lib/ai.ts: Sending user context (${textContext.length} chars) to Claude...`);

  const messages: MessageContent[] = [
    textContent(USER_CONTEXT_PROMPT),
    textContent(`\n\nHERE IS THE USER'S CONTEXT (BIO/JOURNAL):\n${textContext}`),
  ];

  return callAnthropicForObject({
    messages,
    maxTokens: TOKEN_LIMITS.USER_BACKSTORY,
  });
}

export async function analyzeUserSelf(input: UserSelfAnalysisInput) {
  const hasImages = (input.frames && input.frames.length > 0) || (input.photos && input.photos.length > 0);
  const hasText = input.textContext && input.textContext.length > 10;
  const hasStats = input.dataExports && input.dataExports.length > 0;
  const hasGoals = input.datingGoals && input.datingGoals.type;
  const hasManualInfo =
    input.manualInfo && Object.keys(input.manualInfo).some((k) => input.manualInfo![k as keyof ManualEntry]);

  if (!hasImages && !hasText && !hasStats && !hasGoals && !hasManualInfo) {
    throw new Error('Please provide at least one type of input (photos, text, stats, or profile info) for analysis.');
  }

  console.log('src/lib/ai.ts: analyzeUserSelf | Building multimodal request...');

  const messages: MessageContent[] = [];

  // Add images (limit to 5 photos + 5 video frames = 10 max, graduated increase with Pro tier timeout)
  const photoImages = (input.photos || []).slice(0, 5);
  const frameImages = (input.frames || []).slice(0, 5);
  const allImages = [...photoImages, ...frameImages];

  if (allImages.length > 0) {
    console.log(`src/lib/ai.ts: analyzeUserSelf | Adding ${photoImages.length} photos and ${frameImages.length} video frames`);
    allImages.forEach((img) => messages.push(imageContent(img)));
  }

  // Build context text with all available data
  let contextText = '';

  if (hasGoals) {
    contextText += `\n--- DATING GOALS ---\n`;
    contextText += `Goal Type: ${input.datingGoals!.type}\n`;
    if (input.datingGoals!.description) {
      contextText += `Description: ${input.datingGoals!.description}\n`;
    }
  }

  if (hasManualInfo) {
    contextText += `\n--- USER PROFILE INFO ---\n`;
    const info = input.manualInfo!;
    if (info.name) contextText += `Name: ${info.name}\n`;
    if (info.age) contextText += `Age: ${info.age}\n`;
    if (info.occupation) contextText += `Occupation: ${info.occupation}\n`;
    if (info.location) contextText += `Location: ${info.location}\n`;
    if (info.interests && info.interests.length > 0) {
      contextText += `Interests: ${info.interests.join(', ')}\n`;
    }
    if (info.attachmentStyle) contextText += `Self-identified Attachment Style: ${info.attachmentStyle}\n`;
    if (info.relationshipStyle && info.relationshipStyle.length > 0) {
      contextText += `Relationship Style Preferences: ${info.relationshipStyle.join(', ')}\n`;
    }
    if (info.relationshipHistory) contextText += `Relationship History Notes: ${info.relationshipHistory}\n`;
  }

  if (hasStats) {
    contextText += `\n--- DATING APP BEHAVIOR DATA ---\n`;
    input.dataExports!.forEach((exp) => {
      contextText += `Source: ${exp.source}\n`;
      contextText += `- Total Matches: ${exp.rawStats.matches}\n`;
      contextText += `- Conversations Started: ${exp.rawStats.conversations}\n`;
      contextText += `- Initiator Ratio: ${Math.round(exp.rawStats.initiatorRatio * 100)}% (how often they message first)\n`;
      contextText += `- Double Text Ratio: ${Math.round(exp.rawStats.doubleTextRatio * 100)}% (sending multiple messages without reply)\n`;
      contextText += `- Average Message Length: ${exp.rawStats.avgMessageLength} characters\n`;
    });
  }

  if (hasText) {
    contextText += `\n--- USER'S TEXT CONTEXT (JOURNALS/BIOS) ---\n`;
    contextText += input.textContext;
  }

  messages.push(textContent(USER_SELF_ANALYSIS_PROMPT + (contextText ? `\n\n--- PROVIDED INPUT DATA ---\n${contextText}` : '')));

  console.log('src/lib/ai.ts: analyzeUserSelf | Sending request to Claude...');

  const debugInfo: Record<string, unknown> = {
    imageCount: allImages.length,
    hasText: !!contextText,
  };

  return callAnthropicWithDebug({
    messages,
    maxTokens: TOKEN_LIMITS.USER_SELF_ANALYSIS,
    timeout: TIMEOUTS.PROFILE_ANALYSIS,  // 120s for large analysis
  }, debugInfo);
}

export async function getDateSuggestions(
  matchLocation: string,
  userLocation: string,
  matchInterests: string[],
  userGoal: string,
  options?: DateSuggestionsOptions
): Promise<DateSuggestion[]> {
  console.log('src/lib/ai.ts: Generating date suggestions...');

  // Build weather context
  let weatherContext = '';
  if (options?.weatherForecast) {
    const w = options.weatherForecast;
    weatherContext = `
Weather Forecast for ${options.targetDate?.toLocaleDateString() || 'the date'}:
- High: ${w.temp_high}F / Low: ${w.temp_low}F
- Conditions: ${w.condition}
- Precipitation chance: ${w.precipitation_probability}%

IMPORTANT: Factor weather into your suggestions. If it's rainy/cold, prioritize indoor activities. If it's nice, outdoor options are great.`;
  }

  // Build events context
  let eventsContext = '';
  if (options?.localEvents && options.localEvents.length > 0) {
    eventsContext = `
Local Events Happening:
${options.localEvents.map((e) => `- ${e}`).join('\n')}

IMPORTANT: Try to incorporate at least one of these events if it aligns with the match's interests.`;
  }

  const prompt = `You are a creative date planner. Based on the following context, suggest 4 unique date ideas.

Match's Location: ${matchLocation || 'Unknown'}
Your Location: ${userLocation || 'Unknown'}
Match's Interests: ${matchInterests?.join(', ') || 'Not specified'}
Dating Goal: ${userGoal || 'Not specified'}
${weatherContext}
${eventsContext}

For each date, consider:
- The midpoint or convenient meeting location between both people
- Activities that align with the match's apparent interests
- Appropriate venues for the stated dating goal (casual dates for casual goals, more intimate settings for long-term)
${options?.weatherForecast ? '- Weather appropriateness for outdoor vs indoor activities' : ''}
${options?.localEvents?.length ? '- Local events that could make for a memorable date' : ''}

Return a JSON array with exactly 4 date suggestions:
[
  {
    "name": "Name of venue or activity",
    "type": "coffee" | "dinner" | "activity" | "drinks" | "outdoor" | "cultural",
    "location": "Neighborhood or area suggestion",
    "why_good_fit": "One sentence explaining why this works for this specific match",
    "weather_appropriate": true/false (is this good for the forecasted weather?),
    "weather_note": "Optional note about weather, e.g., 'Perfect for the sunny 72F forecast' or 'Indoor backup for the rain'",
    "event_tie_in": "Optional - if this ties into a local event, mention it here"
  }
]

Do not include markdown. Return only the raw JSON array.`;

  return callAnthropicForArray<DateSuggestion>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.DATE_SUGGESTIONS,
  });
}

export async function searchLocalEvents(
  location: string,
  targetDate: Date,
  matchInterests: string[],
  userInterests?: string[]
): Promise<string[]> {
  console.log(`src/lib/ai.ts: Searching local events for ${location}...`);

  const dateStr = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const allInterests = [...matchInterests, ...(userInterests || [])].filter(Boolean);

  const prompt = `You are a local events expert. Suggest 3-5 events or activities that might be happening in or around "${location}" on or around ${dateStr}.

Based on these interests: ${allInterests.join(', ') || 'general activities'}

Consider:
- Recurring events common for that day of week (e.g., Sunday farmers markets, Friday night art walks)
- Seasonal activities appropriate for the time of year
- Popular local venues and their typical offerings
- Community events, festivals, or cultural happenings

Return a JSON array of event descriptions (brief, 1 sentence each):
["Event 1 description", "Event 2 description", ...]

Be creative but realistic. These should be plausible events for the area.
Do not include markdown. Return only the raw JSON array.`;

  return callAnthropicForArraySafe<string>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.LOCAL_EVENTS,
  });
}

export async function getZodiacCompatibility(
  userSign: string,
  matchSign: string,
  userArchetype?: string,
  matchArchetype?: string
): Promise<ZodiacCompatibility> {
  console.log(`src/lib/ai.ts: Getting zodiac compatibility for ${userSign} + ${matchSign}...`);

  const prompt = ZODIAC_COMPATIBILITY_PROMPT.replace(/{user_sign}/g, userSign)
    .replace(/{match_sign}/g, matchSign)
    .replace('{user_archetype}', userArchetype || 'Not available')
    .replace('{match_archetype}', matchArchetype || 'Not available');

  return callAnthropicForObject<ZodiacCompatibility>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.ZODIAC,
  });
}

export async function regenerateOpeners(
  profileAnalysis: {
    basics?: Record<string, unknown>;
    psychological_profile?: {
      archetype_summary?: string;
      subtext_analysis?: {
        vulnerability_indicators?: string;
        power_dynamics?: string;
      };
    };
    prompts?: Array<{ question: string; answer: string }>;
  },
  userContext?: UserContextForMatch
): Promise<RecommendedOpener[]> {
  console.log('src/lib/ai.ts: Regenerating openers...');

  const basics = profileAnalysis.basics || {};
  const psych = profileAnalysis.psychological_profile || {};
  const prompts = profileAnalysis.prompts || [];

  const prompt = REGENERATE_OPENERS_PROMPT.replace('{basics}', JSON.stringify(basics, null, 2))
    .replace('{archetype_summary}', psych.archetype_summary || 'Not available')
    .replace('{vulnerability_indicators}', psych.subtext_analysis?.vulnerability_indicators || 'Not available')
    .replace('{power_dynamics}', psych.subtext_analysis?.power_dynamics || 'Not available')
    .replace('{prompts}', prompts.map((p) => `Q: ${p.question}\nA: ${p.answer}`).join('\n\n'))
    .replace('{user_context}', buildUserContextString(userContext));

  return callAnthropicForArray<RecommendedOpener>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.OPENERS,
  });
}

export async function regeneratePromptOpener(
  prompt: { question: string; answer: string; analysis: string },
  profileContext: { name: string; archetype_summary: string; vulnerability_indicators: string },
  userContext?: UserContextForMatch
): Promise<PromptOpener> {
  console.log('src/lib/ai.ts: Regenerating prompt opener...');

  const promptText = REGENERATE_PROMPT_OPENER_PROMPT.replace('{question}', prompt.question)
    .replace('{answer}', prompt.answer)
    .replace('{analysis}', prompt.analysis)
    .replace('{name}', profileContext.name || 'Unknown')
    .replace('{archetype_summary}', profileContext.archetype_summary || 'Not available')
    .replace('{vulnerability_indicators}', profileContext.vulnerability_indicators || 'Not available')
    .replace('{user_context}', buildUserContextString(userContext));

  return callAnthropicForObject<PromptOpener>({
    messages: [textContent(promptText)],
    maxTokens: TOKEN_LIMITS.PROMPT_OPENER,
  });
}

// --- CONVERSATION COACHING ---

export interface CoachingAnalysisInput {
  conversationImages: string[];
  userContext: {
    archetype?: string;
    attachmentPatterns?: string;
    communicationStyle?: string;
    growthAreas?: string[];
    goal?: string;
  };
  matchContext: {
    name?: string;
    archetype?: string;
    agendas?: string[];
    tactics?: string[];
    vulnerabilities?: string;
    powerDynamics?: string;
  };
}

export interface CoachingAnalysisResult {
  match_analysis: MatchCoachingAnalysis;
  suggested_responses: CoachingResponse[];
}

export interface DateAskSuggestion {
  message: string;
  approach: 'Direct' | 'Playful' | 'Low-pressure';
  tactic: string;
  why_it_works: string;
}

export interface ResponseScoreResult {
  score: number;
  explanation: string;
  growth_note: string;
}

/**
 * Analyze a conversation and provide coaching suggestions
 */
export async function analyzeConversation(input: CoachingAnalysisInput): Promise<CoachingAnalysisResult> {
  if (!input.conversationImages || input.conversationImages.length === 0) {
    throw new Error('No conversation images provided for analysis.');
  }

  console.log(`src/lib/ai.ts: Analyzing conversation with ${input.conversationImages.length} images...`);

  const prompt = CONVERSATION_COACH_PROMPT
    .replace('{user_archetype}', input.userContext.archetype || 'Not available')
    .replace('{user_attachment_patterns}', input.userContext.attachmentPatterns || 'Not available')
    .replace('{user_communication_style}', input.userContext.communicationStyle || 'Not available')
    .replace('{user_growth_areas}', input.userContext.growthAreas?.join(', ') || 'Not specified')
    .replace('{user_goal}', input.userContext.goal || 'Not specified')
    .replace('{match_name}', input.matchContext.name || 'Unknown')
    .replace('{match_archetype}', input.matchContext.archetype || 'Not available')
    .replace('{match_agendas}', input.matchContext.agendas?.join(', ') || 'Not analyzed')
    .replace('{match_tactics}', input.matchContext.tactics?.join(', ') || 'Not analyzed')
    .replace('{match_vulnerabilities}', input.matchContext.vulnerabilities || 'Not available');

  const messages: MessageContent[] = [
    ...input.conversationImages.map((img) => imageContent(img)),
    textContent(prompt),
  ];

  return callAnthropicForObject<CoachingAnalysisResult>({
    messages,
    maxTokens: TOKEN_LIMITS.COACHING,
  });
}

/**
 * Score the user's actual response compared to suggestions
 */
export async function scoreUserResponse(
  userResponse: string,
  matchContext: {
    archetype?: string;
    detectedAgenda: string;
    detectedTactics: string[];
    subtext: string;
  },
  userContext: {
    archetype?: string;
    growthAreas?: string[];
    communicationStyle?: string;
  },
  suggestedResponses: CoachingResponse[]
): Promise<ResponseScoreResult> {
  console.log('src/lib/ai.ts: Scoring user response...');

  const suggestedResponsesText = suggestedResponses
    .map((r, i) => `${i + 1}. "${r.message}" (Tactic: ${r.tactic})`)
    .join('\n');

  const prompt = SCORE_RESPONSE_PROMPT
    .replace('{match_archetype}', matchContext.archetype || 'Not available')
    .replace('{detected_agenda}', matchContext.detectedAgenda)
    .replace('{detected_tactics}', matchContext.detectedTactics.join(', '))
    .replace('{subtext}', matchContext.subtext)
    .replace('{user_archetype}', userContext.archetype || 'Not available')
    .replace('{user_growth_areas}', userContext.growthAreas?.join(', ') || 'Not specified')
    .replace('{user_communication_style}', userContext.communicationStyle || 'Not available')
    .replace('{suggested_responses}', suggestedResponsesText)
    .replace('{user_response}', userResponse);

  return callAnthropicForObject<ResponseScoreResult>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.COACHING_SCORE,
  });
}

/**
 * Generate date ask messages based on conversation context
 */
export async function generateDateAsk(
  conversationImages: string[],
  matchContext: {
    name?: string;
    archetype?: string;
    powerDynamics?: string;
    vulnerabilities?: string;
  },
  userContext: {
    goal?: string;
    communicationStyle?: string;
  }
): Promise<DateAskSuggestion[]> {
  if (!conversationImages || conversationImages.length === 0) {
    throw new Error('No conversation images provided for date ask generation.');
  }

  console.log('src/lib/ai.ts: Generating date ask suggestions...');

  const prompt = DATE_ASK_PROMPT
    .replace('{match_name}', matchContext.name || 'them')
    .replace('{match_archetype}', matchContext.archetype || 'Not available')
    .replace('{power_dynamics}', matchContext.powerDynamics || 'Not analyzed')
    .replace('{match_vulnerabilities}', matchContext.vulnerabilities || 'Not available')
    .replace('{user_goal}', userContext.goal || 'Not specified')
    .replace('{user_communication_style}', userContext.communicationStyle || 'Not available')
    .replace('{conversation_summary}', 'See conversation screenshots above');

  const messages: MessageContent[] = [
    ...conversationImages.map((img) => imageContent(img)),
    textContent(prompt),
  ];

  return callAnthropicForArray<DateAskSuggestion>({
    messages,
    maxTokens: TOKEN_LIMITS.COACHING_DATE_ASK,
  });
}

// --- PARTNER VIRTUES (Eudaimonia) ---

export interface PartnerVirtuesInput {
  archetype_summary?: string;
  attachment_patterns?: string;
  communication_style?: string;
  dating_goal?: string;
  what_to_look_for?: string[];
  what_to_avoid?: string[];
  growth_areas?: string[];
  strengths?: string[];
}

export interface PartnerVirtuesResult {
  partner_virtues: PartnerVirtue[];
}

/**
 * Extract 5 core partner virtues based on user's psychological profile
 */
export async function extractPartnerVirtues(input: PartnerVirtuesInput): Promise<PartnerVirtue[]> {
  console.log('src/lib/ai.ts: Extracting partner virtues...');

  const prompt = PARTNER_VIRTUES_PROMPT
    .replace('{archetype_summary}', input.archetype_summary || 'Not available')
    .replace('{attachment_patterns}', input.attachment_patterns || 'Not available')
    .replace('{communication_style}', input.communication_style || 'Not available')
    .replace('{dating_goal}', input.dating_goal || 'Not specified')
    .replace('{what_to_look_for}', input.what_to_look_for?.join(', ') || 'Not specified')
    .replace('{what_to_avoid}', input.what_to_avoid?.join(', ') || 'Not specified')
    .replace('{growth_areas}', input.growth_areas?.join(', ') || 'Not specified')
    .replace('{strengths}', input.strengths?.join(', ') || 'Not specified');

  const result = await callAnthropicForObject<PartnerVirtuesResult>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.VIRTUE_EXTRACTION,
  });

  return result.partner_virtues || [];
}

export interface VirtueScoreResult {
  virtue_scores: VirtueScore[];
}

/**
 * Score a match against user's partner virtues
 */
export async function scoreMatchVirtues(
  matchAnalysis: ProfileAnalysis,
  userVirtues: PartnerVirtue[]
): Promise<VirtueScore[]> {
  if (!userVirtues || userVirtues.length === 0) {
    console.log('src/lib/ai.ts: No user virtues provided, skipping virtue scoring');
    return [];
  }

  console.log('src/lib/ai.ts: Scoring match virtues...');

  // Format user virtues for the prompt
  const virtuesText = userVirtues.map((v, i) =>
    `${i + 1}. ${v.name}\n   - Description: ${v.description}\n   - Anti-virtue (red flag): ${v.anti_virtue}`
  ).join('\n\n');

  // Extract match info from analysis
  const psych = matchAnalysis.psychological_profile;
  const photoVibes = matchAnalysis.photos?.map(p => `${p.vibe}: ${p.subtext}`).join('; ') || 'Not available';
  const promptsText = matchAnalysis.prompts?.map(p => `Q: ${p.question}\nA: ${p.answer}`).join('\n\n') || 'Not available';
  const agendasText = psych?.agendas?.map(a => `${a.type} (${a.priority}): ${a.evidence}`).join('; ') || 'Not analyzed';
  const subtextText = psych?.subtext_analysis
    ? `Sexual signaling: ${psych.subtext_analysis.sexual_signaling || 'N/A'}; Power: ${psych.subtext_analysis.power_dynamics || 'N/A'}; Vulnerability: ${psych.subtext_analysis.vulnerability_indicators || 'N/A'}`
    : 'Not available';

  const prompt = VIRTUE_SCORING_PROMPT
    .replace('{user_virtues}', virtuesText)
    .replace('{match_name}', matchAnalysis.basics?.name || 'Unknown')
    .replace('{match_archetype}', psych?.archetype_summary || 'Not available')
    .replace('{match_agendas}', agendasText)
    .replace('{match_tactics}', psych?.presentation_tactics?.join(', ') || 'Not analyzed')
    .replace('{match_subtext}', subtextText)
    .replace('{match_photo_vibes}', photoVibes)
    .replace('{match_prompts}', promptsText);

  const result = await callAnthropicForObject<VirtueScoreResult>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.VIRTUE_SCORING,
  });

  return result.virtue_scores || [];
}

// --- ASK ABOUT MATCH ---

export interface AskAboutMatchInput {
  question: string;
  matchAnalysis: ProfileAnalysis;
  compatibility?: {
    score: number;
    summary: string;
    strengths?: string[];
    concerns?: string[];
  };
}

/**
 * Ask a question about a match profile and get an AI response.
 */
export async function askAboutMatch(input: AskAboutMatchInput): Promise<string> {
  console.log('src/lib/ai.ts: Asking about match:', input.question);

  const { matchAnalysis, compatibility } = input;
  const psych = matchAnalysis.psychological_profile;

  // Format photos for prompt
  const photosText = matchAnalysis.photos?.map((p, i) =>
    `Photo ${i + 1}: ${p.vibe} - ${p.subtext}`
  ).join('\n') || 'No photo analysis available';

  // Format prompts for prompt
  const promptsText = matchAnalysis.prompts?.map(p =>
    `Q: ${p.question}\nA: ${p.answer}\nAnalysis: ${p.analysis}`
  ).join('\n\n') || 'No prompt responses available';

  // Format subtext
  const subtextText = psych?.subtext_analysis
    ? `Sexual signaling: ${psych.subtext_analysis.sexual_signaling || 'N/A'}
Power dynamics: ${psych.subtext_analysis.power_dynamics || 'N/A'}
Vulnerability: ${psych.subtext_analysis.vulnerability_indicators || 'N/A'}
Disconnect: ${psych.subtext_analysis.disconnect || 'N/A'}`
    : 'Not available';

  // Format compatibility
  const compatibilityText = compatibility
    ? `Score: ${compatibility.score}/10 - ${compatibility.summary}
Strengths: ${compatibility.strengths?.join(', ') || 'None noted'}
Concerns: ${compatibility.concerns?.join(', ') || 'None noted'}`
    : 'No compatibility analysis available';

  const prompt = ASK_ABOUT_MATCH_PROMPT
    .replace('{match_name}', matchAnalysis.basics?.name || 'Unknown')
    .replace('{match_age}', matchAnalysis.basics?.age?.toString() || 'Unknown')
    .replace('{match_location}', matchAnalysis.basics?.location || 'Unknown')
    .replace('{match_job}', matchAnalysis.basics?.job || 'Unknown')
    .replace('{match_archetype}', psych?.archetype_summary || 'Not available')
    .replace('{match_agendas}', psych?.agendas?.map(a => `${a.type} (${a.priority})`).join(', ') || 'Not analyzed')
    .replace('{match_tactics}', psych?.presentation_tactics?.join(', ') || 'Not analyzed')
    .replace('{match_subtext}', subtextText)
    .replace('{match_photos}', photosText)
    .replace('{match_prompts}', promptsText)
    .replace('{compatibility_notes}', compatibilityText)
    .replace('{user_question}', input.question);

  return callAnthropicForText({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.ASK_ABOUT_MATCH,
  });
}

// --- NEURODIVERGENCE ANALYSIS ---

export interface NeurodivergenceInput {
  archetype_summary?: string;
  communication_style?: string;
  attachment_patterns?: string;
  growth_areas?: string[];
  strengths?: string[];
  photo_analysis?: string;
  dating_goal?: string;
  behavioral_patterns?: string;
}

/**
 * Analyze potential neurodivergent traits based on user's profile.
 * This is for self-awareness purposes only, not a clinical diagnosis.
 */
export async function analyzeNeurodivergence(input: NeurodivergenceInput): Promise<NeurodivergenceAnalysis> {
  console.log('src/lib/ai.ts: Analyzing neurodivergence traits...');

  const prompt = NEURODIVERGENCE_ANALYSIS_PROMPT
    .replace('{archetype_summary}', input.archetype_summary || 'Not available')
    .replace('{communication_style}', input.communication_style || 'Not available')
    .replace('{attachment_patterns}', input.attachment_patterns || 'Not available')
    .replace('{behavioral_patterns}', input.behavioral_patterns || 'Not available')
    .replace('{growth_areas}', input.growth_areas?.join(', ') || 'Not specified')
    .replace('{strengths}', input.strengths?.join(', ') || 'Not specified')
    .replace('{photo_analysis}', input.photo_analysis || 'Not available')
    .replace('{dating_goal}', input.dating_goal || 'Not specified');

  return callAnthropicForObject<NeurodivergenceAnalysis>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.NEURODIVERGENCE_ANALYSIS,
  });
}

// --- 23 ASPECTS SYSTEM ---

export interface UserAspectsInput {
  archetype_summary?: string;
  communication_style?: string;
  attachment_patterns?: string;
  dating_goal?: string;
  what_to_look_for?: string[];
  what_to_avoid?: string[];
  growth_areas?: string[];
  strengths?: string[];
  photo_analysis?: string;
  behavioral_data?: string;
}

/**
 * Extract user's 23 Aspect profile based on their synthesis data.
 */
export async function extractUserAspects(input: UserAspectsInput): Promise<UserAspectProfile> {
  console.log('src/lib/ai.ts: Extracting user aspects (23 Aspects system)...');

  // Build user profile data string
  const profileData = `
Archetype Summary: ${input.archetype_summary || 'Not available'}
Communication Style: ${input.communication_style || 'Not available'}
Attachment Patterns: ${input.attachment_patterns || 'Not available'}
Dating Goal: ${input.dating_goal || 'Not specified'}
What They Look For: ${input.what_to_look_for?.join(', ') || 'Not specified'}
What They Avoid: ${input.what_to_avoid?.join(', ') || 'Not specified'}
Growth Areas: ${input.growth_areas?.join(', ') || 'Not specified'}
Strengths: ${input.strengths?.join(', ') || 'Not specified'}
Photo Analysis: ${input.photo_analysis || 'Not available'}
Behavioral Data: ${input.behavioral_data || 'Not available'}
`.trim();

  const prompt = USER_ASPECTS_PROMPT.replace('{user_profile_data}', profileData);

  const result = await callAnthropicForObject<UserAspectProfile>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.USER_ASPECTS,
  });

  // Add timestamp
  result.lastUpdated = new Date();

  return result;
}

/**
 * Score a match on the 23 Aspects and compare against user's aspect profile.
 */
export async function scoreMatchAspects(
  matchAnalysis: ProfileAnalysis,
  userAspects: UserAspectProfile
): Promise<MatchAspectScores> {
  if (!userAspects || !userAspects.scores || userAspects.scores.length === 0) {
    console.log('src/lib/ai.ts: No user aspects provided, skipping aspect scoring');
    throw new Error('User aspect profile required for match scoring');
  }

  console.log('src/lib/ai.ts: Scoring match aspects (23 Aspects system)...');

  // Format user aspects for the prompt
  const userAspectsText = userAspects.scores
    .map(s => `${s.aspect_id}: ${s.score}/100${s.evidence ? ` (${s.evidence})` : ''}`)
    .join('\n');

  const userAspectsFormatted = `
Scores:
${userAspectsText}

Dominant Aspects: ${userAspects.dominant_aspects?.join(', ') || 'Not specified'}
Shadow Aspects: ${userAspects.shadow_aspects?.join(', ') || 'Not specified'}

Realm Summary:
- Vitality: ${userAspects.realm_summary?.vitality || 'Not available'}
- Connection: ${userAspects.realm_summary?.connection || 'Not available'}
- Structure: ${userAspects.realm_summary?.structure || 'Not available'}
`.trim();

  // Format match analysis for the prompt
  const psych = matchAnalysis.psychological_profile;
  const photoVibes = matchAnalysis.photos?.map(p => `${p.vibe}: ${p.subtext}`).join('; ') || 'Not available';
  const promptsText = matchAnalysis.prompts?.map(p => `Q: ${p.question}\nA: ${p.answer}\nAnalysis: ${p.analysis}`).join('\n\n') || 'Not available';
  const agendasText = psych?.agendas?.map(a => `${a.type} (${a.priority}): ${a.evidence}`).join('; ') || 'Not analyzed';

  const matchAnalysisText = `
Basics: ${matchAnalysis.basics?.name || 'Unknown'}, ${matchAnalysis.basics?.age || '?'} years old
Location: ${matchAnalysis.basics?.location || 'Unknown'}
Job: ${matchAnalysis.basics?.job || 'Unknown'}

Archetype: ${psych?.archetype_summary || 'Not available'}
Agendas: ${agendasText}
Presentation Tactics: ${psych?.presentation_tactics?.join(', ') || 'Not analyzed'}
Predicted Tactics: ${psych?.predicted_tactics?.join(', ') || 'Not analyzed'}

Subtext Analysis:
- Sexual Signaling: ${psych?.subtext_analysis?.sexual_signaling || 'Not available'}
- Power Dynamics: ${psych?.subtext_analysis?.power_dynamics || 'Not available'}
- Vulnerability: ${psych?.subtext_analysis?.vulnerability_indicators || 'Not available'}
- Disconnect: ${psych?.subtext_analysis?.disconnect || 'Not available'}

Photo Vibes: ${photoVibes}

Prompts:
${promptsText}
`.trim();

  const prompt = MATCH_ASPECTS_PROMPT
    .replace('{user_aspects}', userAspectsFormatted)
    .replace('{match_name}', matchAnalysis.basics?.name || 'Unknown')
    .replace('{match_analysis}', matchAnalysisText);

  return callAnthropicForObject<MatchAspectScores>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.MATCH_ASPECTS,
  });
}

// =============================================================================
// 11 VIRTUES SYSTEM (NEW)
// =============================================================================

export interface UserVirtues11Input {
  archetype_summary?: string;
  communication_style?: string;
  attachment_patterns?: string;
  dating_goal?: string;
  what_to_look_for?: string[];
  what_to_avoid?: string[];
  growth_areas?: string[];
  strengths?: string[];
  photo_analysis?: string;
  behavioral_data?: string;
}

/**
 * Extract user's 11 Virtues profile based on their synthesis data.
 * This is the NEW system that replaces 23 Aspects.
 */
export async function extractUserVirtues11(input: UserVirtues11Input): Promise<UserVirtueProfile> {
  console.log('src/lib/ai.ts: Extracting user virtues (11 Virtues system)...');

  // Build user profile data string
  const profileData = `
Archetype Summary: ${input.archetype_summary || 'Not available'}
Communication Style: ${input.communication_style || 'Not available'}
Attachment Patterns: ${input.attachment_patterns || 'Not available'}
Dating Goal: ${input.dating_goal || 'Not specified'}
What They Look For: ${input.what_to_look_for?.join(', ') || 'Not specified'}
What They Avoid: ${input.what_to_avoid?.join(', ') || 'Not specified'}
Growth Areas: ${input.growth_areas?.join(', ') || 'Not specified'}
Strengths: ${input.strengths?.join(', ') || 'Not specified'}
Photo Analysis: ${input.photo_analysis || 'Not available'}
Behavioral Data: ${input.behavioral_data || 'Not available'}
`.trim();

  const prompt = USER_VIRTUES_11_PROMPT.replace('{user_profile_data}', profileData);

  const result = await callAnthropicForObject<{
    scores: VirtueScore11[];
    realm_summary: {
      biological: string;
      emotional: string;
      cerebral: string;
    };
  }>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.USER_ASPECTS, // Reuse same limit
  });

  // Return as UserVirtueProfile with timestamp
  return {
    scores: result.scores,
    realm_summary: result.realm_summary,
    lastUpdated: new Date(),
  };
}

/**
 * Score a match on the 11 Virtues and calculate compatibility with user.
 * Returns the full MatchVirtueCompatibility including verdicts and critical issues.
 */
export async function scoreMatchVirtues11(
  matchAnalysis: ProfileAnalysis,
  userVirtueProfile: UserVirtueProfile
): Promise<MatchVirtueCompatibility> {
  if (!userVirtueProfile || !userVirtueProfile.scores || userVirtueProfile.scores.length === 0) {
    console.log('src/lib/ai.ts: No user virtue profile provided, skipping 11 Virtues scoring');
    throw new Error('User virtue profile required for match scoring');
  }

  console.log('src/lib/ai.ts: Scoring match virtues (11 Virtues system)...');

  // Format user virtues for the prompt
  const userVirtuesText = userVirtueProfile.scores
    .map(s => `${s.virtue_id}: ${s.score}/100${s.evidence ? ` (${s.evidence})` : ''}`)
    .join('\n');

  const userVirtuesFormatted = `
Scores:
${userVirtuesText}

Realm Summary:
- Biological: ${userVirtueProfile.realm_summary?.biological || 'Not available'}
- Emotional: ${userVirtueProfile.realm_summary?.emotional || 'Not available'}
- Cerebral: ${userVirtueProfile.realm_summary?.cerebral || 'Not available'}
`.trim();

  // Format match analysis for the prompt
  const psych = matchAnalysis.psychological_profile;
  const photoVibes = matchAnalysis.photos?.map(p => `${p.vibe}: ${p.subtext}`).join('; ') || 'Not available';
  const promptsText = matchAnalysis.prompts?.map(p => `Q: ${p.question}\nA: ${p.answer}\nAnalysis: ${p.analysis}`).join('\n\n') || 'Not available';
  const agendasText = psych?.agendas?.map(a => `${a.type} (${a.priority}): ${a.evidence}`).join('; ') || 'Not analyzed';

  const matchAnalysisText = `
Basics: ${matchAnalysis.basics?.name || 'Unknown'}, ${matchAnalysis.basics?.age || '?'} years old
Location: ${matchAnalysis.basics?.location || 'Unknown'}
Job: ${matchAnalysis.basics?.job || 'Unknown'}

Archetype: ${psych?.archetype_summary || 'Not available'}
Agendas: ${agendasText}
Presentation Tactics: ${psych?.presentation_tactics?.join(', ') || 'Not analyzed'}
Predicted Tactics: ${psych?.predicted_tactics?.join(', ') || 'Not analyzed'}

Subtext Analysis:
- Sexual Signaling: ${psych?.subtext_analysis?.sexual_signaling || 'Not available'}
- Power Dynamics: ${psych?.subtext_analysis?.power_dynamics || 'Not available'}
- Vulnerability: ${psych?.subtext_analysis?.vulnerability_indicators || 'Not available'}
- Disconnect: ${psych?.subtext_analysis?.disconnect || 'Not available'}

Photo Vibes: ${photoVibes}

Prompts:
${promptsText}
`.trim();

  const prompt = MATCH_VIRTUES_11_PROMPT
    .replace('{user_virtues}', userVirtuesFormatted)
    .replace('{match_name}', matchAnalysis.basics?.name || 'Unknown')
    .replace('{match_analysis}', matchAnalysisText);

  // Get raw scores from AI
  const aiResult = await callAnthropicForObject<{
    scores: VirtueScore11[];
  }>({
    messages: [textContent(prompt)],
    maxTokens: TOKEN_LIMITS.MATCH_ASPECTS, // Reuse same limit
  });

  // Use the local calculation function for consistent verdict logic
  // This ensures verdicts match the delta tolerance rules exactly
  return calculateMatchCompatibility(userVirtueProfile, aiResult.scores);
}

// --- STREAMING PROFILE ANALYSIS ---

export { createInitialAccumulatedProfile };
export type { AccumulatedProfile };

export interface StreamingAnalysisCallbacks {
  onChunkComplete?: (
    chunkIndex: number,
    profile: AccumulatedProfile,
    latency: number
  ) => void;
  onError?: (error: Error, chunkIndex: number) => void;
  signal?: AbortSignal;
  /** Pre-computed frame quality hints to help AI select better thumbnails */
  frameQualityHints?: string;
}

/**
 * Analyze profile in streaming chunks.
 * Returns results incrementally via onChunkComplete callback.
 *
 * @param frameChunks Array of frame arrays (typically 4 chunks of 4 frames)
 * @param callbacks Callbacks for progress updates
 * @returns Final accumulated profile
 */
export async function analyzeProfileStreaming(
  frameChunks: string[][],
  callbacks?: StreamingAnalysisCallbacks
): Promise<AccumulatedProfile> {
  console.log(`ai.ts: Starting streaming analysis with ${frameChunks.length} chunks`);

  let profile = createInitialAccumulatedProfile();
  profile.meta.totalChunks = frameChunks.length;

  // Process each chunk sequentially (context builds on previous chunks)
  for (let i = 0; i < frameChunks.length; i++) {
    // Check for abort
    if (callbacks?.signal?.aborted) {
      console.log('ai.ts: Streaming analysis aborted');
      break;
    }

    const chunkFrames = frameChunks[i];
    const startTime = Date.now();

    console.log(`ai.ts: Processing chunk ${i + 1}/${frameChunks.length} with ${chunkFrames.length} frames`);

    try {
      switch (i) {
        case 0:
          profile = await processChunk1Basics(chunkFrames, profile, callbacks?.signal, callbacks?.frameQualityHints);
          break;
        case 1:
          profile = await processChunk2Impressions(chunkFrames, profile, callbacks?.signal);
          break;
        case 2:
          profile = await processChunk3Observations(chunkFrames, profile, callbacks?.signal);
          break;
        case 3:
        default:
          profile = await processChunk4Flags(chunkFrames, profile, callbacks?.signal);
          break;
      }

      const latency = Date.now() - startTime;
      console.log(`ai.ts: Chunk ${i + 1} complete in ${latency}ms`);

      if (callbacks?.onChunkComplete) {
        callbacks.onChunkComplete(i, profile, latency);
      }
    } catch (error) {
      console.error(`ai.ts: Chunk ${i + 1} failed:`, error);
      if (callbacks?.onError) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)), i);
      }
      // Continue with remaining chunks even if one fails
    }
  }

  // Mark as quick analysis complete
  profile.meta.phase = 'quick';

  return profile;
}

// --- Chunk Processing Functions ---

async function processChunk1Basics(
  frames: string[],
  profile: AccumulatedProfile,
  signal?: AbortSignal,
  frameQualityHints?: string
): Promise<AccumulatedProfile> {
  // Build prompt with frame quality hints if available
  const hintsSection = frameQualityHints
    ? `FRAME QUALITY HINTS (from automated analysis):
${frameQualityHints}`
    : '';

  const prompt = CHUNK_1_BASICS_PROMPT.replace('{frame_quality_hints}', hintsSection);

  const messages: MessageContent[] = [
    ...frames.map((frame) => imageContent(frame)),
    textContent(prompt),
  ];

  const result = await callAnthropicForObject<ChunkBasicsResult>({
    messages,
    maxTokens: 500,
    signal,
    timeout: 30000,
  });

  return mergeChunkBasics(profile, result);
}

async function processChunk2Impressions(
  frames: string[],
  profile: AccumulatedProfile,
  signal?: AbortSignal
): Promise<AccumulatedProfile> {
  // Build context from chunk 1
  const basicsContext = `
Name: ${profile.identity.name || 'Unknown'}
Age: ${profile.identity.age || 'Unknown'}
Location: ${profile.identity.location || 'Unknown'}
Job: ${profile.identity.job || 'Unknown'}
App: ${profile.identity.app || 'Unknown'}
`.trim();

  const prompt = CHUNK_2_IMPRESSIONS_PROMPT.replace('{basics_context}', basicsContext);

  const messages: MessageContent[] = [
    ...frames.map((frame) => imageContent(frame)),
    textContent(prompt),
  ];

  const result = await callAnthropicForObject<ChunkImpressionsResult>({
    messages,
    maxTokens: 800,
    signal,
    timeout: 30000,
  });

  return mergeChunkImpressions(profile, result);
}

async function processChunk3Observations(
  frames: string[],
  profile: AccumulatedProfile,
  signal?: AbortSignal
): Promise<AccumulatedProfile> {
  // Build accumulated context
  const accumulatedContext = `
IDENTITY:
- Name: ${profile.identity.name || 'Unknown'}
- Age: ${profile.identity.age || 'Unknown'}
- Location: ${profile.identity.location || 'Unknown'}
- Job: ${profile.identity.job || 'Unknown'}
- App: ${profile.identity.app || 'Unknown'}

VIBES OBSERVED:
${profile.photos.vibesSummary.map(v => `- ${v}`).join('\n') || '- None yet'}

EMERGING ARCHETYPE:
${profile.psychological.emergingArchetype || 'Still forming...'}

SIGNALS PICKED UP:
${profile.psychological.signals.map(s => `- ${s}`).join('\n') || '- None yet'}
`.trim();

  const prompt = CHUNK_3_OBSERVATIONS_PROMPT.replace('{accumulated_context}', accumulatedContext);

  const messages: MessageContent[] = [
    ...frames.map((frame) => imageContent(frame)),
    textContent(prompt),
  ];

  const result = await callAnthropicForObject<ChunkObservationsResult>({
    messages,
    maxTokens: 1500,
    signal,
    timeout: 45000,
  });

  return mergeChunkObservations(profile, result);
}

async function processChunk4Flags(
  frames: string[],
  profile: AccumulatedProfile,
  signal?: AbortSignal
): Promise<AccumulatedProfile> {
  // Build full context for final analysis
  const photoDescriptions = profile.photos.analyses
    .map((p, i) => `Photo ${i + 1}: ${p.vibe} - ${p.subtext}`)
    .join('\n');

  const promptResponses = profile.prompts.found
    .map(p => `Q: ${p.question}\nA: ${p.answer}\nAnalysis: ${p.analysis}`)
    .join('\n\n');

  const fullContext = `
IDENTITY:
- Name: ${profile.identity.name || 'Unknown'}
- Age: ${profile.identity.age || 'Unknown'}
- Location: ${profile.identity.location || 'Unknown'}
- Job: ${profile.identity.job || 'Unknown'}
- App: ${profile.identity.app || 'Unknown'}

PHOTO ANALYSES:
${photoDescriptions || 'None captured yet'}

PROMPT RESPONSES:
${promptResponses || 'None found'}

VIBES:
${profile.photos.vibesSummary.join(', ') || 'None'}

EMERGING ARCHETYPE (${profile.psychological.confidenceLevel}% confidence):
${profile.psychological.emergingArchetype || 'Unknown'}

PSYCHOLOGICAL SIGNALS:
${profile.psychological.signals.map(s => `- ${s}`).join('\n') || '- None'}
`.trim();

  const prompt = CHUNK_4_FLAGS_PROMPT.replace('{full_context}', fullContext);

  const messages: MessageContent[] = [
    ...frames.map((frame) => imageContent(frame)),
    textContent(prompt),
  ];

  const result = await callAnthropicForObject<ChunkFlagsResult>({
    messages,
    maxTokens: 1500,
    signal,
    timeout: 45000,
  });

  return mergeChunkFlags(profile, result);
}

/**
 * Convert AccumulatedProfile to ProfileAnalysis format for storage.
 * This maps the streaming format to the existing database format.
 */
export function accumulatedToProfileAnalysis(accumulated: AccumulatedProfile): ProfileAnalysis {
  return {
    meta: {
      app_name: accumulated.identity.app || undefined,
      best_photo_index: accumulated.photos.thumbnailIndex,
    },
    basics: {
      name: accumulated.identity.name || undefined,
      age: accumulated.identity.age || undefined,
      location: accumulated.identity.location || undefined,
      job: accumulated.identity.job || undefined,
    },
    photos: accumulated.photos.analyses.map(p => ({
      description: p.description,
      vibe: p.vibe,
      subtext: p.subtext,
    })),
    prompts: accumulated.prompts.found.map(p => ({
      question: p.question,
      answer: p.answer,
      analysis: p.analysis,
      suggested_opener: p.suggested_opener,
    })),
    psychological_profile: {
      agendas: accumulated.psychological.agendas,
      presentation_tactics: accumulated.psychological.presentationTactics,
      predicted_tactics: accumulated.psychological.predictedTactics,
      subtext_analysis: {
        sexual_signaling: '',
        power_dynamics: '',
        vulnerability_indicators: '',
        disconnect: '',
      },
      archetype_summary: accumulated.psychological.emergingArchetype || '',
    },
    recommended_openers: accumulated.prompts.found
      .filter(p => p.suggested_opener)
      .map(p => ({
        type: 'like_comment' as const,
        message: p.suggested_opener!.message,
        tactic: p.suggested_opener!.tactic,
        why_it_works: p.suggested_opener!.why_it_works,
      })),
    // Include early warnings as a custom field for display
    overall_analysis: {
      summary: accumulated.psychological.emergingArchetype || 'Analysis in progress...',
      green_flags: accumulated.earlyWarnings.greenFlags,
      red_flags: accumulated.earlyWarnings.redFlags,
    },
  };
}

// --- USER PROFILE STREAMING ANALYSIS ---

import {
  USER_CHUNK_1_BASICS_PROMPT,
  USER_CHUNK_2_IMPRESSIONS_PROMPT,
  USER_CHUNK_3_OBSERVATIONS_PROMPT,
  USER_CHUNK_4_SYNTHESIS_PROMPT,
} from './prompts';
import {
  type AccumulatedUserProfile,
  type UserChunkBasicsResult,
  type UserChunkImpressionsResult,
  type UserChunkObservationsResult,
  type UserChunkSynthesisResult,
  createInitialAccumulatedUserProfile,
  mergeUserChunkBasics,
  mergeUserChunkImpressions,
  mergeUserChunkObservations,
  mergeUserChunkSynthesis,
} from './streaming/userTypes';

export interface UserStreamingCallbacks {
  onChunkComplete?: (chunkIndex: number, profile: AccumulatedUserProfile, latency: number) => void;
  onError?: (error: Error, chunkIndex: number) => void;
  signal?: AbortSignal;
  frameQualityHints?: string;
}

/**
 * Streaming analysis for USER profile (self-analysis)
 * Processes frames in 4 chunks for progressive UI updates
 */
export async function analyzeUserProfileStreaming(
  frameChunks: string[][],
  callbacks?: UserStreamingCallbacks
): Promise<AccumulatedUserProfile> {
  console.log(`ai.ts: Starting user streaming analysis with ${frameChunks.length} chunks`);

  let profile = createInitialAccumulatedUserProfile();
  profile.meta.totalChunks = frameChunks.length;

  // Process each chunk sequentially (context builds on previous chunks)
  for (let i = 0; i < frameChunks.length; i++) {
    // Check for abort
    if (callbacks?.signal?.aborted) {
      console.log('ai.ts: User streaming analysis aborted');
      break;
    }

    const chunkFrames = frameChunks[i];
    const startTime = Date.now();

    console.log(`ai.ts: Processing user chunk ${i + 1}/${frameChunks.length} with ${chunkFrames.length} frames`);

    try {
      switch (i) {
        case 0:
          profile = await processUserChunk1Basics(chunkFrames, profile, callbacks?.signal, callbacks?.frameQualityHints);
          break;
        case 1:
          profile = await processUserChunk2Impressions(chunkFrames, profile, callbacks?.signal);
          break;
        case 2:
          profile = await processUserChunk3Observations(chunkFrames, profile, callbacks?.signal);
          break;
        case 3:
        default:
          profile = await processUserChunk4Synthesis(chunkFrames, profile, callbacks?.signal);
          break;
      }

      const latency = Date.now() - startTime;
      console.log(`ai.ts: User chunk ${i + 1} complete in ${latency}ms`);

      if (callbacks?.onChunkComplete) {
        callbacks.onChunkComplete(i, profile, latency);
      }
    } catch (error) {
      console.error(`ai.ts: User chunk ${i + 1} failed:`, error);
      if (callbacks?.onError) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)), i);
      }
      // Continue with remaining chunks even if one fails
    }
  }

  // Mark as quick analysis complete
  profile.meta.phase = 'quick';

  return profile;
}

// --- User Chunk Processing Functions ---

async function processUserChunk1Basics(
  frames: string[],
  profile: AccumulatedUserProfile,
  signal?: AbortSignal,
  frameQualityHints?: string
): Promise<AccumulatedUserProfile> {
  const hintsSection = frameQualityHints
    ? `FRAME QUALITY HINTS (from automated analysis):
${frameQualityHints}`
    : '';

  const prompt = USER_CHUNK_1_BASICS_PROMPT.replace('{frame_quality_hints}', hintsSection);

  const messages: MessageContent[] = [
    ...frames.map((frame) => imageContent(frame)),
    textContent(prompt),
  ];

  const result = await callAnthropicForObject<UserChunkBasicsResult>({
    messages,
    maxTokens: 600,
    signal,
    timeout: 30000,
  });

  return mergeUserChunkBasics(profile, result);
}

async function processUserChunk2Impressions(
  frames: string[],
  profile: AccumulatedUserProfile,
  signal?: AbortSignal
): Promise<AccumulatedUserProfile> {
  const basicsContext = `
Name: ${profile.identity.name || 'Unknown'}
Age: ${profile.identity.age || 'Unknown'}
Location: ${profile.identity.location || 'Unknown'}
Occupation: ${profile.identity.occupation || 'Unknown'}
Initial Vibes: ${profile.photos.vibesSummary.join(', ') || 'None observed yet'}
`.trim();

  const prompt = USER_CHUNK_2_IMPRESSIONS_PROMPT.replace('{basics_context}', basicsContext);

  const messages: MessageContent[] = [
    ...frames.map((frame) => imageContent(frame)),
    textContent(prompt),
  ];

  const result = await callAnthropicForObject<UserChunkImpressionsResult>({
    messages,
    maxTokens: 800,
    signal,
    timeout: 30000,
  });

  return mergeUserChunkImpressions(profile, result);
}

async function processUserChunk3Observations(
  frames: string[],
  profile: AccumulatedUserProfile,
  signal?: AbortSignal
): Promise<AccumulatedUserProfile> {
  const accumulatedContext = `
IDENTITY:
- Name: ${profile.identity.name || 'Unknown'}
- Age: ${profile.identity.age || 'Unknown'}
- Location: ${profile.identity.location || 'Unknown'}
- Occupation: ${profile.identity.occupation || 'Unknown'}

VIBES OBSERVED:
${profile.photos.vibesSummary.map(v => `- ${v}`).join('\n') || '- None yet'}

EMERGING ARCHETYPE:
${profile.psychological.archetype || 'Still forming...'}

STRENGTHS IDENTIFIED:
${profile.behavioral.strengths.map(s => `- ${s}`).join('\n') || '- None yet'}
`.trim();

  const prompt = USER_CHUNK_3_OBSERVATIONS_PROMPT.replace('{accumulated_context}', accumulatedContext);

  const messages: MessageContent[] = [
    ...frames.map((frame) => imageContent(frame)),
    textContent(prompt),
  ];

  const result = await callAnthropicForObject<UserChunkObservationsResult>({
    messages,
    maxTokens: 1500,
    signal,
    timeout: 45000,
  });

  return mergeUserChunkObservations(profile, result);
}

async function processUserChunk4Synthesis(
  frames: string[],
  profile: AccumulatedUserProfile,
  signal?: AbortSignal
): Promise<AccumulatedUserProfile> {
  const fullContext = `
IDENTITY:
- Name: ${profile.identity.name || 'Unknown'}
- Age: ${profile.identity.age || 'Unknown'}
- Location: ${profile.identity.location || 'Unknown'}
- Occupation: ${profile.identity.occupation || 'Unknown'}

VIBES:
${profile.photos.vibesSummary.map(v => `- ${v}`).join('\n') || '- None observed'}

ARCHETYPE (so far):
${profile.psychological.archetype || 'Unknown'}

PRESENTATION TACTICS USED:
${profile.psychological.presentationTactics.map(t => `- ${t}`).join('\n') || '- None identified'}

PHOTOS ANALYZED:
${profile.photos.analyses.map((p, i) => `${i + 1}. ${p.vibe}: ${p.description}`).join('\n') || 'None'}

SUBTEXT ANALYSIS:
- Sexual signaling: ${profile.psychological.subtextAnalysis.sexual_signaling || 'Not assessed'}
- Power dynamics: ${profile.psychological.subtextAnalysis.power_dynamics || 'Not assessed'}
- Vulnerability: ${profile.psychological.subtextAnalysis.vulnerability_indicators || 'Not assessed'}
- Disconnect: ${profile.psychological.subtextAnalysis.disconnect || 'None noted'}

STRENGTHS IDENTIFIED:
${profile.behavioral.strengths.map(s => `- ${s}`).join('\n') || '- None yet'}

COMMUNICATION HINTS:
${profile.behavioral.communicationStyle || 'Not assessed'}
`.trim();

  const prompt = USER_CHUNK_4_SYNTHESIS_PROMPT.replace('{full_context}', fullContext);

  const messages: MessageContent[] = [
    ...frames.map((frame) => imageContent(frame)),
    textContent(prompt),
  ];

  const result = await callAnthropicForObject<UserChunkSynthesisResult>({
    messages,
    maxTokens: 2000,
    signal,
    timeout: 60000,
  });

  return mergeUserChunkSynthesis(profile, result);
}

/**
 * Convert accumulated user profile to UserSynthesis format for storage
 */
export function accumulatedUserToSynthesis(accumulated: AccumulatedUserProfile): {
  basics: { name?: string; age?: number; occupation?: string; location?: string };
  photos: Array<{ description: string; vibe: string; subtext: string; attractiveness_notes?: string }>;
  psychological_profile: {
    agendas: Array<{ type: string; evidence: string; priority: 'primary' | 'secondary' }>;
    presentation_tactics: string[];
    predicted_tactics: string[];
    subtext_analysis: {
      sexual_signaling: string;
      power_dynamics: string;
      vulnerability_indicators: string;
      disconnect: string;
    };
    archetype_summary: string;
  };
  behavioral_insights: {
    communication_style: string;
    attachment_patterns: string;
    attachment_confidence: number;
    growth_areas: string[];
    strengths: string[];
  };
  dating_strategy: {
    ideal_partner_profile: string;
    what_to_look_for: string[];
    what_to_avoid: string[];
    bio_suggestions: string[];
    opener_style_recommendations: string[];
  };
} {
  return {
    basics: {
      name: accumulated.identity.name || undefined,
      age: accumulated.identity.age || undefined,
      occupation: accumulated.identity.occupation || undefined,
      location: accumulated.identity.location || undefined,
    },
    photos: accumulated.photos.analyses,
    psychological_profile: {
      agendas: accumulated.psychological.agendas,
      presentation_tactics: accumulated.psychological.presentationTactics,
      predicted_tactics: accumulated.psychological.predictedTactics,
      subtext_analysis: accumulated.psychological.subtextAnalysis,
      archetype_summary: accumulated.psychological.archetype || 'Analysis in progress...',
    },
    behavioral_insights: {
      communication_style: accumulated.behavioral.communicationStyle || '',
      attachment_patterns: accumulated.behavioral.attachmentPatterns || '',
      attachment_confidence: accumulated.behavioral.attachmentConfidence,
      growth_areas: accumulated.behavioral.growthAreas,
      strengths: accumulated.behavioral.strengths,
    },
    dating_strategy: {
      ideal_partner_profile: accumulated.dating.idealPartnerProfile || '',
      what_to_look_for: accumulated.dating.whatToLookFor,
      what_to_avoid: accumulated.dating.whatToAvoid,
      bio_suggestions: accumulated.dating.bioSuggestions,
      opener_style_recommendations: accumulated.dating.openerStyleRecommendations,
    },
  };
}

export { createInitialAccumulatedUserProfile, type AccumulatedUserProfile };
