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
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId: session.user.id }
    if (classId) where.classId = classId
    if (courseId) where.courseId = courseId
    if (status) where.status = status

    const tasks = await db.task.findMany({
      where,
      include: {
        class: {
          select: { name: true },
        },
        course: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'ٹاسکس لوڈ کرنے میں خرابی' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, status, classId, courseId } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'ٹاسک کا عنوان ضروری ہے' }, { status: 400 })
    }

    // Verify class belongs to user if provided
    if (classId) {
      const cls = await db.class.findFirst({
        where: { id: classId, userId: session.user.id },
      })
      if (!cls) {
        return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
      }
    }

    // Verify course belongs to user if provided
    if (courseId) {
      const course = await db.course.findFirst({
        where: { id: courseId, userId: session.user.id },
      })
      if (!course) {
        return NextResponse.json({ error: 'کورس نہیں ملا' }, { status: 404 })
      }
    }

    const newTask = await db.task.create({
      data: {
        title: title.trim(),
        description: description || '',
        status: status || 'Pending',
        classId: classId || null,
        courseId: courseId || null,
        userId: session.user.id,
      },
      include: {
        class: {
          select: { name: true },
        },
        course: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({ data: newTask }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'ٹاسک بنانے میں خرابی' }, { status: 500 })
  }
}
