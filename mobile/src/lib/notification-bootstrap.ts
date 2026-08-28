// TypeScript/web fallback. Metro resolves notification-bootstrap.native.ts on
// Android and iOS before this file.
export async function initialiseNotifications(): Promise<() => void> { return () => undefined; }
