import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-user'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    const where: Record<string, unknown> = { userId: user.id }
    if (classId) where.classId = classId

    const students = await db.student.findMany({
      where,
      include: {
        class: {
          select: { name: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    const data = students.map((student) => ({
      id: student.id,
      rollNo: student.rollNo,
      name: student.name,
      phone: student.phone,
      email: student.email,
      status: student.status,
      enrolledAt: student.enrolledAt,
      classId: student.classId,
      className: student.class.name,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'طالب علم لوڈ کرنے میں خرابی' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const body = await request.json()
    const { name, classId, status, phone, email } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'طالب علم کا نام ضروری ہے' }, { status: 400 })
    }

    if (!classId) {
      return NextResponse.json({ error: 'کلاس کا انتخاب ضروری ہے' }, { status: 400 })
    }

    // Verify class belongs to user
    const cls = await db.class.findFirst({
      where: { id: classId, userId: user.id },
    })

    if (!cls) {
      return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
    }

    // Premium check: non-premium users can't add more than 100 students
    const isPremium = user.isPremium ?? false
    if (!isPremium) {
      const totalStudents = await db.student.count({
        where: { userId: user.id },
      })
      if (totalStudents >= 100) {
        return NextResponse.json(
          { error: 'آپ پریمیم یوزر نہیں ہیں۔ 100 سے زیادہ طلباء شامل کرنے کے لیے پریمیم حاصل کریں۔' },
          { status: 403 }
        )
      }
    }

    // Auto-generate rollNo: first 2 chars of class name + "-" + sequential number
    const existingStudents = await db.student.count({
      where: { classId },
    })

    const classPrefix = cls.name.substring(0, 2).toUpperCase()
    const sequenceNumber = (existingStudents + 1).toString().padStart(3, '0')
    const rollNo = `${classPrefix}-${sequenceNumber}`

    const newStudent = await db.student.create({
      data: {
        rollNo,
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        status: status || 'جاری',
        classId,
        userId: user.id,
      },
      include: {
        class: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      data: {
        id: newStudent.id,
        rollNo: newStudent.rollNo,
        name: newStudent.name,
        phone: newStudent.phone,
        email: newStudent.email,
        status: newStudent.status,
        enrolledAt: newStudent.enrolledAt,
        classId: newStudent.classId,
        className: newStudent.class.name,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'طالب علم بنانے میں خرابی' }, { status: 500 })
  }
}
