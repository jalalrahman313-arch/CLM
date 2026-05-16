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

    const course = await db.course.findFirst({
      where: { id, userId: user.id },
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
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, duration, skills } = body

    const existing = await db.course.findFirst({
      where: { id, userId: user.id },
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.course.findFirst({
      where: { id, userId: user.id },
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
