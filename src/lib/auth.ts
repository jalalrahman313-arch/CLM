import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "ای میل",
          type: "email",
          placeholder: "ای میل درج کریں",
        },
        password: {
          label: "پاس ورڈ",
          type: "password",
          placeholder: "پاس ورڈ درج کریں",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("ای میل اور پاس ورڈ درج کریں")
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error("یہ ای میل رجسٹرڈ نہیں ہے")
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("پاس ورڈ غلط ہے")
        }

        if (!user.isApproved) {
          throw new Error("آپ کا اکاؤنٹ ابھی اپروو نہیں ہوا۔ ایڈمن کے اپروو کا انتظار کریں۔")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isPremium: user.isPremium,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.isPremium = (user as { isPremium: boolean }).isPremium
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isPremium = token.isPremium as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

/**
 * Helper to get the current session on the server side.
 * Use this in Server Components or API routes.
 */
export async function getCurrentSession() {
  const { getServerSession } = await import("next-auth")
  return getServerSession(authOptions)
}
