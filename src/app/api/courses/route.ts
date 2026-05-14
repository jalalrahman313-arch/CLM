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

    const courses = await db.course.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    const data = courses.map((course) => ({
      ...course,
      skills: JSON.parse(course.skills),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'کورسز لوڈ کرنے میں خرابی' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const body = await request.json()
    const { name, duration, skills } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'کورس کا نام ضروری ہے' }, { status: 400 })
    }

    const skillsJson = JSON.stringify(skills || [])

    const newCourse = await db.course.create({
      data: {
        name: name.trim(),
        duration: duration || '',
        skills: skillsJson,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      data: {
        ...newCourse,
        skills: JSON.parse(newCourse.skills),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'کورس بنانے میں خرابی' }, { status: 500 })
  }
}
