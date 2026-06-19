import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const subjectIdQuery = z.object({ subjectId: objectId });

export const createIsmSchema = z.object({
  title: z.string().min(1).max(200),
  subjectId: objectId,
  externalUrl: z.string().url(),
  price: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// Multipart fields arrive as strings, so coerce where needed.
export const createPdfFieldsSchema = z.object({
  title: z.string().min(1).max(200),
  subjectId: objectId,
  price: z.coerce.number().min(0).optional(),
  order: z.coerce.number().int().optional(),
  isFree: z.enum(['true', 'false']).optional(),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  externalUrl: z.string().url().optional(),
  price: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type CreateIsmInput = z.infer<typeof createIsmSchema>;
export type CreatePdfFields = z.infer<typeof createPdfFieldsSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
