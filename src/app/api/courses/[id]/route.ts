import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const { id } = await params

    const course = await db.course.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!course) {
      return NextResponse.json({ error: 'کورس نہیں ملا' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        ...course,
        skills: JSON.parse(course.skills),
      },
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'کورس لوڈ کرنے میں خرابی' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, duration, skills } = body

    const existing = await db.course.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'کورس نہیں ملا' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (duration !== undefined) updateData.duration = duration
    if (skills !== undefined) updateData.skills = JSON.stringify(skills)

    const updated = await db.course.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      data: {
        ...updated,
        skills: JSON.parse(updated.skills),
      },
    })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'کورس اپڈیٹ کرنے میں خرابی' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.course.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'کورس نہیں ملا' }, { status: 404 })
    }

    await db.course.delete({ where: { id } })

    return NextResponse.json({ data: { message: 'کورس حذف ہو گیا' } })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'کورس حذف کرنے میں خرابی' }, { status: 500 })
  }
}
