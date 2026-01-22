// src/lib/ai.ts
import {
  callAnthropicForObject,
  callAnthropicForArray,
  callAnthropicForArraySafe,
  callAnthropicWithDebug,
  textContent,
  imageContent,
  TOKEN_LIMITS,
  type MessageContent,
} from './api';
import {
  PROFILE_ANALYSIS_PROMPT,
  USER_CONTEXT_PROMPT,
  USER_SELF_ANALYSIS_PROMPT,
  USER_CONTEXT_FOR_MATCH,
  ZODIAC_COMPATIBILITY_PROMPT,
  REGENERATE_OPENERS_PROMPT,
  REGENERATE_PROMPT_OPENER_PROMPT,
} from './prompts';
import type { DatingGoals, DataExport, ManualEntry, DateSuggestion, ZodiacCompatibility } from './db';
import type { WeatherForecast } from './weather';

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

  return (
    basePrompt +
    USER_CONTEXT_FOR_MATCH.replace('{goal_type}', userContext.goal_type || 'Not specified')
      .replace('{archetype_summary}', userContext.archetype_summary || 'Not available')
      .replace('{communication_style}', userContext.communication_style || 'Not available')
      .replace('{what_to_look_for}', userContext.what_to_look_for?.join(', ') || 'Not specified')
      .replace('{what_to_avoid}', userContext.what_to_avoid?.join(', ') || 'Not specified')
      .replace('{opener_style_recommendations}', userContext.opener_style_recommendations?.join(', ') || 'Not specified')
      .replace('{user_location}', userContext.location || 'Not specified')
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

  // Add images (limit to 6 photos + 10 video frames = 16 max)
  const photoImages = (input.photos || []).slice(0, 6);
  const frameImages = (input.frames || []).slice(0, 10);
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
