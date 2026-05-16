import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-user"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "لاگ ان ضروری ہے" },
        { status: 401 }
      )
    }

    const userId = user.id

    // Check if user already has data
    const existingClasses = await db.class.count({ where: { userId } })
    if (existingClasses > 0) {
      return NextResponse.json(
        { success: false, message: "پہلے سے ڈیٹا موجود ہے۔ پہلے موجودہ ڈیٹا حذف کریں۔" },
        { status: 400 }
      )
    }

    // Create dummy courses
    const course1 = await db.course.create({
      data: {
        name: "کمپیوٹر بیسکس",
        duration: "6 مہینے",
        skills: JSON.stringify([
          { id: "s1", name: "MS Word" },
          { id: "s2", name: "MS Excel" },
          { id: "s3", name: "MS PowerPoint" },
          { id: "s4", name: "انٹرنیٹ بیسکس" },
        ]),
        userId,
      },
    })

    const course2 = await db.course.create({
      data: {
        name: "ویب ڈیولپمنٹ",
        duration: "1 سال",
        skills: JSON.stringify([
          { id: "s5", name: "HTML" },
          { id: "s6", name: "CSS" },
          { id: "s7", name: "JavaScript" },
          { id: "s8", name: "React" },
          { id: "s9", name: "Next.js" },
        ]),
        userId,
      },
    })

    const course3 = await db.course.create({
      data: {
        name: "گرافک ڈیزائن",
        duration: "3 مہینے",
        skills: JSON.stringify([
          { id: "s10", name: "Photoshop" },
          { id: "s11", name: "Illustrator" },
          { id: "s12", name: "Canva" },
        ]),
        userId,
      },
    })

    // Create dummy classes with multi-course
    const class1 = await db.class.create({
      data: {
        name: "کمپیوٹر بیسکس - صبح",
        isActive: true,
        userId,
        classCourses: {
          create: [{ courseId: course1.id }],
        },
      },
    })

    const class2 = await db.class.create({
      data: {
        name: "ویب ڈیولپمنٹ - دوپہر",
        isActive: true,
        userId,
        classCourses: {
          create: [{ courseId: course2.id }],
        },
      },
    })

    const class3 = await db.class.create({
      data: {
        name: "گرافک ڈیزائن - شام",
        isActive: true,
        userId,
        classCourses: {
          create: [{ courseId: course3.id }],
        },
      },
    })

    // Create dummy students
    const studentData = [
      { name: "احمد خان", phone: "0300-1234567", email: "ahmed@example.com" },
      { name: "محمد علی", phone: "0312-2345678", email: "ali@example.com" },
      { name: "عبداللہ", phone: "0321-3456789", email: "abdullah@example.com" },
      { name: "عمران حسین", phone: "0333-4567890", email: "imran@example.com" },
      { name: "بلال احمد", phone: "0345-5678901", email: "bilal@example.com" },
      { name: "حمزہ رضا", phone: "0300-6789012", email: "hamza@example.com" },
      { name: "طارق محمود", phone: "0312-7890123", email: "" },
      { name: "سعید احمد", phone: "0321-8901234", email: "" },
      { name: "فہد خان", phone: "0333-9012345", email: "fahad@example.com" },
      { name: "کامران علی", phone: "0345-0123456", email: "kamran@example.com" },
      { name: "نعمان حکیم", phone: "", email: "numan@example.com" },
      { name: "شبیر احمد", phone: "", email: "" },
    ]

    const students = []
    for (let i = 0; i < studentData.length; i++) {
      const classId = i < 4 ? class1.id : i < 8 ? class2.id : class3.id
      const courseId = i < 4 ? course1.id : i < 8 ? course2.id : course3.id
      const student = await db.student.create({
        data: {
          rollNo: `STD-${String(i + 1).padStart(3, "0")}`,
          name: studentData[i].name,
          phone: studentData[i].phone || null,
          email: studentData[i].email || null,
          status: i < 10 ? "جاری" : "فارغ",
          classId,
          userId,
        },
      })
      students.push({ ...student, courseId })
    }

    // Create dummy attendance (last 7 days)
    const today = new Date()
    const attendanceStatuses = ["حاضر", "رخصت", "غائب"]

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today)
      date.setDate(date.getDate() - dayOffset)
      const dateStr = date.toISOString().split("T")[0]

      for (const student of students) {
        if (student.status === "فارغ" && dayOffset < 3) continue
        const status = attendanceStatuses[Math.floor(Math.random() * 3)]
        await db.attendance.create({
          data: {
            studentId: student.id,
            classId: student.classId,
            date: dateStr,
            status,
          },
        })
      }
    }

    // Create dummy skill tracking
    for (const student of students) {
      const courseId = student.courseId
      const course = courseId === course1.id ? course1 : courseId === course2.id ? course2 : course3
      const skills: { id: string; name: string }[] = JSON.parse(course.skills)

      for (const skill of skills) {
        const rand = Math.random()
        let status = "Pending"
        let startDate = ""
        let endDate: string | null = null

        if (rand > 0.6) {
          status = "Completed"
          const start = new Date(today)
          start.setDate(start.getDate() - Math.floor(Math.random() * 30 + 15))
          startDate = start.toISOString().split("T")[0]
          const end = new Date(start)
          end.setDate(end.getDate() + Math.floor(Math.random() * 10 + 5))
          endDate = end.toISOString().split("T")[0]
        } else if (rand > 0.3) {
          status = "In Progress"
          const start = new Date(today)
          start.setDate(start.getDate() - Math.floor(Math.random() * 15))
          startDate = start.toISOString().split("T")[0]
        }

        await db.skillTracking.create({
          data: {
            classId: student.classId,
            courseId,
            skillId: skill.id,
            skillName: skill.name,
            status,
            startDate,
            endDate,
            userId,
          },
        })
      }
    }

    // Create dummy tasks
    const taskData = [
      { title: "پروجیکٹ جمع کروانا", description: "فائنل پروجیکٹ جمع کروانا ہوگا", classId: class1.id, courseId: course1.id },
      { title: "ٹیسٹ تیاری", description: "وسطانی ٹیسٹ کی تیاری", classId: class1.id, courseId: course1.id },
      { title: "ویب سائٹ بنانا", description: "پورٹ فولیو ویب سائٹ بنانا", classId: class2.id, courseId: course2.id },
      { title: "CSS لے آؤٹ", description: "ریسپانسو لے آؤٹ بنانا", classId: class2.id, courseId: course2.id },
      { title: "لوگو ڈیزائن", description: "تین لوگو ڈیزائن کرنا", classId: class3.id, courseId: course3.id },
      { title: "بروشر بنانا", description: "ایجوکیشنل بروشر بنانا", classId: class3.id, courseId: course3.id },
    ]

    for (const task of taskData) {
      await db.task.create({
        data: {
          title: task.title,
          description: task.description,
          status: Math.random() > 0.5 ? "Completed" : "Pending",
          classId: task.classId,
          courseId: task.courseId,
          userId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "ڈمی ڈیٹا کامیابی سے لوڈ ہو گیا",
      data: {
        classes: 3,
        courses: 3,
        students: students.length,
        tasks: taskData.length,
      },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { success: false, message: "ڈمی ڈیٹا لوڈ کرنے میں مسئلہ ہوا" },
      { status: 500 }
    )
  }
}
