/**
 * Resolve where a user's avatar loads from, in priority order:
 *   1. an uploaded avatar (served by the API, cache-busted by its update time),
 *   2. the Google account picture (for SSO users, by default),
 *   3. none (the client falls back to initials).
 */
export function avatarUrlFor(
  id: string,
  hasAvatar: boolean | undefined,
  googleAvatarUrl: string | null | undefined,
  avatarUpdatedAt: Date | null | undefined,
): string | null {
  if (hasAvatar) {
    return `/api/users/${id}/avatar?v=${avatarUpdatedAt ? avatarUpdatedAt.getTime() : 0}`;
  }
  return googleAvatarUrl ?? null;
}
