import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-user"

// GET: Check current user's premium status directly from database
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, isPremium: false },
        { status: 401 }
      )
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { isPremium: true, role: true, name: true },
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, isPremium: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      isPremium: dbUser.isPremium,
      role: dbUser.role,
      name: dbUser.name,
    })
  } catch (error) {
    console.error("Premium check error:", error)
    return NextResponse.json(
      { success: false, isPremium: false },
      { status: 500 }
    )
  }
}
