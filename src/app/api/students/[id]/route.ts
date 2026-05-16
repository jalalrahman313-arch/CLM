import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-user'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const { id } = await params

    const student = await db.student.findFirst({
      where: { id, userId: user.id },
      include: {
        class: {
          select: { name: true },
        },
        attendance: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'طالب علم نہیں ملا' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        id: student.id,
        rollNo: student.rollNo,
        name: student.name,
        phone: student.phone,
        email: student.email,
        status: student.status,
        enrolledAt: student.enrolledAt,
        classId: student.classId,
        className: student.class.name,
        attendance: student.attendance,
      },
    })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'طالب علم لوڈ کرنے میں خرابی' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, status, classId, phone, email } = body

    const existing = await db.student.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'طالب علم نہیں ملا' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (status !== undefined) updateData.status = status
    if (classId !== undefined) updateData.classId = classId
    if (phone !== undefined) updateData.phone = phone || null
    if (email !== undefined) updateData.email = email || null

    const updated = await db.student.update({
      where: { id },
      data: updateData,
      include: {
        class: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      data: {
        id: updated.id,
        rollNo: updated.rollNo,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        status: updated.status,
        enrolledAt: updated.enrolledAt,
        classId: updated.classId,
        className: updated.class.name,
      },
    })
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'طالب علم اپڈیٹ کرنے میں خرابی' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.student.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'طالب علم نہیں ملا' }, { status: 404 })
    }

    await db.student.delete({ where: { id } })

    return NextResponse.json({ data: { message: 'طالب علم حذف ہو گیا' } })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'طالب علم حذف کرنے میں خرابی' }, { status: 500 })
  }
}
