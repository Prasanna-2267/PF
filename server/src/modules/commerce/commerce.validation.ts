import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createPackageSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(2000).optional(),
  lessonIds: z.array(objectId).min(1),
  price: z.number().min(0),
  isActive: z.boolean().optional(),
});
export const updatePackageSchema = createPackageSchema.partial();

export const createOrderSchema = z.object({
  items: z.array(z.object({ type: z.enum(['lesson', 'package']), id: objectId })).min(1),
  idempotencyKey: z.string().min(8).max(100).optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
