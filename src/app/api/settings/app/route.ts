import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-user"

// GET: Fetch app settings + user-specific institution name
export async function GET(request: NextRequest) {
  try {
    const settings = await db.appSetting.findMany()
    const settingsMap: Record<string, string> = {}
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value
    }

    // Ensure defaults
    if (!settingsMap.institutionName) {
      settingsMap.institutionName = "جامعہ اشرفیہ"
    }

    // Get user-specific institution name if logged in
    let userInstitutionName: string | null = null
    try {
      const user = await getAuthUser(request)
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { institutionName: true },
        })
        userInstitutionName = dbUser?.institutionName || null
      }
    } catch {
      // Ignore - user might not be logged in
    }

    // Effective institution name: user-specific takes priority over global
    const effectiveInstitutionName = userInstitutionName || settingsMap.institutionName

    return NextResponse.json({
      success: true,
      data: {
        ...settingsMap,
        userInstitutionName,
        effectiveInstitutionName,
      },
    })
  } catch (error) {
    console.error("App settings fetch error:", error)
    return NextResponse.json(
      { success: false, data: { institutionName: "جامعہ اشرفیہ", userInstitutionName: null, effectiveInstitutionName: "جامعہ اشرفیہ" } },
      { status: 500 }
    )
  }
}

// PUT: Update app settings
// - Admin can update global institution name
// - Premium users can update their own institution name
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
    const { institutionName, isPersonalUpdate } = body

    // If it's a personal institution name update (for premium users)
    if (isPersonalUpdate && institutionName !== undefined) {
      if (!user.isPremium) {
        return NextResponse.json(
          { success: false, message: "یہ فیچر صرف پریمیم یوزرز کے لیے ہے" },
          { status: 403 }
        )
      }

      await db.user.update({
        where: { id: user.id },
        data: { institutionName: institutionName.trim() || null },
      })

      return NextResponse.json({
        success: true,
        message: "ادارے کا نام محفوظ ہو گیا",
      })
    }

    // Global institution name update (admin only)
    if (institutionName !== undefined) {
      if (user.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "صرف ایڈمن تبدیل کر سکتا ہے" },
          { status: 403 }
        )
      }

      await db.appSetting.upsert({
        where: { key: "institutionName" },
        update: { value: institutionName },
        create: { key: "institutionName", value: institutionName },
      })
    }

    return NextResponse.json({
      success: true,
      message: "سیٹنگز محفوظ ہو گئیں",
    })
  } catch (error) {
    console.error("App settings update error:", error)
    return NextResponse.json(
      { success: false, message: "سیٹنگز محفوظ کرنے میں خرابی" },
      { status: 500 }
    )
  }
}
