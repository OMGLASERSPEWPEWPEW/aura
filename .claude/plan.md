# Implementation Plan: Agenda & Tactics Psychological Framework

## Summary
Upgrade the `PROFILE_ANALYSIS_PROMPT` to incorporate the "Agendas & Tactics" psychological framework from screenwriting theory, replacing the current `overall_analysis` with a richer `psychological_profile` section.

## Context
Based on documentation review:
- **Agendas** = What someone wants (4 types: Find out something important, Convince someone, Make them feel good, Make them feel bad)
- **Tactics** = How they try to get it (active verbs: Seduce, Tease, Flatter, Dominate, Bargain, etc.)
- **Subtext** = What's really being communicated beneath the surface (including sexual signaling, power dynamics, vulnerability)

## Changes to `src/lib/prompts.ts`

### 1. Add Framework Context to Prompt Instructions
Insert a section explaining the Agendas & Tactics framework so the AI understands the psychological model it's applying.

### 2. Replace `overall_analysis` with `psychological_profile`
**Old structure:**
```json
"overall_analysis": {
  "green_flags": ["list"],
  "red_flags": ["list"],
  "summary": "string"
}
```

**New structure:**
```json
"psychological_profile": {
  "agendas": [
    {
      "type": "Find out something important" | "Convince someone" | "Make them feel good" | "Make them feel bad",
      "evidence": "string explaining why this agenda is present",
      "priority": "primary" | "secondary"
    }
  ],
  "presentation_tactics": ["array of tactics used IN the profile (e.g., 'Seduce', 'Tease', 'Flatter')"],
  "predicted_tactics": ["array of tactics they would likely USE on dates"],
  "subtext_analysis": {
    "sexual_signaling": "string - what their photos/words say about physical intimacy desires",
    "power_dynamics": "string - do they want to lead, be led, or equal partnership",
    "vulnerability_indicators": "string - what unmet needs or past wounds are visible",
    "disconnect": "string - the gap between what they SAY and what they MEAN"
  },
  "archetype_summary": "string - 2-3 sentence synthesis of who this person is psychologically"
}
```

### 3. Update the Photo Analysis
Enhance the existing `photos[].subtext` field to specifically look for:
- Sexual innuendo / "thirst trap" signals
- Power/vulnerability presentation
- Authentic vs. performed moments

### 4. Update the Prompts Analysis
Enhance `prompts[].analysis` to identify:
- Which agenda each prompt serves
- Trauma signals (like "I'll know I've found the one when..." revealing past hurt)

## Files to Modify
- `src/lib/prompts.ts` - The only file that needs changes

## No Changes Required
- `src/lib/ai.ts` - Nuclear JSON Extractor handles any valid JSON
- `src/lib/db.ts` - The `analysis: any` field already accepts flexible structures
- UI components - Will render whatever fields exist in the analysis object

## Risk Assessment
- **Low risk**: This only changes the prompt text, not the code logic
- **Testing**: Run a real analysis after changes to verify JSON structure is valid
