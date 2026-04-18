/**
 * Dashboard API client wrapper.
 * Automatically attaches the stored Bearer token and retries with a
 * refreshed token on a 401 response.
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers, credentials: "include" });

  if (response.status === 401) {
    // Attempt token refresh
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("accessToken", data.accessToken);
      // Retry original request with the new token
      headers.set("Authorization", `Bearer ${data.accessToken}`);
      return fetch(url, { ...options, headers, credentials: "include" });
    }
  }

  return response;
}
