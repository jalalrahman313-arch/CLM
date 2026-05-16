import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-user'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const { classId, students } = body as {
      classId: string
      students: Array<{ name: string; phone?: string; email?: string }>
    }

    if (!classId) {
      return NextResponse.json({ error: 'کلاس کا انتخاب ضروری ہے' }, { status: 400 })
    }

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'طلباء کا ڈیٹا ضروری ہے' }, { status: 400 })
    }

    if (students.length > 500) {
      return NextResponse.json({ error: 'ایک بار میں زیادہ سے زیادہ 500 طلباء شامل کر سکتے ہیں' }, { status: 400 })
    }

    // Verify class belongs to user
    const cls = await db.class.findFirst({
      where: { id: classId, userId },
    })

    if (!cls) {
      return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
    }

    // Premium check
    const isPremium = user.isPremium ?? false
    if (!isPremium) {
      const totalStudents = await db.student.count({ where: { userId } })
      if (totalStudents + students.length > 100) {
        return NextResponse.json(
          { error: 'آپ پریمیم یوزر نہیں ہیں۔ 100 سے زیادہ طلباء شامل کرنے کے لیے پریمیم حاصل کریں۔' },
          { status: 403 }
        )
      }
    }

    // Get current student count for roll number generation
    const existingCount = await db.student.count({ where: { classId } })
    const classPrefix = cls.name.substring(0, 2).toUpperCase()

    // Create all students in a transaction
    const created = await db.$transaction(
      students.map((student, index) => {
        const sequenceNumber = (existingCount + index + 1).toString().padStart(3, '0')
        const rollNo = `${classPrefix}-${sequenceNumber}`

        return db.student.create({
          data: {
            rollNo,
            name: student.name.trim(),
            phone: student.phone?.trim() || null,
            email: student.email?.trim() || null,
            status: 'جاری',
            classId,
            userId,
          },
          select: {
            id: true,
            rollNo: true,
            name: true,
            phone: true,
            email: true,
          },
        })
      })
    )

    return NextResponse.json({
      data: {
        count: created.length,
        students: created,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error bulk creating students:', error)
    return NextResponse.json({ error: 'طلباء شامل کرنے میں خرابی' }, { status: 500 })
  }
}
