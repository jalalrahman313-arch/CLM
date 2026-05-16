import { NextRequest, NextResponse } from "next/server"
import { hash, compare } from "bcryptjs"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-user"
import { z } from "zod"

const updateNameSchema = z.object({
  type: z.literal("name"),
  name: z.string().min(1, "نام درج کریں"),
})

const updatePasswordSchema = z.object({
  type: z.literal("password"),
  currentPassword: z.string().min(1, "موجودہ پاسورڈ درج کریں"),
  newPassword: z.string().min(6, "نئے پاسورڈ میں کم از کم 6 حروف ہونے چاہئیں"),
})

const updateSchema = z.discriminatedUnion("type", [
  updateNameSchema,
  updatePasswordSchema,
])

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "لاگ ان ضروری ہے" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = updateSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return NextResponse.json(
        { success: false, message: firstError?.message || "غیر درست معلومات" },
        { status: 400 }
      )
    }

    const userId = user.id

    if (result.data.type === "name") {
      // Update name - role is never touched
      await db.user.update({
        where: { id: userId },
        data: { name: result.data.name },
      })

      return NextResponse.json({
        success: true,
        message: "نام کامیابی سے تبدیل ہو گیا",
      })
    }

    if (result.data.type === "password") {
      // Verify current password
      const dbUser = await db.user.findUnique({
        where: { id: userId },
        select: { password: true },
      })

      if (!dbUser) {
        return NextResponse.json(
          { success: false, message: "یوزر نہیں ملا" },
          { status: 404 }
        )
      }

      const isPasswordValid = await compare(
        result.data.currentPassword,
        dbUser.password
      )

      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: "موجودہ پاسورڈ غلط ہے" },
          { status: 400 }
        )
      }

      // Hash and update new password - role is never touched
      const hashedPassword = await hash(result.data.newPassword, 12)
      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })

      return NextResponse.json({
        success: true,
        message: "پاسورڈ کامیابی سے تبدیل ہو گیا",
      })
    }

    return NextResponse.json(
      { success: false, message: "غیر درست درخواست" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Account update error:", error)
    return NextResponse.json(
      { success: false, message: "اپڈیٹ میں مسئلہ ہوا" },
      { status: 500 }
    )
  }
}
