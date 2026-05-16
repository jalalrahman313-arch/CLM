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

    // Total classes count
    const totalClasses = await db.class.count({
      where: { userId },
    })

    // Active students count
    const activeStudents = await db.student.count({
      where: { userId, status: 'جاری' },
    })

    // Graduated students count
    const graduatedStudents = await db.student.count({
      where: { userId, status: 'فارغ' },
    })

    // Total courses count
    const totalCourses = await db.course.count({
      where: { userId },
    })

    // Today's present count
    const today = new Date().toISOString().split('T')[0]
    const todayPresent = await db.attendance.count({
      where: {
        date: today,
        status: 'حاضر',
        class: { userId },
      },
    })

    // Skills progress percentage
    const totalSkills = await db.skillTracking.count({
      where: { userId },
    })
    const completedSkills = await db.skillTracking.count({
      where: { userId, status: 'Completed' },
    })
    const skillsProgress = totalSkills > 0
      ? Math.round((completedSkills / totalSkills) * 100)
      : 0

    // Weekly attendance data (last 7 days)
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayName = d.toLocaleDateString('ur-PK', { weekday: 'short' })

      const present = await db.attendance.count({
        where: {
          date: dateStr,
          status: 'حاضر',
          class: { userId },
        },
      })
      const absent = await db.attendance.count({
        where: {
          date: dateStr,
          status: { in: ['غائب', 'غایب', 'غیر حاضر'] },
          class: { userId },
        },
      })
      const leave = await db.attendance.count({
        where: {
          date: dateStr,
          status: 'رخصت',
          class: { userId },
        },
      })

      weeklyData.push({ date: dateStr, day: dayName, present, absent, leave })
    }

    // Tasks overview
    const pendingTasks = await db.task.count({
      where: { userId, status: 'Pending' },
    })
    const completedTasks = await db.task.count({
      where: { userId, status: 'Completed' },
    })

    return NextResponse.json({
      data: {
        totalClasses,
        activeStudents,
        graduatedStudents,
        totalCourses,
        todayPresent,
        skillsProgress,
        weeklyAttendance: weeklyData,
        tasksOverview: {
          pending: pendingTasks,
          completed: completedTasks,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'ڈیش بورڈ لوڈ کرنے میں خرابی' }, { status: 500 })
  }
}
