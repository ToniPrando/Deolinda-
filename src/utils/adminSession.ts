// In-memory store for the short-lived admin session Bearer token.
// Kept strictly in JavaScript memory (never localStorage or sessionStorage).
let currentAdminToken: string | null = null;
const unauthorizedListeners = new Set<() => void>();

export function setAdminAuthToken(token: string | null): void {
  currentAdminToken = token && token.trim() ? token.trim() : null;
}

export function getAdminAuthToken(): string | null {
  return currentAdminToken;
}

export function clearAdminAuthToken(): void {
  currentAdminToken = null;
}

export function getAdminAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) };
  if (currentAdminToken) {
    headers['Authorization'] = `Bearer ${currentAdminToken}`;
  }
  return headers;
}

export function subscribeAdminUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export function notifyAdminUnauthorized(): void {
  currentAdminToken = null;
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener error
    }
  });
}
