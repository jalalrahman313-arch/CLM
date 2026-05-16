import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt"

export async function middleware(request: NextRequest) {
  // Only process API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Skip auth routes that don't need authentication
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/session",
    "/api/auth/register",
    "/api/auth/csrf",
    "/api/auth/callback",
    "/api/auth/providers",
  ]

  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Try to extract token from multiple sources
  let token: string | null = null

  // 1. Authorization header (primary - for iframe clients)
  const authHeader = request.headers.get("authorization")
  token = extractTokenFromHeader(authHeader)

  // 2. x-auth-token header (legacy)
  if (!token) {
    token = request.headers.get("x-auth-token")
  }

  // 3. Cookie (fallback for non-iframe browsers)
  if (!token) {
    token = request.cookies.get("next-auth.session-token")?.value || null
  }

  if (token) {
    const user = await verifyToken(token)
    if (user) {
      // Set user info as request headers so API routes can read them
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("x-user-id", user.id)
      requestHeaders.set("x-user-email", user.email)
      requestHeaders.set("x-user-name", encodeURIComponent(user.name))
      requestHeaders.set("x-user-role", user.role)
      requestHeaders.set("x-user-ispremium", String(user.isPremium))

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  // No valid auth - continue without user context
  // Individual API routes will return 401 if they require auth
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
}
