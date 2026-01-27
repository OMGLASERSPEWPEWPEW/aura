// src/lib/essence/index.ts
// Essence Identity module - AI-generated personality representations

export {
  generateVirtueSentence,
  generateVirtueSentenceFromCompatibility,
  getTopVirtues,
} from './virtueSentence';

export {
  buildEssencePrompt,
} from './promptBuilder';

export {
  generateImage,
  base64ToImageBlob,
  type DalleGenerationResult,
} from './dalleClient';

export {
  generateProfileVirtueSentence,
  generateProfileEssenceImage,
  generateAndSaveVirtueSentence,
  generateAndSaveEssenceImage,
  generateFullEssence,
  type EssenceGenerationResult,
} from './essenceGenerator';
