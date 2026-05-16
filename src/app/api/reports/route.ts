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
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId')

    // Build attendance where clause
    const attendanceWhere: Record<string, unknown> = {
      class: { userId },
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, string> = {}
      if (startDate) dateFilter.gte = startDate
      if (endDate) dateFilter.lte = endDate
      attendanceWhere.date = dateFilter
    }

    if (classId) attendanceWhere.classId = classId
    if (studentId) attendanceWhere.studentId = studentId

    // Verify class belongs to user if specified
    if (classId) {
      const cls = await db.class.findFirst({
        where: { id: classId, userId },
      })
      if (!cls) {
        return NextResponse.json({ error: 'کلاس نہیں ملی' }, { status: 404 })
      }
    }

    // Fetch attendance records with full details
    const attendanceRecords = await db.attendance.findMany({
      where: attendanceWhere,
      include: {
        student: {
          select: { id: true, name: true, rollNo: true, status: true },
        },
        class: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Attendance metrics (handle backward compat: 'غیر حاضر'/'غایب' → 'غائب')
    const totalRecords = attendanceRecords.length
    const presentCount = attendanceRecords.filter((r) => r.status === 'حاضر').length
    const absentCount = attendanceRecords.filter((r) => r.status === 'غائب' || r.status === 'غایب' || r.status === 'غیر حاضر').length
    const leaveCount = attendanceRecords.filter((r) => r.status === 'رخصت').length
    const attendanceRate = totalRecords > 0
      ? Math.round((presentCount / totalRecords) * 100)
      : 0

    // Daily trends
    const dailyTrendsMap = new Map<string, { present: number; absent: number; leave: number; total: number }>()
    for (const record of attendanceRecords) {
      const existing = dailyTrendsMap.get(record.date) || { present: 0, absent: 0, leave: 0, total: 0 }
      existing.total++
      if (record.status === 'حاضر') existing.present++
      else if (record.status === 'غائب' || record.status === 'غایب' || record.status === 'غیر حاضر') existing.absent++
      else if (record.status === 'رخصت') existing.leave++
      dailyTrendsMap.set(record.date, existing)
    }
    const dailyTrends = Array.from(dailyTrendsMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Class summaries with attendance rates
    const classSummariesMap = new Map<string, { className: string; present: number; absent: number; leave: number; total: number; students: Set<string> }>()
    for (const record of attendanceRecords) {
      const existing = classSummariesMap.get(record.classId) || {
        className: record.class.name,
        present: 0,
        absent: 0,
        leave: 0,
        total: 0,
        students: new Set<string>(),
      }
      existing.total++
      existing.students.add(record.studentId)
      if (record.status === 'حاضر') existing.present++
      else if (record.status === 'غائب' || record.status === 'غایب' || record.status === 'غیر حاضر') existing.absent++
      else if (record.status === 'رخصت') existing.leave++
      classSummariesMap.set(record.classId, existing)
    }
    const classSummaries = Array.from(classSummariesMap.entries()).map(
      ([classId, summary]) => ({
        classId,
        className: summary.className,
        present: summary.present,
        absent: summary.absent,
        leave: summary.leave,
        total: summary.total,
        attendanceRate: summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0,
        studentCount: summary.students.size,
      })
    )

    // Detailed per-student attendance breakdown
    const studentAttendanceMap = new Map<string, {
      studentName: string
      rollNo: string
      studentStatus: string
      className: string
      classId: string
      total: number
      present: number
      absent: number
      leave: number
      dates: { date: string; status: string }[]
    }>()
    for (const record of attendanceRecords) {
      const existing = studentAttendanceMap.get(record.studentId) || {
        studentName: record.student.name,
        rollNo: record.student.rollNo,
        studentStatus: record.student.status,
        className: record.class.name,
        classId: record.classId,
        total: 0,
        present: 0,
        absent: 0,
        leave: 0,
        dates: [],
      }
      existing.total++
      if (record.status === 'حاضر') existing.present++
      else if (record.status === 'غائب' || record.status === 'غایب' || record.status === 'غیر حاضر') existing.absent++
      else if (record.status === 'رخصت') existing.leave++
      existing.dates.push({ date: record.date, status: (record.status === 'غیر حاضر' || record.status === 'غایب') ? 'غائب' : record.status })
      studentAttendanceMap.set(record.studentId, existing)
    }

    // Full student attendance list (all students, not just absent)
    const studentAttendanceList = Array.from(studentAttendanceMap.entries())
      .map(([studentId, data]) => ({
        studentId,
        studentName: data.studentName,
        rollNo: data.rollNo,
        studentStatus: data.studentStatus,
        className: data.className,
        classId: data.classId,
        total: data.total,
        present: data.present,
        absent: data.absent,
        leave: data.leave,
        attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        absenceRate: data.total > 0 ? Math.round((data.absent / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName, 'ur'))

    // Student absence list (students with absences only, sorted by absence rate)
    const studentAbsenceList = studentAttendanceList
      .filter((s) => s.absent > 0)
      .sort((a, b) => b.absenceRate - a.absenceRate)

    // Unique dates count for reporting period
    const uniqueDates = new Set(attendanceRecords.map(r => r.date))
    const totalDays = uniqueDates.size

    // Monthly trends
    const monthlyTrendsMap = new Map<string, { month: string; present: number; absent: number; leave: number; total: number }>()
    for (const record of attendanceRecords) {
      const month = record.date.substring(0, 7) // YYYY-MM
      const existing = monthlyTrendsMap.get(month) || { month, present: 0, absent: 0, leave: 0, total: 0 }
      existing.total++
      if (record.status === 'حاضر') existing.present++
      else if (record.status === 'غائب' || record.status === 'غایب' || record.status === 'غیر حاضر') existing.absent++
      else if (record.status === 'رخصت') existing.leave++
      monthlyTrendsMap.set(month, existing)
    }
    const monthlyTrends = Array.from(monthlyTrendsMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))

    // Skill metrics
    const skillWhere: Record<string, unknown> = { userId }
    if (classId) skillWhere.classId = classId

    const totalSkillRecords = await db.skillTracking.count({
      where: skillWhere,
    })
    const completedSkillRecords = await db.skillTracking.count({
      where: { ...skillWhere, status: 'Completed' },
    })
    const inProgressSkillRecords = await db.skillTracking.count({
      where: { ...skillWhere, status: 'In Progress' },
    })
    const pendingSkillRecords = await db.skillTracking.count({
      where: { ...skillWhere, status: 'Pending' },
    })

    const skillMetrics = {
      total: totalSkillRecords,
      completed: completedSkillRecords,
      inProgress: inProgressSkillRecords,
      pending: pendingSkillRecords,
      completionRate: totalSkillRecords > 0
        ? Math.round((completedSkillRecords / totalSkillRecords) * 100)
        : 0,
    }

    // Get total students count for the user
    const totalStudents = await db.student.count({
      where: {
        userId,
        ...(classId ? { classId } : {}),
      },
    })

    // Get total classes count for the user
    const totalClasses = await db.class.count({
      where: { userId },
    })

    return NextResponse.json({
      data: {
        attendanceMetrics: {
          total: totalRecords,
          present: presentCount,
          absent: absentCount,
          leave: leaveCount,
          attendanceRate,
        },
        dailyTrends,
        monthlyTrends,
        classSummaries,
        studentAbsenceList,
        studentAttendanceList,
        skillMetrics,
        totalDays,
        totalStudents,
        totalClasses,
      },
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'رپورٹ بنانے میں خرابی' }, { status: 500 })
  }
}
