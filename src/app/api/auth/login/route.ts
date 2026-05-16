import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"
import { createToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "ای میل اور پاس ورڈ درج کریں" },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "یہ ای میل رجسٹرڈ نہیں ہے" },
        { status: 401 }
      )
    }

    // Validate password
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "پاس ورڈ غلط ہے" },
        { status: 401 }
      )
    }

    // Check approval
    if (!user.isApproved) {
      return NextResponse.json(
        { success: false, message: "آپ کا اکاؤنٹ ابھی اپروو نہیں ہوا۔ ایڈمن کے اپروو کا انتظار کریں۔" },
        { status: 403 }
      )
    }

    // Create JWT token directly - no NextAuth dependency
    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isPremium: user.isPremium,
    }

    const token = await createToken(authUser)

    // Return success with token in body (client stores in localStorage)
    const response = NextResponse.json({
      success: true,
      message: "لاگ ان کامیاب",
      token,
      user: authUser,
    })

    // Also set as cookie for non-iframe browser access (best effort)
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { success: false, message: "لاگ ان میں خرابی پیش آئی" },
      { status: 500 }
    )
  }
}
