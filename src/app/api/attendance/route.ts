import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')
    const studentId = searchParams.get('studentId')

    // Build where clause - scope to user's data through class relation
    const where: Record<string, unknown> = {}

    if (classId) {
      where.classId = classId
      // Verify class belongs to user
      const cls = await db.class.findFirst({
        where: { id: classId, userId: session.user.id },
      })
      if (!cls) {
        return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
      }
    } else {
      // If no classId, filter through user's classes
      where.class = { userId: session.user.id }
    }

    if (date) where.date = date
    if (studentId) where.studentId = studentId

    const records = await db.attendance.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, rollNo: true },
        },
        class: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ data: records })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'حاضری لوڈ کرنے میں خرابی' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, classId, date, status } = body

    if (!studentId || !classId || !date || !status) {
      return NextResponse.json({ error: 'تمام فیلڈز ضروری ہیں' }, { status: 400 })
    }

    // Verify class belongs to user
    const cls = await db.class.findFirst({
      where: { id: classId, userId: session.user.id },
    })
    if (!cls) {
      return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
    }

    // Verify student belongs to user
    const student = await db.student.findFirst({
      where: { id: studentId, userId: session.user.id },
    })
    if (!student) {
      return NextResponse.json({ error: 'طالب علم نہیں ملا' }, { status: 404 })
    }

    // Upsert by unique constraint: studentId + classId + date
    const record = await db.attendance.upsert({
      where: {
        studentId_classId_date: {
          studentId,
          classId,
          date,
        },
      },
      update: { status },
      create: {
        studentId,
        classId,
        date,
        status,
      },
    })

    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating attendance:', error)
    return NextResponse.json({ error: 'حاضری محفوظ کرنے میں خرابی' }, { status: 500 })
  }
}
