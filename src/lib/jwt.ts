import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
)

const JWT_ISSUER = "lab-management-system"
const JWT_AUDIENCE = "lab-management"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  isPremium: boolean
}

/**
 * Create a JWT token for the given user
 */
export async function createToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isPremium: user.isPremium,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify a JWT token and return the user data
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })

    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
      isPremium: payload.isPremium as boolean,
    }
  } catch {
    return null
  }
}

/**
 * Extract token from Authorization header
 * Supports: "Bearer <token>" and raw token
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null

  // Remove "Bearer " prefix if present
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // Also support raw token
  if (authHeader.length > 10) {
    return authHeader
  }

  return null
}
