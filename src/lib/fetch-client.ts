/**
 * Fetch wrapper that automatically adds auth token header.
 * This ensures API requests work even in iframe/preview where cookies are blocked.
 */

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null

  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set("x-auth-token", token)
  }

  // Set Content-Type if not already set and body is not FormData
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Convenience method for JSON API calls with auth
 */
export async function authFetchJSON<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await authFetch(url, options)

  if (res.status === 401) {
    // Token expired or invalid - clear local auth
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-token")
      localStorage.removeItem("auth-user")
      window.location.reload()
    }
    throw new Error("Unauthorized")
  }

  return res.json()
}
