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

    const skills = await db.skillTracking.findMany({
      where: { classId, userId: user.id },
      include: {
        course: {
          select: { name: true },
        },
        class: {
          select: { name: true },
        },
      },
      orderBy: { skillName: 'asc' },
    })

    return NextResponse.json({ data: skills })
  } catch (error) {
    console.error('Error fetching skills:', error)
    return NextResponse.json({ error: 'مہارتیں لوڈ کرنے میں خرابی' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const body = await request.json()
    const { records } = body

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'ریکارڈز ضروری ہیں' }, { status: 400 })
    }

    // Validate all records belong to user's classes and courses
    for (const record of records) {
      if (!record.classId || !record.courseId || !record.skillId || !record.skillName) {
        return NextResponse.json({ error: 'ہر ریکارڈ میں classId, courseId, skillId, skillName ضروری ہیں' }, { status: 400 })
      }

      const cls = await db.class.findFirst({
        where: { id: record.classId, userId: user.id },
      })
      if (!cls) {
        return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
      }

      const course = await db.course.findFirst({
        where: { id: record.courseId, userId: user.id },
      })
      if (!course) {
        return NextResponse.json({ error: 'کورس نہیں ملا' }, { status: 404 })
      }
    }

    const created = await db.$transaction(
      records.map((record: { classId: string; courseId: string; skillId: string; skillName: string; status?: string; startDate?: string }) =>
        db.skillTracking.create({
          data: {
            classId: record.classId,
            courseId: record.courseId,
            skillId: record.skillId,
            skillName: record.skillName,
            status: record.status || 'Pending',
            startDate: record.startDate || new Date().toISOString().split('T')[0],
            userId: user.id,
          },
        })
      )
    )

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('Error creating skills:', error)
    return NextResponse.json({ error: 'مہارتیں بنانے میں خرابی' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'آئی ڈی اور اسٹیٹس ضروری ہیں' }, { status: 400 })
    }

    const existing = await db.skillTracking.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'مہارت کا ریکارڈ نہیں ملا' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { status }
    if (status === 'Completed') {
      updateData.endDate = new Date().toISOString().split('T')[0]
    }

    const updated = await db.skillTracking.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Error updating skill:', error)
    return NextResponse.json({ error: 'مہارت اپڈیٹ کرنے میں خرابی' }, { status: 500 })
  }
}
