// src/lib/schemas/common.schemas.ts
// Shared primitive schemas used across multiple schema files

import { z } from 'zod';

/**
 * A string that can be null or undefined (AI often returns these inconsistently)
 */
export const nullableString = z.string().nullable().optional();

/**
 * An array of strings, defaulting to empty array if missing
 */
export const stringArray = z.array(z.string()).default([]);

/**
 * A number that must be between 0 and 100 (for scores)
 */
export const scoreNumber = z.number().min(0).max(100);

/**
 * A number that can be null (for optional numeric fields)
 */
export const nullableNumber = z.number().nullable().optional();

/**
 * Priority levels used in various AI responses
 */
export const prioritySchema = z.enum(['primary', 'secondary']);

/**
 * Common agenda schema used in psychological analysis
 */
export const agendaSchema = z.object({
  type: z.string(),
  evidence: z.string(),
  priority: prioritySchema,
});

export type Agenda = z.infer<typeof agendaSchema>;
