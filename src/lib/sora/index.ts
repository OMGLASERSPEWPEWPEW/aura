// src/lib/sora/index.ts
// Barrel export for Sora motion portrait module

export { generateVideo, base64ToVideoBlob } from './soraClient';
export type { SoraGenerationResult as SoraClientResult, SoraGenerationOptions } from './soraClient';

export { buildSoraPrompt } from './promptBuilder';

export {
  generateProfileSoraVideo,
  generateAndSaveSoraVideo,
} from './soraGenerator';
export type { SoraGenerationResult } from './soraGenerator';
