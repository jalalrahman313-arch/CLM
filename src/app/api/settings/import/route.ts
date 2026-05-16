import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-user'
import { db } from '@/lib/db'

interface ImportData {
  version?: string
  institutionName?: string
  classes?: Array<{
    id?: string
    name: string
    hijriYear?: string
    isActive?: boolean
    courses?: Array<{ id?: string; name: string }>
    courseIndices?: number[]
  }>
  courses?: Array<{
    id?: string
    name: string
    duration?: string
    skills?: Array<{ id: string; name: string }>
  }>
  students?: Array<{
    id?: string
    rollNo?: string
    name: string
    phone?: string
    email?: string
    status?: string
    classId?: string
    classIndex?: number
  }>
  attendance?: Array<{
    studentId?: string
    classId?: string
    date: string
    status: string
  }>
  skillTrackings?: Array<{
    classId?: string
    courseId?: string
    skillId: string
    skillName: string
    status?: string
    startDate?: string
    endDate?: string | null
  }>
  tasks?: Array<{
    title: string
    description?: string
    status?: string
    classId?: string | null
    courseId?: string | null
    classIndex?: number
    courseIndex?: number
  }>
  settings?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const importData: ImportData = body.data || body

    // Validate structure
    if (!importData || typeof importData !== 'object') {
      return NextResponse.json({ error: 'غلط ڈیٹا فارمیٹ' }, { status: 400 })
    }

    const results = {
      classes: 0,
      courses: 0,
      students: 0,
      attendance: 0,
      skillTrackings: 0,
      tasks: 0,
    }

    // Maps to track old IDs → new IDs
    const courseIdMap = new Map<string, string>()
    const classIdMap = new Map<string, string>()
    const studentIdMap = new Map<string, string>()

    // Step 1: Import courses first (classes reference courses)
    if (Array.isArray(importData.courses)) {
      for (let i = 0; i < importData.courses.length; i++) {
        const course = importData.courses[i]
        if (!course.name) continue

        const skillsJson = JSON.stringify(course.skills || [])
        const created = await db.course.create({
          data: {
            name: course.name,
            duration: course.duration || '',
            skills: skillsJson,
            userId,
          },
        })
        // Map old ID to new ID (if old ID exists)
        if (course.id) courseIdMap.set(course.id, created.id)
        // Also map by index for backward compat
        courseIdMap.set(String(i), created.id)
        results.courses++
      }
    }

    // Step 2: Import classes
    if (Array.isArray(importData.classes)) {
      for (let i = 0; i < importData.classes.length; i++) {
        const cls = importData.classes[i]
        if (!cls.name) continue

        // Resolve course IDs for this class
        let courseIdsForClass: string[] = []

        // New format: cls.courses array with id/name
        if (Array.isArray(cls.courses) && cls.courses.length > 0) {
          for (const c of cls.courses) {
            if (c.id && courseIdMap.has(c.id)) {
              courseIdsForClass.push(courseIdMap.get(c.id)!)
            }
          }
        }
        // Old format: cls.courseIndices array
        if (courseIdsForClass.length === 0 && Array.isArray(cls.courseIndices)) {
          courseIdsForClass = cls.courseIndices
            .map((idx: number) => courseIdMap.get(String(idx)))
            .filter((id): id is string => !!id)
        }

        const created = await db.class.create({
          data: {
            name: cls.name,
            hijriYear: cls.hijriYear || '',
            isActive: cls.isActive !== undefined ? cls.isActive : true,
            userId,
            classCourses: {
              create: courseIdsForClass.map((courseId: string) => ({ courseId })),
            },
          },
        })
        // Map old ID to new ID
        if (cls.id) classIdMap.set(cls.id, created.id)
        // Also map by index
        classIdMap.set(String(i), created.id)
        results.classes++
      }
    }

    // Step 3: Import students
    if (Array.isArray(importData.students)) {
      for (const student of importData.students) {
        if (!student.name) continue

        // Resolve class ID
        let classId: string | undefined
        if (student.classId && classIdMap.has(student.classId)) {
          classId = classIdMap.get(student.classId)
        } else if (student.classIndex !== undefined) {
          classId = classIdMap.get(String(student.classIndex))
        }

        if (!classId) continue

        // Generate rollNo if not provided
        let rollNo = student.rollNo || ''
        if (!rollNo) {
          const cls = await db.class.findFirst({ where: { id: classId } })
          if (!cls) continue
          const existingCount = await db.student.count({ where: { classId } })
          const classPrefix = cls.name.substring(0, 2).toUpperCase()
          const sequenceNumber = (existingCount + 1).toString().padStart(3, '0')
          rollNo = `${classPrefix}-${sequenceNumber}`
        }

        const created = await db.student.create({
          data: {
            rollNo,
            name: student.name,
            phone: student.phone || null,
            email: student.email || null,
            status: student.status || 'جاری',
            classId,
            userId,
          },
        })
        // Map old ID to new ID
        if (student.id) studentIdMap.set(student.id, created.id)
        results.students++
      }
    }

    // Step 4: Import attendance
    if (Array.isArray(importData.attendance)) {
      for (const record of importData.attendance) {
        if (!record.date || !record.status) continue

        const newStudentId = record.studentId ? studentIdMap.get(record.studentId) : undefined
        const newClassId = record.classId ? classIdMap.get(record.classId) : undefined

        if (!newStudentId || !newClassId) continue

        // Normalize old status values
        let normalizedStatus = record.status
        if (normalizedStatus === 'غیر حاضر' || normalizedStatus === 'غایب') normalizedStatus = 'غائب'

        await db.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: newStudentId,
              classId: newClassId,
              date: record.date,
            },
          },
          update: { status: normalizedStatus },
          create: {
            studentId: newStudentId,
            classId: newClassId,
            date: record.date,
            status: normalizedStatus,
          },
        })
        results.attendance++
      }
    }

    // Step 5: Import skill trackings
    if (Array.isArray(importData.skillTrackings)) {
      for (const st of importData.skillTrackings) {
        if (!st.skillId || !st.skillName) continue

        const newClassId = st.classId ? classIdMap.get(st.classId) : undefined
        const newCourseId = st.courseId ? courseIdMap.get(st.courseId) : undefined

        if (!newClassId || !newCourseId) continue

        await db.skillTracking.create({
          data: {
            classId: newClassId,
            courseId: newCourseId,
            skillId: st.skillId,
            skillName: st.skillName,
            status: st.status || 'Pending',
            startDate: st.startDate || '',
            endDate: st.endDate || null,
            userId,
          },
        })
        results.skillTrackings++
      }
    }

    // Step 6: Import tasks
    if (Array.isArray(importData.tasks)) {
      for (const task of importData.tasks) {
        if (!task.title) continue

        let taskClassId: string | null = null
        let taskCourseId: string | null = null

        if (task.classId && classIdMap.has(task.classId)) {
          taskClassId = classIdMap.get(task.classId)!
        } else if (task.classIndex !== undefined) {
          taskClassId = classIdMap.get(String(task.classIndex)) || null
        }

        if (task.courseId && courseIdMap.has(task.courseId)) {
          taskCourseId = courseIdMap.get(task.courseId)!
        } else if (task.courseIndex !== undefined) {
          taskCourseId = courseIdMap.get(String(task.courseIndex)) || null
        }

        await db.task.create({
          data: {
            title: task.title,
            description: task.description || '',
            status: task.status || 'Pending',
            classId: taskClassId,
            courseId: taskCourseId,
            userId,
          },
        })
        results.tasks++
      }
    }

    return NextResponse.json({
      data: {
        message: 'بیک اپ کامیابی سے بحال ہو گیا',
        imported: results,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json({ error: 'ڈیٹا درآمد کرنے میں خرابی' }, { status: 500 })
  }
}
