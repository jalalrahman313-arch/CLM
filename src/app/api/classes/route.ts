import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const classes = await db.class.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { students: true },
        },
        classCourses: {
          include: {
            course: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = classes.map((cls) => ({
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
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'کلاسز لوڈ کرنے میں خرابی' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const body = await request.json()
    const { name, hijriYear, courseIds, isActive } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'کلاس کا نام ضروری ہے' }, { status: 400 })
    }

    const newClass = await db.class.create({
      data: {
        name: name.trim(),
        hijriYear: hijriYear || "",
        isActive: isActive !== undefined ? isActive : true,
        userId: session.user.id,
        classCourses: {
          create: (courseIds || []).map((courseId: string) => ({
            courseId,
          })),
        },
      },
      include: {
        classCourses: {
          include: {
            course: { select: { id: true, name: true } },
          },
        },
      },
    })

    const data = {
      id: newClass.id,
      name: newClass.name,
      hijriYear: newClass.hijriYear,
      isActive: newClass.isActive,
      createdAt: newClass.createdAt,
      studentCount: 0,
      courses: newClass.classCourses.map((cc) => ({
        id: cc.course.id,
        name: cc.course.name,
      })),
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json({ error: 'کلاس بنانے میں خرابی' }, { status: 500 })
  }
}
