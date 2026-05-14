import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface ImportData {
  classes?: Array<{
    name: string;
    courseIndices?: number[];
    isActive?: boolean;
  }>;
  courses?: Array<{
    name: string;
    duration?: string;
    skills?: Array<{ id: string; name: string }>;
  }>;
  students?: Array<{
    name: string;
    classIndex: number;
    status?: string;
  }>;
  tasks?: Array<{
    title: string;
    description?: string;
    status?: string;
    classIndex?: number;
    courseIndex?: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیر مصدق' }, { status: 401 })
    }

    const userId = session.user.id
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
      tasks: 0,
    }

    // Import classes
    const classIdMap = new Map<number, string>()
    if (Array.isArray(importData.classes)) {
      for (let i = 0; i < importData.classes.length; i++) {
        const cls = importData.classes[i]
        if (!cls.name) continue

        const created = await db.class.create({
          data: {
            name: cls.name,
            isActive: cls.isActive !== undefined ? cls.isActive : true,
            userId,
            classCourses: {
              create: (cls.courseIndices || [])
                .map((idx: number) => courseIdMap.get(idx))
                .filter((id): id is string => !!id)
                .map((courseId: string) => ({ courseId })),
            },
          },
        })
        classIdMap.set(i, created.id)
        results.classes++
      }
    }

    // Import courses
    const courseIdMap = new Map<number, string>()
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
        courseIdMap.set(i, created.id)
        results.courses++
      }
    }

    // Import students (using classIndex to link to newly created classes)
    if (Array.isArray(importData.students)) {
      for (const student of importData.students) {
        if (!student.name) continue

        const classId = classIdMap.get(student.classIndex)
        if (!classId) continue

        // Generate rollNo
        const cls = await db.class.findFirst({ where: { id: classId } })
        if (!cls) continue

        const existingCount = await db.student.count({ where: { classId } })
        const classPrefix = cls.name.substring(0, 2).toUpperCase()
        const sequenceNumber = (existingCount + 1).toString().padStart(3, '0')
        const rollNo = `${classPrefix}-${sequenceNumber}`

        await db.student.create({
          data: {
            rollNo,
            name: student.name,
            status: student.status || 'جاری',
            classId,
            userId,
          },
        })
        results.students++
      }
    }

    // Import tasks
    if (Array.isArray(importData.tasks)) {
      for (const task of importData.tasks) {
        if (!task.title) continue

        const taskClassId = task.classIndex !== undefined ? classIdMap.get(task.classIndex) : null
        const taskCourseId = task.courseIndex !== undefined ? courseIdMap.get(task.courseIndex) : null

        await db.task.create({
          data: {
            title: task.title,
            description: task.description || '',
            status: task.status || 'Pending',
            classId: taskClassId || null,
            courseId: taskCourseId || null,
            userId,
          },
        })
        results.tasks++
      }
    }

    return NextResponse.json({
      data: {
        message: 'ڈیٹا درآمد ہو گیا',
        imported: results,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json({ error: 'ڈیٹا درآمد کرنے میں خرابی' }, { status: 500 })
  }
}
