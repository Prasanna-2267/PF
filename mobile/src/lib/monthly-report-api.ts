import { api } from '@/lib/api';
import { API_BASE_URL } from '@/lib/env';

export type MonthlyReportStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';

export type MonthlyReportProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: 'INR';
  storePath: string;
};

export type MonthlyReportItem = {
  id: string;
  yearMonth: string;
  label: string;
  status: MonthlyReportStatus;
  scheduledFor: string;
  isScheduled: boolean;
  generatedAt: string | null;
  updatedAt: string;
  version: number;
  failureCode: string | null;
  sizeBytes: number | null;
  canView: boolean;
};

export type MonthlyReportArchive = {
  access: {
    owned: boolean;
    entitlementId?: string;
    grantedAt?: string;
    expiresAt?: string | null;
    product: MonthlyReportProduct;
  };
  items: MonthlyReportItem[];
  serverTime: string;
};

export type MonthlyReportViewerSession = {
  viewerSessionId: string;
  status: 'allowed';
  expiresAt: string;
  contentUrl: string;
  report: { id: string; title: string; mimeType: 'application/pdf' };
};

export async function listMonthlyReports() {
  return (await api.get<MonthlyReportArchive>('/student/reports/monthly')).data;
}

export async function getMonthlyReport(yearMonth: string) {
  return (await api.get<MonthlyReportItem & { course: { id: string; code: string; name: string }; hasSnapshot: boolean }>(`/student/reports/monthly/${yearMonth}`)).data;
}

export async function generateMonthlyReport(yearMonth: string) {
  return (await api.post<MonthlyReportItem & { queued?: boolean }>(`/student/reports/monthly/${yearMonth}/generate`)).data;
}

export async function createMonthlyReportViewerSession(reportId: string) {
  return (await api.post<MonthlyReportViewerSession>(`/student/reports/monthly/${reportId}/viewer-sessions`)).data;
}

export async function closeMonthlyReportViewerSession(viewerSessionId: string) {
  await api.delete(`/student/reports/monthly/viewer-sessions/${viewerSessionId}`);
}

export function monthlyReportContentSource(contentUrl: string) {
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  return { uri: `${apiOrigin}${contentUrl}` };
}
