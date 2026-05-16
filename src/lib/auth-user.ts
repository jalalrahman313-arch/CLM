import { NextRequest } from "next/server"
import { verifyToken, extractTokenFromHeader, type AuthUser } from "./jwt"

/**
 * Get the authenticated user from the request.
 * This replaces getServerSession(authOptions) from NextAuth.
 * 
 * It checks in order:
 * 1. x-user-id header (set by middleware after JWT verification - fast path)
 * 2. Authorization: Bearer <token> header (for iframe/API clients)
 * 3. x-auth-token header (legacy support)
 * 4. next-auth.session-token cookie (fallback for non-iframe)
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  // 0. Fast path: Check if middleware already verified the JWT and set headers
  const userIdFromHeader = request.headers.get("x-user-id")
  if (userIdFromHeader) {
    return {
      id: userIdFromHeader,
      email: request.headers.get("x-user-email") || "",
      name: decodeURIComponent(request.headers.get("x-user-name") || ""),
      role: request.headers.get("x-user-role") || "user",
      isPremium: request.headers.get("x-user-ispremium") === "true",
    }
  }

  // 1. Check Authorization header (primary - works in iframes)
  const authHeader = request.headers.get("authorization")
  const token = extractTokenFromHeader(authHeader)
  if (token) {
    const user = await verifyToken(token)
    if (user) return user
  }

  // 2. Check x-auth-token header (legacy)
  const xAuthToken = request.headers.get("x-auth-token")
  if (xAuthToken) {
    const user = await verifyToken(xAuthToken)
    if (user) return user
  }

  // 3. Check next-auth.session-token cookie (for non-iframe browsers)
  const sessionCookie = request.cookies.get("next-auth.session-token")?.value
  if (sessionCookie) {
    const user = await verifyToken(sessionCookie)
    if (user) return user
  }

  return null
}

/**
 * Require authentication - returns user or null
 * Use in API routes: const user = await requireAuth(request)
 * If null, return 401 response
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser | null> {
  return getAuthUser(request)
}
