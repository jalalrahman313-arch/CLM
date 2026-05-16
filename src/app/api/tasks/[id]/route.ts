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

    const task = await db.task.findFirst({
      where: { id, userId: user.id },
      include: {
        class: {
          select: { name: true },
        },
        course: {
          select: { name: true },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'ٹاسک نہیں ملا' }, { status: 404 })
    }

    return NextResponse.json({ data: task })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'ٹاسک لوڈ کرنے میں خرابی' }, { status: 500 })
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
    const { title, description, status, classId, courseId } = body

    const existing = await db.task.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'ٹاسک نہیں ملا' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (classId !== undefined) updateData.classId = classId || null
    if (courseId !== undefined) updateData.courseId = courseId || null

    const updated = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        class: {
          select: { name: true },
        },
        course: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'ٹاسک اپڈیٹ کرنے میں خرابی' }, { status: 500 })
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

    const existing = await db.task.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'ٹاسک نہیں ملا' }, { status: 404 })
    }

    await db.task.delete({ where: { id } })

    return NextResponse.json({ data: { message: 'ٹاسک حذف ہو گیا' } })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'ٹاسک حذف کرنے میں خرابی' }, { status: 500 })
  }
}
