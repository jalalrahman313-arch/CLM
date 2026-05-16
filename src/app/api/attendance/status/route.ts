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
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'تاریخ ضروری ہے' }, { status: 400 })
    }

    // Get all classes for the user
    const classes = await db.class.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { students: true },
        },
      },
    })

    // Get attendance records for the given date across all user's classes
    const attendanceRecords = await db.attendance.findMany({
      where: {
        date,
        class: { userId: user.id },
      },
      select: {
        classId: true,
        status: true,
      },
    })

    // Group attendance by classId
    const attendanceByClass: Record<string, Set<string>> = {}
    for (const record of attendanceRecords) {
      if (!attendanceByClass[record.classId]) {
        attendanceByClass[record.classId] = new Set()
      }
      attendanceByClass[record.classId].add(record.status)
    }

    // Build status for each class
    const statusData = classes.map((cls) => {
      const activeStudentCount = cls._count.students
      const classAttendance = attendanceByClass[cls.id]

      let attendanceStatus: 'taken' | 'not_taken' | 'no_class' = 'not_taken'

      if (!cls.isActive) {
        attendanceStatus = 'no_class'
      } else if (classAttendance && classAttendance.size > 0) {
        // Check if all records are "skip" (day was skipped)
        const hasNonSkip = Array.from(classAttendance).some(s => s !== 'skip')
        if (hasNonSkip) {
          attendanceStatus = 'taken'
        } else {
          // All records are skip — means the day was marked as skip (class not happening)
          attendanceStatus = 'no_class'
        }
      }

      return {
        classId: cls.id,
        className: cls.name,
        hijriYear: cls.hijriYear,
        isActive: cls.isActive,
        studentCount: activeStudentCount,
        attendanceStatus,
      }
    })

    return NextResponse.json({ data: statusData })
  } catch (error) {
    console.error('Error fetching attendance status:', error)
    return NextResponse.json({ error: 'حاضری کی حالت لوڈ کرنے میں خرابی' }, { status: 500 })
  }
}
