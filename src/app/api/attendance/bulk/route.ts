import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-user'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const body = await request.json()
    const { classId, date, records } = body

    if (!classId || !date || !Array.isArray(records)) {
      return NextResponse.json({ error: 'کلاس، تاریخ اور ریکارڈز ضروری ہیں' }, { status: 400 })
    }

    // Verify class belongs to user
    const cls = await db.class.findFirst({
      where: { id: classId, userId: user.id },
    })
    if (!cls) {
      return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
    }

    // Upsert each attendance record
    const results = await db.$transaction(
      records.map((record: { studentId: string; status: string }) =>
        db.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: record.studentId,
              classId,
              date,
            },
          },
          update: { status: record.status },
          create: {
            studentId: record.studentId,
            classId,
            date,
            status: record.status,
          },
        })
      )
    )

    return NextResponse.json({
      data: { count: results.length, date, classId },
    }, { status: 201 })
  } catch (error) {
    console.error('Error saving bulk attendance:', error)
    return NextResponse.json({ error: 'حاضری محفوظ کرنے میں خرابی' }, { status: 500 })
  }
}
