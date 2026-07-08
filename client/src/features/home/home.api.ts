import { api } from '../../lib/api';

export type HomeInfo = {
  announcements: string[];
  telegram: { groupUrl: string | null; channelUrl: string | null };
};

export const homeApi = {
  get: () => api.get<HomeInfo>('/settings/home').then((r) => r.data),
};

export type AdminSettings = {
  announcements: { text: string; active: boolean }[];
  telegramGroupUrl: string;
  telegramChannelUrl: string;
};

export const adminSettingsApi = {
  get: () => api.get<{ settings: AdminSettings }>('/admin/settings').then((r) => r.data.settings),
  update: (d: Partial<AdminSettings>) =>
    api.patch<{ settings: AdminSettings }>('/admin/settings', d).then((r) => r.data.settings),
};
