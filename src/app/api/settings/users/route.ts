import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-user"

// GET: List all users (admin only) - for user management
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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        isPremium: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Users list error:", error)
    return NextResponse.json(
      { success: false, message: "یوزرز لانے میں مسئلہ ہوا" },
      { status: 500 }
    )
  }
}

// PUT: Approve/reject user or update user role (admin only)
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, message: "یوزر آئی اور عمل درکار ہے" },
        { status: 400 }
      )
    }

    // Prevent admin from modifying themselves
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, message: "اپنا اکاؤنٹ یہاں تبدیل نہیں کر سکتے" },
        { status: 400 }
      )
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "یوزر نہیں ملا" },
        { status: 404 }
      )
    }

    switch (action) {
      case "approve":
        await db.user.update({
          where: { id: userId },
          data: { isApproved: true },
        })
        return NextResponse.json({
          success: true,
          message: `${targetUser.name} کی رجسٹریشن اپروو ہو گئی`,
        })

      case "reject":
        // Delete the rejected user
        await db.user.delete({
          where: { id: userId },
        })
        return NextResponse.json({
          success: true,
          message: `${targetUser.name} کی رجسٹریشن مسترد کر دی گئی`,
        })

      case "toggleRole":
        // Toggle between admin and user
        const newRole = targetUser.role === "admin" ? "user" : "admin"
        await db.user.update({
          where: { id: userId },
          data: { role: newRole },
        })
        return NextResponse.json({
          success: true,
          message: `${targetUser.name} کا کردار ${newRole === "admin" ? "ایڈمن" : "یوزر"} ہو گیا`,
        })

      case "togglePremium":
        const newPremium = !targetUser.isPremium
        await db.user.update({
          where: { id: userId },
          data: { isPremium: newPremium },
        })
        return NextResponse.json({
          success: true,
          message: `${targetUser.name} ${newPremium ? "پریمیم یوزر" : "نارمل یوزر"} بن گیا`,
        })

      case "delete":
        await db.user.delete({
          where: { id: userId },
        })
        return NextResponse.json({
          success: true,
          message: `${targetUser.name} حذف ہو گیا`,
        })

      default:
        return NextResponse.json(
          { success: false, message: "غیر درست عمل" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("User management error:", error)
    return NextResponse.json(
      { success: false, message: "عمل میں مسئلہ ہوا" },
      { status: 500 }
    )
  }
}
