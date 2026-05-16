"use client"

import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react"

interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  isPremium: boolean
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, message: "" }),
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export { AuthContext }

// Global fetch wrapper that adds auth token to requests
let authToken: string | null = null

export function getAuthToken(): string | null {
  if (authToken) return authToken
  if (typeof window !== "undefined") {
    authToken = localStorage.getItem("auth-token")
    return authToken
  }
  return null
}

// Override fetch to automatically add Authorization header
if (typeof window !== "undefined") {
  const originalFetch = window.fetch
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const token = getAuthToken()

    // Only add auth header for API requests
    const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : (input as Request).url
    const isApiRequest = typeof url === "string" && url.startsWith("/api/")

    if (token && isApiRequest) {
      // Don't add auth header to login/register/public endpoints
      const publicPaths = ["/api/auth/login", "/api/auth/register", "/api/auth/csrf", "/api/auth/callback"]
      const isPublic = publicPaths.some(path => url.startsWith(path))

      if (!isPublic) {
        const headers = new Headers(init?.headers)
        headers.set("Authorization", `Bearer ${token}`)
        init = { ...init, headers }
      }
    }

    return originalFetch(input, init)
  }
}

function getStoredAuth(): { user: AuthUser | null; token: string | null } {
  if (typeof window === "undefined") return { user: null, token: null }
  try {
    const savedUser = localStorage.getItem("auth-user")
    const savedToken = localStorage.getItem("auth-token")
    if (savedUser && savedToken) {
      return { user: JSON.parse(savedUser), token: savedToken }
    }
  } catch {
    // localStorage not available
  }
  return { user: null, token: null }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, check localStorage for saved auth and validate token
  const initializedRef = useRef(false)
  
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    
    const { user: storedUser, token: storedToken } = getStoredAuth()

    if (storedUser && storedToken) {
      authToken = storedToken

      // Verify the token is still valid by checking session
      fetch("/api/auth/session", {
        headers: {
          "Authorization": `Bearer ${storedToken}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.authenticated && data.user) {
            // Token is valid, update user data
            authToken = storedToken
            setUser(data.user)
            localStorage.setItem("auth-user", JSON.stringify(data.user))
          } else {
            // Token is invalid or expired
            localStorage.removeItem("auth-token")
            localStorage.removeItem("auth-user")
            authToken = null
            setUser(null)
          }
        })
        .catch(() => {
          // Network error - use stored user data for offline use
          setUser(storedUser)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => setIsLoading(false))
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (data.success && data.token) {
        // Store in localStorage
        localStorage.setItem("auth-token", data.token)
        localStorage.setItem("auth-user", JSON.stringify(data.user))
        authToken = data.token
        setUser(data.user)
        return { success: true, message: data.message }
      }

      return { success: false, message: data.message || "لاگ ان میں خرابی پیش آئی" }
    } catch {
      return { success: false, message: "نیٹ ورک میں خرابی پیش آئی" }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("auth-token")
    localStorage.removeItem("auth-user")
    authToken = null
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
