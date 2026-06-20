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
  couponCode: z.string().min(3).max(40).optional(),
  idempotencyKey: z.string().min(8).max(100).optional(),
});

export const createCouponSchema = z
  .object({
    code: z.string().min(3).max(40),
    discountType: z.enum(['percent', 'flat']),
    discountValue: z.number().min(0),
    appliesTo: z.enum(['all', 'packages', 'subjects']).default('all'),
    packageIds: z.array(objectId).optional(),
    subjectIds: z.array(objectId).optional(),
    maxRedemptions: z.number().int().min(1).optional(),
    expiresAt: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.discountType !== 'percent' || d.discountValue <= 100, {
    message: 'Percent discount cannot exceed 100',
    path: ['discountValue'],
  })
  .refine((d) => d.appliesTo !== 'packages' || (d.packageIds?.length ?? 0) > 0, {
    message: 'Select at least one package',
    path: ['packageIds'],
  })
  .refine((d) => d.appliesTo !== 'subjects' || (d.subjectIds?.length ?? 0) > 0, {
    message: 'Select at least one subject',
    path: ['subjectIds'],
  });

export const updateCouponSchema = z.object({
  isActive: z.boolean().optional(),
  maxRedemptions: z.number().int().min(1).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
