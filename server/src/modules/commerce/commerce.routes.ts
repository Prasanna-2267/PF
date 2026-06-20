import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as commerce from './commerce.controller.js';

/** Student-facing, mounted at /api/commerce. */
export const commerceRouter = Router();
// Public webhook (verified by signature) must be before requireAuth.
commerceRouter.post('/webhook', asyncHandler(commerce.webhook));
commerceRouter.use(requireAuth);
commerceRouter.get('/packages', asyncHandler(commerce.listPackages));
commerceRouter.post('/orders', asyncHandler(commerce.createOrder));
commerceRouter.post('/verify', asyncHandler(commerce.verifyPayment));
commerceRouter.get('/my', asyncHandler(commerce.myPurchases));

/** Admin packages, mounted at /api/admin/commerce. */
export const adminCommerceRouter = Router();
adminCommerceRouter.use(requireAuth, requireRole('admin', 'superadmin'));
adminCommerceRouter.get('/packages', asyncHandler(commerce.listAdminPackages));
adminCommerceRouter.post('/packages', asyncHandler(commerce.createPackage));
adminCommerceRouter.patch('/packages/:id', asyncHandler(commerce.updatePackage));
adminCommerceRouter.delete('/packages/:id', asyncHandler(commerce.deletePackage));
adminCommerceRouter.get('/coupons', asyncHandler(commerce.listCoupons));
adminCommerceRouter.post('/coupons', asyncHandler(commerce.createCoupon));
adminCommerceRouter.patch('/coupons/:id', asyncHandler(commerce.updateCoupon));
adminCommerceRouter.delete('/coupons/:id', asyncHandler(commerce.deleteCoupon));
