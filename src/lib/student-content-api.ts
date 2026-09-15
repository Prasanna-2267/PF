import { api } from '@/lib/api';
import type { ContentAttachedLink } from '@/lib/note-viewer-api';

export type Money = { amount: number; amountMinor: number; currency: 'INR' } | null;
export type NoteState = { completed: boolean; favourite: boolean; progressPercent: number; currentPage: number | null; scrollOffset?: number | null; firstOpenedAt?: string | null; lastOpenedAt: string | null; completedAt?: string | null; revisionCount: number; lastRevision?: { id: string; source: string; revisedAt: string } | null; updatedAt?: string | null };
export type ResourceValidity = { mode: 'PERMANENT' | 'EXAM_DATE_OFFSET'; offsetDays: number | null };
export type NoteAccessReason = 'FREE' | 'OWNED' | 'GRANTED' | 'PURCHASE_REQUIRED' | 'COURSE_ENROLLMENT_REQUIRED' | 'EXAM_DATE_REQUIRED' | 'RESOURCE_EXPIRED';
export type Note = { id: string; parentId: string | null; title: string; description: string | null; entityType: string; mimeType: string | null; sizeBytes: string; accessType: 'FREE' | 'PAID'; price: string | null; purchaseTarget: { resourceType: 'PREMIUM_NOTES'; resourceId: string; storePath: string } | null; validity: ResourceValidity; access: { accessible: boolean; reason: NoteAccessReason; expiresAt: string | null; validityMode: ResourceValidity['mode']; validityOffsetDays: number | null }; breadcrumb: { id: string; name: string }[]; state: NoteState };
export type NoteTreeFolder = { kind: 'folder'; id: string; parentId: string | null; title: string; description: string | null; entityType: string; pageHeading: string; attachedLinks: ContentAttachedLink[]; state: NoteState; children: NoteTreeNode[] };
export type NoteTreeNode = NoteTreeFolder | ({ kind: 'note' } & Note);
export type NoteTree = { course: { id: string; code: string; name: string; slug: string; academy: { id: string; name: string } | null }; pageHeading: string; roots: NoteTreeNode[] };
export type Pagination = { page: number; limit: number; total: number; pages: number };
export type NoteList = { items: Note[]; pagination: Pagination };

export const noteKeys = { all: ['student', 'notes'] as const, tree: ['student', 'notes', 'tree'] as const, recent: ['student', 'notes', 'recent'] as const, favourites: ['student', 'notes', 'favourites'] as const };
export async function getNoteTree() { return (await api.get<NoteTree>('/student/notes/tree')).data; }
export async function getNotes(input: { search?: string; status?: 'all' | 'in_progress' | 'completed'; parentId?: string | null; limit?: number } = {}) { return (await api.get<NoteList>('/student/notes', { params: { ...input, parentId: input.parentId === null ? 'root' : input.parentId, page: 1, limit: input.limit ?? 100 } })).data; }
export async function getRecentNotes() { return (await api.get<{ items: Note[] }>('/student/notes/recent', { params: { limit: 3 } })).data; }
export async function getFavouriteNotes() { return (await api.get<NoteList>('/student/notes/favourites', { params: { page: 1, limit: 100 } })).data; }
export async function getNote(id: string) { return (await api.get<Note>(`/student/notes/${id}`)).data; }
export async function updateNoteState(id: string, state: Partial<Pick<NoteState, 'completed' | 'favourite'>>) { return (await api.patch<NoteState>(`/student/notes/${id}/state`, state)).data; }
export async function addNoteRevision(id: string) { return (await api.post<{ state: NoteState }>(`/student/notes/${id}/revisions`, { source: 'ACTION_SHEET' })).data; }

export type PackageItem = { id: string; title: string; description: string | null; entityType: string; mimeType: string | null };
export type PackageContentNode = { id: string; parentId: string | null; kind: 'FILE' | 'FOLDER'; title: string; description: string | null; entityType: string; mimeType: string | null; sizeBytes: string; children: PackageContentNode[] };
export type PackageQuestionBank = { id: string; title: string; slug: string; description: string | null; displayOrder: number; accessType: 'FREE' | 'PAID'; price: Money; questionCount: number; includedByPackage: boolean; practicePath: string };
export type StudyPackage = { id: string; slug: string; title: string; description: string | null; price: Money; itemCount: number; noteCount?: number; questionBankCount?: number; resourceCount?: number; folderCount?: number; access: { owned: boolean; source: string | null; expiresAt: string | null }; items: PackageItem[]; questionBanks?: PackageQuestionBank[]; contentTree?: PackageContentNode[]; course?: { id: string; code: string; name: string; slug?: string } };
export async function getPackages(ownership: 'all' | 'owned' | 'available' = 'all') { return (await api.get<{ items: StudyPackage[]; pagination: Pagination }>('/student/packages', { params: { ownership, page: 1, limit: 100 } })).data; }
export async function getPackage(id: string) { return (await api.get<StudyPackage>(`/student/packages/${id}`)).data; }

export type LibraryItem = { id: string; title: string; description: string | null; sizeBytes: string; validity: ResourceValidity; course: { id: string; code: string; name: string }; state: Pick<NoteState, 'completed' | 'favourite' | 'progressPercent' | 'currentPage' | 'lastOpenedAt' | 'revisionCount'>; access: { source: string; expiresAt: string | null; status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED' } };
export type LibraryPayload = { summary: { owned: number; freePurchases: number; paidPurchases: number; activeEntitlements: number; expiringSoon: number }; items: LibraryItem[]; pagination: Pagination; serverTime: string };
export async function getLibrary() { return (await api.get<LibraryPayload>('/student/library', { params: { page: 1, limit: 100 } })).data; }
export type StudentOrder = { id: string; orderNumber: string; status: string; refundStatus?: string; totalAmount: number | string; currency: string; isComplimentary?: boolean; createdAt: string; items?: { titleSnapshot: string }[] };
export async function getOrders() {
  type OrderPage = { data: StudentOrder[]; pagination: Pagination & { totalPages?: number } };
  const firstPage = (await api.get<OrderPage>('/student/orders', { params: { page: 1, limit: 100 } })).data;
  const pageCount = firstPage.pagination.totalPages ?? firstPage.pagination.pages;
  if (pageCount <= 1) return firstPage;
  const remaining = await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => api.get<OrderPage>('/student/orders', { params: { page: index + 2, limit: 100 } })));
  return { ...firstPage, data: [firstPage, ...remaining.map((response) => response.data)].flatMap((page) => page.data) };
}
export type Receipt = { id: string; orderNumber: string; receiptNumber: string | null; status: string; refundStatus: string; accessStatus: string; purchaseType: 'FREE_PURCHASE' | 'PAID_PURCHASE'; customer: { fullName: string; email: string; phone: string | null }; course: { id: string; code: string; name: string }; totals: { subtotal: Money; discount: Money; total: Money }; paymentMethod: string | null; createdAt: string; paidAt: string | null; refundedAt: string | null; items: { id: string; resourceType: string; titleSnapshot: string; quantity: number; unitPrice: Money; totalPrice: Money }[]; payments: { id: string; provider: string; providerPaymentId: string | null; amount: Money; status: string; paymentMethod: string | null; createdAt: string; refunds: { id: string; providerRefundId: string; amount: Money; reason: string; createdAt: string }[] }[]; coupons: { code: string; discountType: 'PERCENT' | 'FLAT'; discountValue: number; discount: Money }[] };
export async function getReceipt(id: string) { return (await api.get<Receipt>(`/student/orders/${id}/receipt`)).data; }
