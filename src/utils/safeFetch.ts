/**
 * Safe fetch utility to prevent "Unexpected token '<', "<!doctype "..." syntax errors
 * when endpoints return HTML (e.g., static hosting SPA fallbacks, Vercel/Firebase rewrites).
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    
    // Only parse if HTTP status is OK and response is explicitly application/json
    if (res.ok && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    return null;
  } catch {
    return null;
  }
}
