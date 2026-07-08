import { z } from 'zod';

const urlOrEmpty = z.string().trim().max(300).url().or(z.literal('')).optional();

export const updateSettingsSchema = z.object({
  announcements: z
    .array(z.object({ text: z.string().max(2000), active: z.boolean() }))
    .max(50)
    .optional(),
  telegramGroupUrl: urlOrEmpty,
  telegramChannelUrl: urlOrEmpty,
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
