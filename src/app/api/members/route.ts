import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-user"
import { z } from "zod"

// GET: List all users except current admin (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "لاگ ان ضروری ہے" },
        { status: 401 }
      )
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "صرف ایڈمن رسائی رکھتا ہے" },
        { status: 403 }
      )
    }

    const users = await db.user.findMany({
      where: {
        // Exclude the current admin from the list
        NOT: { id: user.id },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        isPremium: true,
        createdAt: true,
        _count: {
          select: {
            classes: true,
            students: true,
            courses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Members list error:", error)
    return NextResponse.json(
      { success: false, message: "ممبران لانے میں مسئلہ ہوا" },
      { status: 500 }
    )
  }
}

// POST: Add a new member directly (admin only)
const addMemberSchema = z.object({
  name: z.string().min(1, "نام درج کریں"),
  email: z.string().email("درست ای میل درج کریں"),
  password: z.string().min(6, "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے"),
  role: z.enum(["admin", "user"]).default("user"),
  isPremium: z.boolean().default(false),
  isApproved: z.boolean().default(true), // Admin-added members are auto-approved
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "لاگ ان ضروری ہے" },
        { status: 401 }
      )
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "صرف ایڈمن ممبر شامل کر سکتا ہے" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = addMemberSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return NextResponse.json(
        { success: false, message: firstError?.message || "غیر درست معلومات" },
        { status: 400 }
      )
    }

    const { name, email, password, role, isPremium, isApproved } = result.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "یہ ای میل پہلے سے رجسٹرڈ ہے" },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await hash(password, 12)

    // Create the user
    const newUser = await db.user.create({
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
        isPremium: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: `${name} کامیابی سے شامل ہو گیا`,
        data: newUser,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Add member error:", error)
    return NextResponse.json(
      { success: false, message: "ممبر شامل کرنے میں مسئلہ ہوا" },
      { status: 500 }
    )
  }
}
