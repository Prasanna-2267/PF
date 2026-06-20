import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const settingsSchema = z.object({
  examDate: z.string().datetime().nullable().optional(),
  examLabel: z.string().max(100).nullable().optional(),
  dailyTargetMinutes: z.number().int().min(5).max(1440).optional(),
  activeStageId: objectId.nullable().optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
