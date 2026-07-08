import { api } from '../../lib/api';

export type Overview = {
  students: { total: number; newThisWeek: number };
  revenue: { totalPaise: number; monthPaise: number; todayPaise: number };
  orders: { total: number; paid: number; failed: number; created: number; refunded: number };
  content: {
    categories: number;
    stages: number;
    subjects: number;
    lessons: number;
    questions: number;
    packages: number;
    coupons: number;
  };
  revenueSeries: { date: string; paise: number; orders: number }[];
  signupSeries: { date: string; count: number }[];
  recentOrders: {
    id: string;
    amount: number;
    itemCount: number;
    createdAt: string;
    source: string;
    buyer: { id: string; name: string; email: string };
  }[];
};

export type AdminUserRole = 'student' | 'admin' | 'superadmin';

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AdminUserRole;
  disabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  avatarUrl: string | null;
  purchaseCount: number;
  totalSpent: number;
};
export type UsersPage = { rows: AdminUserRow[]; total: number; page: number; limit: number };

export type AdminOrderStatus = 'created' | 'paid' | 'failed' | 'refunded';

export type AdminOrder = {
  id: string;
  amount: number;
  status: AdminOrderStatus;
  source: string;
  itemCount: number;
  items: { type: 'lesson' | 'package'; title: string; price?: number }[];
  couponCode: string | null;
  discount: number;
  createdAt: string;
  refundedAt: string | null;
  receiptNumber: string | null;
  buyer?: { id: string; name: string; email: string };
};
export type OrdersPage = {
  rows: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  paidTotalPaise: number;
};

export type UserDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AdminUserRole;
  disabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  avatarUrl: string | null;
  activeStage: { id: string; name: string; categoryId: string; categoryName: string } | null;
  exam: { date: string | null; label: string | null; daysLeft: number | null; pressure: number };
  stats: {
    streak: number;
    momentum: number;
    syllabus: { total: number; completed: number; percent: number };
    totalRevisions: number;
    totalStudyMinutes: number;
    sessionCount: number;
    completedLessons: number;
    ownedLessonCount: number;
  };
  orders: AdminOrder[];
  ownedLessons: { id: string; title: string; type: 'pdf' | 'ism' }[];
  activeSessions: { ip: string | null; userAgent: string | null; lastActiveAt: string | null }[];
  accessLogs: { id: string; lessonTitle: string; at: string; ip: string | null }[];
};

export const consoleApi = {
  overview: () => api.get<Overview>('/admin/overview').then((r) => r.data),
  users: (params: { search?: string; role?: string; page?: number; limit?: number }) =>
    api.get<UsersPage>('/admin/users', { params }).then((r) => r.data),
  user: (id: string) => api.get<UserDetail>(`/admin/users/${id}`).then((r) => r.data),
  orders: (params: { status?: string; userId?: string; page?: number; limit?: number }) =>
    api.get<OrdersPage>('/admin/orders', { params }).then((r) => r.data),

  // control actions
  setRole: (id: string, role: AdminUserRole) =>
    api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  setDisabled: (id: string, disabled: boolean) =>
    api.patch(`/admin/users/${id}/status`, { disabled }).then((r) => r.data),
  forceLogout: (id: string) => api.post(`/admin/users/${id}/logout`).then((r) => r.data),
  grant: (id: string, type: 'lesson' | 'package', refId: string) =>
    api.post(`/admin/users/${id}/grants`, { type, refId }).then((r) => r.data),
  refundOrder: (id: string) => api.post(`/admin/orders/${id}/refund`).then((r) => r.data),
};
