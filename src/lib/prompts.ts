// src/lib/prompts.ts
// Purpose: Stores the text instructions we send to the AI

export const PROFILE_ANALYSIS_PROMPT = `
You are an expert dating coach and behavioral psychologist. 
I am providing you with a series of screenshots from a dating app profile.
The screenshots are sequential (scrolling down).

Your goal is to extract factual data, analyze subtext, AND identify the technical details of the recording.

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
    "hometown": "string or null"
  },
  "photos": [
    {
      "description": "Brief description of photo content",
      "vibe": "What this photo signals (e.g., 'Party animal', 'Close to family')",
      "subtext": "What is the hidden meaning?"
    }
  ],
  "prompts": [
    {
      "question": "The prompt question",
      "answer": "Their answer",
      "analysis": "What this answer reveals about their personality"
    }
  ],
  "overall_analysis": {
    "green_flags": ["list of positives"],
    "red_flags": ["list of concerns"],
    "summary": "A 2-sentence summary of who this person seems to be."
  }
}



Do not include markdown formatting. Just return the raw JSON object.
`;

export const USER_CONTEXT_PROMPT = `
You are a Clinical Psychologist and Expert Dating Strategist.
I am providing you with a raw text dump containing a user's biography, journal entries, and self-descriptions.

Your goal is to perform a "Deep Dive" psychoanalysis to help this user understand themselves ("Nosce Te Ipsum") and identify their ideal partner.

Analyze the provided text and return a JSON object with this structure:
{
  "psychoanalysis": {
    "archetype": "The user's romantic archetype (e.g., 'The Caregiver', 'The Intellectual')",
    "core_values": ["Value 1", "Value 2", "Value 3"],
    "emotional_patterns": "Analysis of their emotional habits and potential blind spots.",
    "strengths": ["List of character strengths"],
    "weaknesses": ["List of areas for growth"]
  },
  "dating_strategy": {
    "target_audience": "Description of the specific type of woman who would be most compatible with and attracted to this user.",
    "what_to_look_for": ["Specific traits/green flags to search for"],
    "what_to_avoid": ["Specific red flags or personality types that would be toxic for this specific user"],
    "bio_suggestions": "3 bullet points on how they should describe themselves in a dating profile."
  }
}

Do not include markdown. Return only the raw JSON.
`;