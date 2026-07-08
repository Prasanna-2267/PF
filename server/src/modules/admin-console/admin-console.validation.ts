import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const listUsersQuery = z.object({
  search: z.string().max(200).optional(),
  role: z.enum(['student', 'admin', 'superadmin']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listOrdersQuery = z.object({
  status: z.enum(['created', 'paid', 'failed', 'refunded']).optional(),
  userId: objectId.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const roleSchema = z.object({ role: z.enum(['student', 'admin', 'superadmin']) });

export const disabledSchema = z.object({ disabled: z.boolean() });

export const grantSchema = z.object({
  type: z.enum(['lesson', 'package']),
  refId: objectId,
});
