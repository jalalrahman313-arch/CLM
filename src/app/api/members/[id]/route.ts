import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-user"

// PUT: Update a member (admin only) - change role, premium status, approval
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Prevent admin from modifying themselves
    if (id === user.id) {
      return NextResponse.json(
        { success: false, message: "اپنا اکاؤنٹ یہاں تبدیل نہیں کر سکتے" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { success: false, message: "عمل درکار ہے" },
        { status: 400 }
      )
    }

    const targetUser = await db.user.findUnique({
      where: { id },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "ممبر نہیں ملا" },
        { status: 404 }
      )
    }

    switch (action) {
      case "approve":
        await db.user.update({
          where: { id },
          data: { isApproved: true },
        })
        return NextResponse.json({
          success: true,
          message: `${targetUser.name} کی رجسٹریشن اپروو ہو گئی`,
        })

      case "reject":
        // Delete the rejected user
        await db.user.delete({
          where: { id },
        })
        return NextResponse.json({
          success: true,
          message: `${targetUser.name} کی رجسٹریشن مسترد کر دی گئی`,
        })

      case "makeAdmin":
        await db.user.update({
          where: { id },
          data: { role: "admin" },
        })
        return NextResponse.json({
          success: true,
          message: `${targetUser.name} ایڈمن بنا دیا گیا`,
        })

      case "makeUser":
        await db.user.update({
          where: { id },
          data: { role: "user" },
        })
        return NextResponse.json({
          success: true,
          message: `${targetUser.name} عام یوزر بنا دیا گیا`,
        })

      case "togglePremium":
        const newPremium = !targetUser.isPremium
        await db.user.update({
          where: { id },
          data: { isPremium: newPremium },
        })
        return NextResponse.json({
          success: true,
          message: `${targetUser.name} ${newPremium ? "پریمیم یوزر" : "عام یوزر"} بن گیا`,
        })

      case "delete":
        await db.user.delete({
          where: { id },
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
    console.error("Member update error:", error)
    return NextResponse.json(
      { success: false, message: "عمل میں مسئلہ ہوا" },
      { status: 500 }
    )
  }
}

// DELETE: Remove a member (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, message: "صرف ایڈمن حذف کر سکتا ہے" },
        { status: 403 }
      )
    }

    const { id } = await params

    // Prevent admin from deleting themselves
    if (id === user.id) {
      return NextResponse.json(
        { success: false, message: "اپنا اکاؤنٹ حذف نہیں کر سکتے" },
        { status: 400 }
      )
    }

    const targetUser = await db.user.findUnique({
      where: { id },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "ممبر نہیں ملا" },
        { status: 404 }
      )
    }

    await db.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: `${targetUser.name} حذف ہو گیا`,
    })
  } catch (error) {
    console.error("Member delete error:", error)
    return NextResponse.json(
      { success: false, message: "ممبر حذف کرنے میں مسئلہ ہوا" },
      { status: 500 }
    )
  }
}
