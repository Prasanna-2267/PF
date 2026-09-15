import { api } from '@/lib/api';
import { API_BASE_URL } from '@/lib/env';

export type NoteViewerSession = {
  viewerSessionId: string;
  status: 'allowed';
  expiresAt: string;
  manifestUrl: string;
  contentUrl: string;
  note: { id: string; title: string; mimeType: string | null };
};

export type ContentAttachedLink = {
  id: string;
  url: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteViewerManifest = {
  viewerSessionId: string;
  title: string;
  mimeType: string | null;
  pageCount: number | null;
  currentPage: number | null;
  progressPercent: number;
  scrollOffset: number | null;
  expiresAt: string;
  watermark: { displayIdentity: string; traceId: string };
  capabilities: { continuousScroll: boolean; pinchZoom: boolean; download: false; print: false };
  attachedLinks: ContentAttachedLink[];
};

export async function createNoteViewerSession(contentItemId: string) {
  const response = await api.post<NoteViewerSession>(`/student/notes/${contentItemId}/viewer-sessions`);
  return response.data;
}

export async function loadNoteViewerManifest(viewerSessionId: string) {
  const response = await api.get<NoteViewerManifest>(`/student/viewer-sessions/${viewerSessionId}/manifest`);
  return response.data;
}

export async function updateNoteViewerProgress(viewerSessionId: string, progress: { currentPage?: number; progressPercent: number; scrollOffset?: number }) {
  await api.patch(`/student/viewer-sessions/${viewerSessionId}/progress`, progress);
}

export async function heartbeatNoteViewerSession(viewerSessionId: string) {
  await api.post(`/student/viewer-sessions/${viewerSessionId}/heartbeat`);
}

export async function closeNoteViewerSession(viewerSessionId: string) {
  await api.delete(`/student/viewer-sessions/${viewerSessionId}`);
}

export function protectedContentSource(contentUrl: string) {
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  return { uri: `${apiOrigin}${contentUrl}` };
}
