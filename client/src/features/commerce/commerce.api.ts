import { api } from '../../lib/api';

export type Package = {
  id: string;
  title: string;
  description: string;
  price: number;
  lessonCount: number;
  lessonIds: string[];
  isActive: boolean;
};

export type RazorpayResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type OrderItem = { type: 'lesson' | 'package'; id: string };

export type Coupon = {
  id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  appliesTo: 'all' | 'packages' | 'subjects';
  packageIds: string[];
  subjectIds: string[];
  maxRedemptions: number | null;
  redemptions: number;
  expiresAt: string | null;
  isActive: boolean;
};

export type NewCoupon = {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  appliesTo: 'all' | 'packages' | 'subjects';
  packageIds?: string[];
  subjectIds?: string[];
  maxRedemptions?: number;
  expiresAt?: string;
};

export const commerceApi = {
  packages: () =>
    api.get<{ packages: Package[]; paymentsEnabled: boolean }>('/commerce/packages').then((r) => r.data),
  createOrder: (items: OrderItem[], idempotencyKey: string, couponCode?: string) =>
    api
      .post<{
        orderId: string;
        razorpayOrderId: string;
        amount: number;
        discount: number;
        currency: string;
        keyId: string | null;
        free: boolean;
      }>('/commerce/orders', { items, idempotencyKey, couponCode })
      .then((r) => r.data),
  verify: (d: RazorpayResult) => api.post('/commerce/verify', d).then((r) => r.data),
  my: () =>
    api
      .get<{
        ownedLessonIds: string[];
        orders: { id: string; amount: number; currency: string; status: string; itemCount: number; createdAt: string }[];
      }>('/commerce/my')
      .then((r) => r.data),

  // admin
  adminPackages: () => api.get<{ packages: Package[] }>('/admin/commerce/packages').then((r) => r.data.packages),
  createPackage: (d: { title: string; description?: string; lessonIds: string[]; price: number }) =>
    api.post('/admin/commerce/packages', d).then((r) => r.data),
  updatePackage: (id: string, d: Partial<{ title: string; price: number; isActive: boolean; lessonIds: string[] }>) =>
    api.patch(`/admin/commerce/packages/${id}`, d).then((r) => r.data),
  deletePackage: (id: string) => api.delete(`/admin/commerce/packages/${id}`).then((r) => r.data),

  coupons: () => api.get<{ coupons: Coupon[] }>('/admin/commerce/coupons').then((r) => r.data.coupons),
  createCoupon: (d: NewCoupon) => api.post('/admin/commerce/coupons', d).then((r) => r.data),
  updateCoupon: (id: string, d: Partial<{ isActive: boolean; maxRedemptions: number | null; expiresAt: string | null }>) =>
    api.patch(`/admin/commerce/coupons/${id}`, d).then((r) => r.data),
  deleteCoupon: (id: string) => api.delete(`/admin/commerce/coupons/${id}`).then((r) => r.data),
};
