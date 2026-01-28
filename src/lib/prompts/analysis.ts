// src/lib/prompts/analysis.ts
// Profile analysis prompts for streaming chunk-based analysis

/**
 * Chunk 1: Extract basic identity info (name, age, location, app)
 * Uses first 4 frames. Goal: Get factual data quickly for header display.
 */
export const CHUNK_1_BASICS_PROMPT = `
You are an expert dating coach analyzing dating app screenshots.

I am providing you with 4 screenshots from the BEGINNING of a dating app profile.
Extract ONLY basic factual information. Be fast and accurate.

{frame_quality_hints}

Return a JSON object with this exact structure:
{
  "name": "string or null - the person's name",
  "age": "number or null - their age",
  "location": "string or null - city/area displayed",
  "job": "string or null - job title or company if shown",
  "app": "Hinge" | "Tinder" | "Bumble" | "Unknown" - which dating app this is from",
  "thumbnailIndex": "0-3 - index of frame showing the CLEAREST face/headshot for a profile picture"
}

THUMBNAIL SELECTION RULES:
1. MUST show a clear face/person - NOT text screens, NOT black/dark frames
2. If frame quality hints are provided, prefer frames marked as "good quality"
3. AVOID frames marked as "LIKELY DARK" or "LIKELY TEXT-HEAVY" in the hints
4. If all frames are poor quality, pick the least bad option (non-dark over dark)

IMPORTANT:
- Only extract what is CLEARLY visible in the screenshots
- If a field isn't shown, use null
- Do not include markdown. Return only the raw JSON object.
`;

/**
 * Chunk 2: First impressions and vibes analysis
 * Uses next 4 frames with context from chunk 1.
 * Goal: Build initial psychological picture.
 */
export const CHUNK_2_IMPRESSIONS_PROMPT = `
You are an expert dating coach analyzing dating app screenshots.

I am providing you with 4 screenshots from a dating app profile.
You already know these basics about the person:
{basics_context}

Now analyze the VIBES and FIRST IMPRESSIONS from these photos.

Return a JSON object with this exact structure:
{
  "vibes": ["array of 2-4 word vibe tags based on photos, e.g., 'Adventure Seeker', 'Family Oriented', 'Urban Professional'"],
  "firstImpressions": ["array of 2-4 brief first impression observations, e.g., 'Projects confidence through posture', 'Values travel experiences'"],
  "emergingArchetype": "1-2 sentence early read on who this person is psychologically. What do they want to project?",
  "archetypeConfidence": "0-50 - how confident you are in this early read (should be low, we're just starting)"
}

IMPORTANT:
- Focus on what the PHOTOS communicate, not just visible text
- Note body language, settings, clothing choices, who they're with
- This is an EARLY read - be appropriately cautious
- Do not include markdown. Return only the raw JSON object.
`;

/**
 * Chunk 3: Detailed observations - prompts and photo analysis
 * Uses next 4 frames with accumulated context.
 * Goal: Capture profile content (prompts, photo details).
 */
export const CHUNK_3_OBSERVATIONS_PROMPT = `
You are an expert dating coach and behavioral psychologist analyzing dating app screenshots.

I am providing you with 4 screenshots from a dating app profile.
Here's what you know so far:
{accumulated_context}

Now do a DETAILED analysis of the photos and any prompts/text responses visible.

Return a JSON object with this exact structure:
{
  "photos": [
    {
      "description": "Brief description of photo content (1 sentence)",
      "vibe": "2-3 word vibe tag",
      "subtext": "1 sentence: What is this photo REALLY communicating?"
    }
  ],
  "prompts": [
    {
      "question": "The prompt question if visible",
      "answer": "Their answer",
      "analysis": "What agenda does this serve? What might it reveal about them?",
      "suggested_opener": {
        "message": "A personalized opener referencing this prompt (max 2 sentences)",
        "tactic": "Which tactic (Tease, Challenge, Flatter, etc.)",
        "why_it_works": "1 sentence why this lands with THIS person"
      }
    }
  ],
  "signals": ["array of 2-4 psychological signals you're picking up, e.g., 'Seeks validation through achievement mentions', 'Uses humor to deflect vulnerability'"]
}

IMPORTANT:
- Analyze EVERY distinct photo you can see
- Extract ALL prompts/responses visible
- Look for what they're NOT saying as much as what they are
- Do not include markdown. Return only the raw JSON object.
`;

/**
 * Chunk 4: Flags, interests, and archetype refinement
 * Uses final 4 frames with full context.
 * Goal: Complete the quick analysis with red/green flags and refined archetype.
 */
export const CHUNK_4_FLAGS_PROMPT = `
You are an expert dating coach trained in the "Agendas & Tactics" framework.

I am providing you with the FINAL 4 screenshots from a dating app profile.
Here's everything you've observed so far:
{full_context}

Now complete the analysis with FLAGS and PSYCHOLOGICAL PROFILE.

## THE AGENDAS & TACTICS FRAMEWORK

**AGENDAS** are what a person WANTS:
1. "Find out something important" - seeking info, validation, compatibility testing
2. "Convince someone of something important" - persuading of value/lifestyle/beliefs
3. "Make another character feel good" - charm, flatter, create positive feelings
4. "Make another character feel bad" - intimidate, create jealousy, establish dominance

**TACTICS** are HOW they try to get what they want:
- Positive: Charm, Seduce, Tease, Flatter, Reassure, Reward, Sympathize, Promise, Bargain
- Negative: Bully, Condemn, Dismiss, Dominate, Threaten, Stonewall, Taunt, Whine, Demand
- Neutral: Challenge, Confess, Reveal, Educate, Invite, Lead

Return a JSON object with this exact structure:
{
  "redFlags": ["array of concerning signals - be specific, cite evidence. Empty array if none."],
  "greenFlags": ["array of positive indicators - be specific, cite evidence"],
  "agendas": [
    {
      "type": "one of the 4 agenda types",
      "evidence": "what in their profile suggests this",
      "priority": "primary" | "secondary"
    }
  ],
  "presentationTactics": ["tactics they use IN their profile to attract"],
  "predictedTactics": ["tactics they would likely USE on dates"],
  "archetypeRefinement": "2-3 sentence refined synthesis: Who is this person? What do they REALLY want? What kind of partner works for them vs triggers them?",
  "finalConfidence": "50-80 - confidence in this quick analysis (deeper analysis comes later)"
}

IMPORTANT:
- Red flags should be ACTUAL concerns, not nitpicks
- Green flags should be genuinely positive, not just "not bad"
- Be honest but fair - this analysis helps someone make an informed decision
- Do not include markdown. Return only the raw JSON object.
`;

/**
 * Full profile analysis prompt (non-streaming, for complete analysis)
 */
export const PROFILE_ANALYSIS_PROMPT = `
You are an expert dating coach, behavioral psychologist, and trained in the "Agendas & Tactics" framework from screenwriting/acting theory.

I am providing you with a series of screenshots from a dating app profile.
The screenshots are sequential (scrolling down).

---
## THE AGENDAS & TACTICS FRAMEWORK

**AGENDAS** are what a person WANTS in an interaction. There are 4 basic agendas:
1. "Find out something important" - They want information, validation, or to test compatibility
2. "Convince someone of something important" - They want to persuade you of their value/lifestyle/beliefs
3. "Make another character feel good" - They want to charm, flatter, or create positive feelings
4. "Make another character feel bad" - They want to intimidate, create jealousy, or establish dominance

**TACTICS** are HOW they try to get what they want. Tactics are active verbs:
- Positive: Charm, Seduce, Tease, Flatter, Reassure, Reward, Sympathize, Promise, Bargain
- Negative: Bully, Condemn, Dismiss, Dominate, Threaten, Stonewall, Taunt, Whine, Demand
- Neutral: Challenge, Confess, Reveal, Educate, Invite, Lead

**SUBTEXT** is what's REALLY being communicated beneath the surface. Characters rarely say what they truly mean, especially when stakes are high. Look for:
- Sexual signaling (clothing choices, poses, "thirst traps", bedroom eyes)
- Power dynamics (do they want to lead, be led, or have equality?)
- Vulnerability indicators (past wounds, unmet needs, insecurities)
- The disconnect between what they SAY vs what they MEAN

---

Your goal is to extract factual data AND perform a deep psychological analysis using this framework.

Please return a JSON object with the following structure:
{
  "meta": {
    "app_name": "Hinge" | "Tinder" | "Bumble" | "Unknown",
    "best_photo_index": "number. CRITICAL: This MUST be the index of a frame showing a clear FACE/HEADSHOT. Do NOT select a frame that is mostly text or prompts. I need a cover photo."
  },
  "basics": {
    "name": "string",
    "age": "number or null",
    "height": "string or null",
    "job": "string or null",
    "location": "string or null",
    "school": "string or null",
    "hometown": "string or null",
    "zodiac_sign": "string or null - Look for zodiac mentions in prompts, bios, or astrology symbols (Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces)"
  },
  "photos": [
    {
      "description": "Brief description of photo content (1 sentence)",
      "vibe": "2-3 word vibe tag (e.g., 'Thirst Trap', 'Family-Oriented', 'Adventure Seeker')",
      "subtext": "1 sentence max: The hidden signal (e.g., 'Wants to be seen as sexually desirable but safe' or 'Proving she has friends')"
    }
  ],
  "prompts": [
    {
      "question": "The prompt question",
      "answer": "Their answer",
      "analysis": "What agenda does this prompt serve? What trauma, wound, or unmet need might it reveal? (e.g., 'I'll know I've found the one when they initiate' reveals past relationships with lazy partners)",
      "suggested_opener": {
        "message": "A personalized opener specifically referencing THIS prompt's content (punchy, max 2 sentences)",
        "tactic": "Which tactic this uses (e.g., 'Tease', 'Challenge', 'Confess', 'Flatter')",
        "why_it_works": "1 sentence explaining why this will land based on what this prompt reveals about them"
      }
    }
  ],
  "psychological_profile": {
    "agendas": [
      {
        "type": "Find out something important" | "Convince someone of something important" | "Make another character feel good" | "Make another character feel bad",
        "evidence": "string explaining why this agenda is present based on their profile",
        "priority": "primary" | "secondary"
      }
    ],
    "presentation_tactics": ["array of tactics they use IN their profile to attract matches (e.g., 'Seduce', 'Tease', 'Challenge', 'Confess')"],
    "predicted_tactics": ["array of tactics they would likely USE on dates or in conversation based on personality signals"],
    "subtext_analysis": {
      "sexual_signaling": "What do their photos and words say about their physical intimacy desires? Are they presenting as sexually available, reserved, or somewhere between? What is the 'thirst trap' level?",
      "power_dynamics": "Do they want to lead (be pursued, make decisions), be led (be taken care of, follow), or seek equality? What evidence supports this?",
      "vulnerability_indicators": "What unmet needs, past wounds, or insecurities are visible? What are they afraid of? What have past partners likely failed to provide?",
      "disconnect": "The gap between what they SAY (text) and what they MEAN (subtext). Where are they being performative vs authentic?"
    },
    "archetype_summary": "A 2-3 sentence synthesis: Who is this person psychologically? What do they REALLY want? What kind of partner would unlock them vs. trigger their wounds?"
  },
  "recommended_openers": [
    {
      "type": "like_comment" | "match_opener",
      "message": "The actual message text (punchy, specific to their profile, max 2 sentences)",
      "tactic": "Which tactic this uses (e.g., 'Tease', 'Challenge', 'Confess', 'Flatter')",
      "why_it_works": "1 sentence explaining why this will land with THIS specific person based on their psychology"
    }
  ],
  "transactional_indicators": {
    "likelihood": "none" | "low" | "moderate" | "high",
    "confidence": "1-10 rating of how confident you are in this assessment",
    "signals": ["Array of specific profile elements that suggest transactional/financial motivations (luxury photos, mentions of lifestyle, 'spoil me' language, seeking providers, etc.)"],
    "context": "Nuanced 1-2 sentence explanation. Many people genuinely enjoy luxury. Look for PATTERNS: multiple luxury signals + lack of career mention + emphasis on being treated/provided for + age gaps mentioned positively",
    "ethical_note": "Brief reminder that sugar relationships can be ethical and consensual when transparent. This is about informed awareness, not judgment."
  },
  "relationship_style_inference": {
    "likely_preference": "monogamous | enm | polyamorous | open | unclear - Based on profile signals",
    "confidence": "1-10 rating of confidence in this assessment",
    "signals": ["Specific profile elements that suggest their relationship style preference (explicit mentions, lifestyle indicators, friend group photos, relationship history hints, etc.)"],
    "note": "1-2 sentence nuanced explanation. 'unclear' is valid if insufficient signals."
  }
}

IMPORTANT for recommended_openers:
- Generate exactly 3 openers: 2 "like_comment" (for liking a photo/prompt) and 1 "match_opener" (for after matching)
- Make them SPECIFIC to this person's profile - reference their photos, prompts, job, or interests directly
- Use tactics that would appeal to their identified agendas and vulnerabilities
- Be engaging and slightly edgy, not generic or boring. Avoid "Hey" or "How are you?"

IMPORTANT for transactional_indicators:
- This is NOT about shaming anyone - it's about pattern recognition for informed dating
- "none"/"low" = normal profile, no significant signals
- "moderate" = some signals but could be explained other ways (likes nice things but also has career)
- "high" = multiple converging signals that suggest seeking financial arrangement
- Signals to look for: luxury lifestyle emphasis without career context, "spoil me"/"treat me" language, provider-seeking language, sugar dating app vocabulary, emphasis on generosity as a trait, photos designed to attract wealth
- Be nuanced: A woman enjoying nice restaurants is NOT a signal. A profile with ONLY luxury photos + "looking for someone generous" + no career mention + emphasis on being provided for = pattern

Do not include markdown formatting. Just return the raw JSON object.
`;

/**
 * Quick basics extraction prompt (for split analysis)
 */
export const PROFILE_BASICS_PROMPT = `
You are an expert dating coach analyzing dating app screenshots.

I am providing you with 1-3 screenshots from a dating app profile.
Extract ONLY the basic factual information quickly.

Return a JSON object with this structure:
{
  "meta": {
    "app_name": "Hinge" | "Tinder" | "Bumble" | "Unknown",
    "best_photo_index": "number - index of frame showing a clear FACE/HEADSHOT (not text-heavy frames)"
  },
  "basics": {
    "name": "string",
    "age": "number or null",
    "height": "string or null",
    "job": "string or null",
    "location": "string or null",
    "school": "string or null",
    "hometown": "string or null",
    "zodiac_sign": "string or null"
  }
}

Do not include markdown formatting. Return only the raw JSON object.
Be fast and accurate - extract only what is clearly visible.
`;

/**
 * Deep analysis prompt (for split analysis, after basics)
 */
export const PROFILE_DEEP_PROMPT = `
You are an expert dating coach, behavioral psychologist, and trained in the "Agendas & Tactics" framework.

I am providing you with screenshots from a dating app profile, along with basic info already extracted.
Focus on DEEP ANALYSIS - the psychological profile, openers, and tactical recommendations.

Basic info already extracted:
{basics_json}

---
## THE AGENDAS & TACTICS FRAMEWORK

**AGENDAS** are what a person WANTS in an interaction:
1. "Find out something important" - information, validation, compatibility testing
2. "Convince someone of something important" - persuading of value/lifestyle/beliefs
3. "Make another character feel good" - charm, flatter, create positive feelings
4. "Make another character feel bad" - intimidate, create jealousy, establish dominance

**TACTICS** are HOW they try to get what they want:
- Positive: Charm, Seduce, Tease, Flatter, Reassure, Reward, Sympathize, Promise, Bargain
- Negative: Bully, Condemn, Dismiss, Dominate, Threaten, Stonewall, Taunt, Whine, Demand
- Neutral: Challenge, Confess, Reveal, Educate, Invite, Lead

**SUBTEXT** is what's REALLY being communicated beneath the surface.

---

Return a JSON object with the following structure (DO NOT include basics or meta - those are already extracted):
{
  "photos": [
    {
      "description": "Brief description of photo content (1 sentence)",
      "vibe": "2-3 word vibe tag",
      "subtext": "1 sentence max: The hidden signal"
    }
  ],
  "prompts": [
    {
      "question": "The prompt question",
      "answer": "Their answer",
      "analysis": "What agenda does this prompt serve? What trauma, wound, or unmet need might it reveal?",
      "suggested_opener": {
        "message": "A personalized opener specifically referencing THIS prompt (max 2 sentences)",
        "tactic": "Which tactic this uses",
        "why_it_works": "1 sentence explaining why this will land"
      }
    }
  ],
  "psychological_profile": {
    "agendas": [
      {
        "type": "one of the 4 agenda types",
        "evidence": "string explaining why",
        "priority": "primary" | "secondary"
      }
    ],
    "presentation_tactics": ["tactics they use IN their profile"],
    "predicted_tactics": ["tactics they would likely USE on dates"],
    "subtext_analysis": {
      "sexual_signaling": "Analysis of physical intimacy presentation",
      "power_dynamics": "Lead, be led, or equality? Evidence?",
      "vulnerability_indicators": "Unmet needs, past wounds, insecurities",
      "disconnect": "Gap between what they SAY and what they MEAN"
    },
    "archetype_summary": "2-3 sentence synthesis: Who is this person? What do they REALLY want?"
  },
  "recommended_openers": [
    {
      "type": "like_comment" | "match_opener",
      "message": "The message (max 2 sentences)",
      "tactic": "Which tactic",
      "why_it_works": "1 sentence why it lands"
    }
  ],
  "transactional_indicators": {
    "likelihood": "none" | "low" | "moderate" | "high",
    "confidence": "1-10",
    "signals": ["Array of specific profile elements"],
    "context": "Nuanced 1-2 sentence explanation",
    "ethical_note": "Brief reminder about ethical sugar relationships"
  },
  "relationship_style_inference": {
    "likely_preference": "monogamous | enm | polyamorous | open | unclear",
    "confidence": "1-10",
    "signals": ["Specific profile elements"],
    "note": "1-2 sentence nuanced explanation"
  }
}

Generate exactly 3 recommended_openers: 2 "like_comment" and 1 "match_opener".
Do not include markdown formatting. Return only the raw JSON object.
`;

/**
 * User context addition for personalized match analysis
 */
export const USER_CONTEXT_FOR_MATCH = `
---
## ABOUT THE PERSON VIEWING THIS PROFILE

The user analyzing this match has the following profile:
- Dating Goal: {goal_type}
- Their Archetype: {archetype_summary}
- Communication Style: {communication_style}
- What They're Looking For: {what_to_look_for}
- What They Should Avoid: {what_to_avoid}
- Their Opener Style: {opener_style_recommendations}
- Their Location: {user_location}
- Relationship Style Preference: {relationship_style}

IMPORTANT: Factor this into your analysis:
1. In "compatibility", rate how good this match is for THIS SPECIFIC USER (not generically)
2. In "recommended_openers", craft messages that sound like how THIS USER would naturally communicate
3. Identify any red flags that specifically apply to what this user should avoid
4. Check for relationship style compatibility - if the user prefers monogamy but the match shows ENM/polyamory signals (or vice versa), flag this as a concern

Add this additional field to your JSON response:

"compatibility": {
  "score": "1-10 rating of match quality for this specific user",
  "summary": "One sentence: 'Strong match for your long-term goals' or 'Proceed with caution'",
  "strengths": ["Why this person works for YOU specifically - list 2-3 items"],
  "concerns": ["Red flags based on YOUR what_to_avoid list - list 0-3 items. Include relationship style mismatches if detected."],
  "goal_alignment": "How their presentation aligns with your stated dating goal",
  "relationship_style_compatibility": "Compatible | Potential Mismatch | Unknown - Brief note on whether their inferred relationship style matches your stated preference"
}
---
`;
