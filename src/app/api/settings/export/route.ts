import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch all user data
    const classes = await db.class.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const courses = await db.course.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const students = await db.student.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
    })

    const attendance = await db.attendance.findMany({
      where: { class: { userId } },
      orderBy: { date: 'desc' },
    })

    const skillTrackings = await db.skillTracking.findMany({
      where: { userId },
    })

    const tasks = await db.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      classes,
      courses: courses.map((c) => ({
        ...c,
        skills: JSON.parse(c.skills),
      })),
      students,
      attendance,
      skillTrackings,
      tasks,
    }

    return NextResponse.json({ data: exportData })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'ڈیٹا ایکسپورٹ کرنے میں خرابی' }, { status: 500 })
  }
}
