import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, message: "ٹوکن درکار ہے" },
        { status: 400 }
      )
    }

    // Set the NextAuth session cookie from the provided token
    const response = NextResponse.json({ success: true })

    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("Token sync error:", error)
    return NextResponse.json(
      { success: false, message: "ٹوکن سنک میں خرابی" },
      { status: 500 }
    )
  }
}
