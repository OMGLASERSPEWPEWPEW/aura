// src/lib/schemas/profile.schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  ProfileBasicsSchema,
  PhotoAnalysisSchema,
  PromptAnalysisSchema,
  SubtextAnalysisSchema,
  PsychologicalProfileSchema,
  ProfileAnalysisSchema,
  DateIdeaSchema,
  DateIdeasResponseSchema,
  OpenerResponseSchema,
  OpenersResponseSchema,
} from './profile.schemas';

describe('profile.schemas', () => {
  describe('ProfileBasicsSchema', () => {
    it('should accept valid profile basics', () => {
      const basics = {
        name: 'Alex',
        age: 29,
        location: 'San Francisco',
        job: 'Software Engineer',
        app: 'Bumble',
      };
      expect(ProfileBasicsSchema.parse(basics)).toEqual(basics);
    });

    it('should accept partial basics', () => {
      const basics = {
        name: 'Alex',
      };
      expect(ProfileBasicsSchema.parse(basics)).toMatchObject({
        name: 'Alex',
      });
    });

    it('should accept all null values', () => {
      const basics = {
        name: null,
        age: null,
        location: null,
        job: null,
        app: null,
      };
      expect(ProfileBasicsSchema.parse(basics)).toEqual(basics);
    });
  });

  describe('PhotoAnalysisSchema', () => {
    it('should accept valid photo analysis', () => {
      const photo = {
        description: 'Standing on a mountain peak',
        vibe: 'adventurous',
        subtext: 'Values achievement and outdoor activities',
      };
      expect(PhotoAnalysisSchema.parse(photo)).toEqual(photo);
    });

    it('should default to empty strings', () => {
      const result = PhotoAnalysisSchema.parse({});
      expect(result.description).toBe('');
      expect(result.vibe).toBe('');
      expect(result.subtext).toBe('');
    });
  });

  describe('PromptAnalysisSchema', () => {
    it('should accept valid prompt with opener', () => {
      const prompt = {
        question: 'Best travel story',
        answer: 'Got lost in Tokyo and found amazing ramen',
        analysis: 'Embraces unexpected experiences',
        suggested_opener: {
          message: 'What was the ramen place called? I need to add it to my list!',
          tactic: 'curiosity',
          why_it_works: 'Shows genuine interest in their experience',
        },
      };
      expect(PromptAnalysisSchema.parse(prompt)).toEqual(prompt);
    });

    it('should accept prompt without opener', () => {
      const prompt = {
        question: 'My simple pleasures',
        answer: 'Morning coffee on the porch',
        analysis: 'Values quiet moments',
      };
      const result = PromptAnalysisSchema.parse(prompt);
      expect(result.suggested_opener).toBeUndefined();
    });
  });

  describe('SubtextAnalysisSchema', () => {
    it('should accept valid subtext analysis', () => {
      const subtext = {
        sexual_signaling: 'Moderate - beach photos show confidence',
        power_dynamics: 'Subtle flex with career mentions',
        vulnerability_indicators: 'Some openness in prompts',
        disconnect: 'Photos seem curated vs. answers being casual',
      };
      expect(SubtextAnalysisSchema.parse(subtext)).toEqual(subtext);
    });

    it('should accept null values', () => {
      const subtext = {
        sexual_signaling: null,
        power_dynamics: null,
        vulnerability_indicators: null,
        disconnect: null,
      };
      expect(SubtextAnalysisSchema.parse(subtext)).toEqual(subtext);
    });
  });

  describe('PsychologicalProfileSchema', () => {
    it('should accept valid psychological profile', () => {
      const profile = {
        archetype_summary: 'The Ambitious Adventurer',
        agendas: [
          { type: 'status', evidence: 'Career focus', priority: 'primary' as const },
        ],
        presentation_tactics: ['humor', 'achievement display'],
        predicted_tactics: ['will use accomplishments to impress'],
        subtext_analysis: {
          sexual_signaling: 'Moderate',
          power_dynamics: 'Subtle',
        },
      };
      expect(PsychologicalProfileSchema.parse(profile)).toMatchObject({
        archetype_summary: 'The Ambitious Adventurer',
      });
    });

    it('should default arrays to empty', () => {
      const result = PsychologicalProfileSchema.parse({});
      expect(result.agendas).toEqual([]);
      expect(result.presentation_tactics).toEqual([]);
      expect(result.predicted_tactics).toEqual([]);
    });
  });

  describe('ProfileAnalysisSchema', () => {
    it('should accept full profile analysis', () => {
      const analysis = {
        basics: { name: 'Test', age: 25 },
        photos: [{ description: 'Photo 1', vibe: 'happy', subtext: 'Joyful' }],
        prompts: [{ question: 'Q', answer: 'A', analysis: 'Analysis' }],
        psychological_profile: { archetype_summary: 'The Explorer' },
        red_flags: ['vague answers'],
        green_flags: ['genuine smile', 'varied interests'],
        summary: 'Interesting profile with adventurous vibes',
      };
      expect(ProfileAnalysisSchema.parse(analysis)).toMatchObject({
        basics: { name: 'Test' },
      });
    });

    it('should default arrays to empty', () => {
      const result = ProfileAnalysisSchema.parse({});
      expect(result.photos).toEqual([]);
      expect(result.prompts).toEqual([]);
      expect(result.red_flags).toEqual([]);
      expect(result.green_flags).toEqual([]);
    });
  });

  describe('DateIdeaSchema', () => {
    it('should accept valid date idea', () => {
      const idea = {
        title: 'Cooking Class',
        description: 'Take an Italian cooking class together',
        why_it_works: 'Interactive, allows conversation while doing',
        vibe: 'cozy',
        budget: '$$',
      };
      expect(DateIdeaSchema.parse(idea)).toEqual(idea);
    });

    it('should accept date idea without optional fields', () => {
      const idea = {
        title: 'Coffee Walk',
        description: 'Get coffee and walk in the park',
        why_it_works: 'Low pressure, easy to extend or end',
      };
      expect(DateIdeaSchema.parse(idea)).toEqual(idea);
    });
  });

  describe('DateIdeasResponseSchema', () => {
    it('should accept valid date ideas response', () => {
      const response = {
        date_ideas: [
          { title: 'Idea 1', description: 'Desc 1', why_it_works: 'Works 1' },
          { title: 'Idea 2', description: 'Desc 2', why_it_works: 'Works 2' },
        ],
      };
      expect(DateIdeasResponseSchema.parse(response)).toEqual(response);
    });

    it('should default to empty array', () => {
      const result = DateIdeasResponseSchema.parse({});
      expect(result.date_ideas).toEqual([]);
    });
  });

  describe('OpenerResponseSchema', () => {
    it('should accept valid opener response', () => {
      const opener = {
        message: 'Hey! Your travel photos are amazing. Where was that beach?',
        tactic: 'curiosity + compliment',
        why_it_works: 'Shows genuine interest in their experiences',
        tone: 'friendly',
      };
      expect(OpenerResponseSchema.parse(opener)).toEqual(opener);
    });

    it('should accept opener without tone', () => {
      const opener = {
        message: 'What inspired you to try skydiving?',
        tactic: 'curiosity',
        why_it_works: 'Opens conversation about adventure',
      };
      expect(OpenerResponseSchema.parse(opener)).toEqual(opener);
    });
  });

  describe('OpenersResponseSchema', () => {
    it('should accept valid openers response', () => {
      const response = {
        openers: [
          { message: 'Opener 1', tactic: 'tactic 1', why_it_works: 'works 1' },
          { message: 'Opener 2', tactic: 'tactic 2', why_it_works: 'works 2' },
        ],
      };
      expect(OpenersResponseSchema.parse(response)).toEqual(response);
    });

    it('should default to empty array', () => {
      const result = OpenersResponseSchema.parse({});
      expect(result.openers).toEqual([]);
    });
  });
});
