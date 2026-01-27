// src/lib/moodboard/index.ts
// Mood Board module - Lifestyle-focused AI-generated images

export type {
  MoodboardThemes,
  MoodboardGenerationResult,
  ThemeExtractionInput,
} from './types';

export { extractThemeInput } from './types';

export { extractThemes } from './themeExtractor';

export {
  buildMoodboardPrompt,
  buildDefaultMoodboardPrompt,
} from './promptBuilder';

export {
  generateMoodboardFromInput,
  generateMoodboardFromProfile,
  generateAndSaveMoodboard,
  generateDefaultMoodboard,
} from './moodboardGenerator';
