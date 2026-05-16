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

    const cls = await db.class.findFirst({
      where: { id, userId: user.id },
      include: {
        _count: {
          select: { students: true },
        },
        classCourses: {
          include: {
            course: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!cls) {
      return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        id: cls.id,
        name: cls.name,
        hijriYear: cls.hijriYear,
        isActive: cls.isActive,
        createdAt: cls.createdAt,
        studentCount: cls._count.students,
        courses: cls.classCourses.map((cc) => ({
          id: cc.course.id,
          name: cc.course.name,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching class:', error)
    return NextResponse.json({ error: 'کلاس لوڈ کرنے میں خرابی' }, { status: 500 })
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
    const { name, hijriYear, courseIds, isActive } = body

    const existing = await db.class.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
    }

    // Update basic fields
    await db.class.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(hijriYear !== undefined && { hijriYear }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    // Update courses if provided
    if (courseIds !== undefined) {
      // Delete existing class-course relations
      await db.classCourse.deleteMany({
        where: { classId: id },
      })

      // Create new relations
      if (courseIds.length > 0) {
        await db.classCourse.createMany({
          data: courseIds.map((courseId: string) => ({
            classId: id,
            courseId,
          })),
        })
      }
    }

    // Fetch updated class with courses
    const updated = await db.class.findFirst({
      where: { id },
      include: {
        _count: { select: { students: true } },
        classCourses: {
          include: {
            course: { select: { id: true, name: true } },
          },
        },
      },
    })

    const data = {
      id: updated!.id,
      name: updated!.name,
      hijriYear: updated!.hijriYear,
      isActive: updated!.isActive,
      createdAt: updated!.createdAt,
      studentCount: updated!._count.students,
      courses: updated!.classCourses.map((cc) => ({
        id: cc.course.id,
        name: cc.course.name,
      })),
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating class:', error)
    return NextResponse.json({ error: 'کلاس اپڈیٹ کرنے میں خرابی' }, { status: 500 })
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

    const existing = await db.class.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
    }

    await db.class.delete({ where: { id } })

    return NextResponse.json({ data: { message: 'کلاس حذف ہو گئی' } })
  } catch (error) {
    console.error('Error deleting class:', error)
    return NextResponse.json({ error: 'کلاس حذف کرنے میں خرابی' }, { status: 500 })
  }
}
