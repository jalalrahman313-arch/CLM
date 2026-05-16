import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-user'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const userId = user.id

    // Fetch all user data with complete relations
    const classes = await db.class.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        classCourses: {
          include: {
            course: { select: { id: true, name: true } },
          },
        },
      },
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

    // Get institution name for filename
    const dbUser = await db.user.findFirst({
      where: { id: userId },
      select: { institutionName: true },
    })

    const globalSettings = await db.appSetting.findMany()

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '2.0',
      institutionName: dbUser?.institutionName || '',
      classes: classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        hijriYear: cls.hijriYear,
        isActive: cls.isActive,
        createdAt: cls.createdAt,
        courses: cls.classCourses.map((cc) => ({
          id: cc.course.id,
          name: cc.course.name,
        })),
      })),
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        duration: c.duration,
        skills: JSON.parse(c.skills),
        createdAt: c.createdAt,
      })),
      students: students.map((s) => ({
        id: s.id,
        rollNo: s.rollNo,
        name: s.name,
        phone: s.phone,
        email: s.email,
        status: s.status,
        enrolledAt: s.enrolledAt,
        classId: s.classId,
      })),
      attendance: attendance.map((a) => ({
        studentId: a.studentId,
        classId: a.classId,
        date: a.date,
        status: a.status,
      })),
      skillTrackings: skillTrackings.map((st) => ({
        classId: st.classId,
        courseId: st.courseId,
        skillId: st.skillId,
        skillName: st.skillName,
        status: st.status,
        startDate: st.startDate,
        endDate: st.endDate,
      })),
      tasks: tasks.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        classId: t.classId,
        courseId: t.courseId,
        createdAt: t.createdAt,
      })),
      settings: globalSettings.reduce<Record<string, string>>((acc, s) => {
        acc[s.key] = s.value
        return acc
      }, {}),
    }

    return NextResponse.json({ data: exportData })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'ڈیٹا ایکسپورٹ کرنے میں خرابی' }, { status: 500 })
  }
}
