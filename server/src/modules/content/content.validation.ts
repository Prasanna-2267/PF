import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, digits and hyphens only'),
  description: z.string().max(1000).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export const updateCategorySchema = createCategorySchema.partial();

export const createStageSchema = z.object({
  name: z.string().min(1).max(100),
  examCategoryId: objectId,
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export const updateStageSchema = createStageSchema.partial();

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(120),
  stageId: objectId,
  parentSubjectId: objectId.nullable().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export const updateSubjectSchema = createSubjectSchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateStageInput = z.infer<typeof createStageSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
