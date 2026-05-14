import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(1, "نام درج کریں"),
  email: z.string().email("درست ای میل درج کریں"),
  password: z.string().min(6, "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے"),
  role: z.enum(["admin", "user"]).default("user"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return NextResponse.json(
        {
          success: false,
          message: firstError?.message || "غیر درست معلومات",
        },
        { status: 400 }
      )
    }

    const { name, email, password, role } = result.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "یہ ای میل پہلے سے رجسٹرڈ ہے",
        },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await hash(password, 12)

    // Check if this is the first user - auto-approve first admin
    const userCount = await db.user.count()
    const isFirstUser = userCount === 0
    const isApproved = isFirstUser && role === "admin"
    const isPremium = isFirstUser && role === "admin" // First admin is always premium

    // Create the user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isApproved,
        isPremium,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
    })

    const message = isApproved
      ? "رجسٹریشن کامیاب ہو گئی"
      : "رجسٹریشن کامیاب! ایڈمن کے اپروو کا انتظار کریں۔"

    return NextResponse.json(
      {
        success: true,
        message,
        needsApproval: !isApproved,
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "رجسٹریشن میں مسئلہ ہوا، دوبارہ کوشش کریں",
      },
      { status: 500 }
    )
  }
}
