"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Network, CheckCircle2, Clock, Circle, ChevronLeft, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface ClassItem {
  id: string
  name: string
}

interface SkillTracking {
  id: string
  classId: string
  courseId: string
  skillId: string
  skillName: string
  status: string
  startDate: string
  endDate: string | null
}

interface CourseItem {
  id: string
  name: string
  skills: { id: string; name: string }[]
}

export function SkillsSection() {
  const queryClient = useQueryClient()
  const [selectedClassId, setSelectedClassId] = useState<string>("")

  const { data: classesData } = useQuery<{ data: ClassItem[] }>({
    queryKey: ["classes"],
    queryFn: () => fetch("/api/classes").then((r) => r.json()),
  })

  const { data: coursesData } = useQuery<{ data: CourseItem[] }>({
    queryKey: ["courses"],
    queryFn: () => fetch("/api/courses").then((r) => r.json()),
  })

  const { data: skillsData, isLoading } = useQuery<{ data: SkillTracking[] }>({
    queryKey: ["skills", selectedClassId],
    queryFn: () =>
      fetch(`/api/skills?classId=${selectedClassId}`).then((r) => r.json()),
    enabled: !!selectedClassId,
  })

  const classes = classesData?.data || []
  const courses = coursesData?.data || []
  const skillTrackings = skillsData?.data || []

  const courseMap = new Map(courses.map((c) => [c.id, c]))

  // Group skills by course
  const skillsByCourse = new Map<string, SkillTracking[]>()
  for (const skill of skillTrackings) {
    const list = skillsByCourse.get(skill.courseId) || []
    list.push(skill)
    skillsByCourse.set(skill.courseId, list)
  }

  // Overall progress
  const totalSkills = skillTrackings.length
  const completedSkills = skillTrackings.filter((s) => s.status === "Completed").length
  const inProgressSkills = skillTrackings.filter((s) => s.status === "In Progress").length
  const pendingSkills = skillTrackings.filter((s) => s.status === "Pending").length
  const progressPercent = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch("/api/skills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", selectedClassId] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("اسکل اپ ڈیٹ ہوئی")
    },
    onError: () => toast.error("اسکل اپ ڈیٹ میں خرابی"),
  })

  const handleStatusChange = (skillId: string, newStatus: string) => {
    updateMutation.mutate({ id: skillId, status: newStatus })
  }

  // Auto-advance: when a skill is completed, mark next pending as "In Progress"
  const handleComplete = (skill: SkillTracking, courseSkills: SkillTracking[]) => {
    updateMutation.mutate(
      { id: skill.id, status: "Completed" },
      {
        onSuccess: () => {
          // Find next pending skill in same course
          const currentIndex = courseSkills.findIndex((s) => s.id === skill.id)
          const nextSkill = courseSkills[currentIndex + 1]
          if (nextSkill && nextSkill.status === "Pending") {
            setTimeout(() => {
              updateMutation.mutate({ id: nextSkill.id, status: "In Progress" })
            }, 500)
          }
        },
      }
    )
  }

  // Initialize skills for a class if none exist
  const initMutation = useMutation({
    mutationFn: (records: { classId: string; courseId: string; skillId: string; skillName: string }[]) =>
      fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", selectedClassId] })
      toast.success("اسکلز شروع کی گئیں")
    },
    onError: () => toast.error("اسکلز شروع کرنے میں خرابی"),
  })

  const initializeSkills = () => {
    if (!selectedClassId) return
    const records: { classId: string; courseId: string; skillId: string; skillName: string }[] = []
    for (const course of courses) {
      for (const skill of course.skills) {
        // Check if already exists
        const exists = skillTrackings.some(
          (s) => s.courseId === course.id && s.skillId === skill.id
        )
        if (!exists) {
          records.push({
            classId: selectedClassId,
            courseId: course.id,
            skillId: skill.id,
            skillName: skill.name,
          })
        }
      }
    }
    if (records.length === 0) {
      toast.info("سب اسکلز پہلے سے موجود ہیں")
      return
    }
    initMutation.mutate(records)
  }

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-title">
          <span className="section-title-icon bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
            <Sparkles className="h-4 w-4" />
          </span>
          اسکلز ٹریکر
        </div>
        {selectedClassId && (
          <Button onClick={initializeSkills} variant="outline" size="sm" className="btn-3d text-xs">
            <Sparkles className="h-3.5 w-3.5 ml-1.5" />
            اسکلز شروع کریں
          </Button>
        )}
      </div>

      {/* Class Selector Pills */}
      <div className="glass-card p-3">
        <div className="flex flex-wrap gap-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedClassId === cls.id
                  ? "bg-gradient-to-l from-teal-500 to-emerald-600 text-white shadow-md scale-105"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      </div>

      {!selectedClassId ? (
        <Card className="card-3d border-0">
          <CardContent className="p-10 text-center">
            <div className="section-title-icon bg-gradient-to-br from-teal-500/20 to-emerald-600/20 text-teal-600 mx-auto mb-4 w-16 h-16 rounded-2xl">
              <Network className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground text-sm">کلاس منتخب کریں تاکہ اسکلز دیکھ سکیں</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted/50 card-3d" />
          ))}
        </div>
      ) : skillTrackings.length === 0 ? (
        <Card className="card-3d border-0">
          <CardContent className="p-10 text-center">
            <div className="section-title-icon bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 mx-auto mb-4 w-14 h-14 rounded-2xl">
              <Circle className="h-7 w-7" />
            </div>
            <p className="text-muted-foreground text-sm">اس کلاس کے لیے کوئی اسکل نہیں۔ &ldquo;اسکلز شروع کریں&rdquo; پر کلک کریں۔</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Progress Card */}
          <Card className="stat-3d border-0 bg-gradient-to-l from-teal-50 via-emerald-50 to-white dark:from-teal-950/30 dark:via-emerald-950/20 dark:to-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="section-title-icon bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold">کل پیش رفت</span>
                    <span className="text-2xl font-black text-teal-600 dark:text-teal-400" dir="ltr">
                      {progressPercent}%
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-2.5 text-center rounded-lg">
                  <div className="text-lg font-bold text-emerald-600" dir="ltr">{completedSkills}</div>
                  <div className="text-[11px] text-muted-foreground">مکمل</div>
                </div>
                <div className="glass-card p-2.5 text-center rounded-lg">
                  <div className="text-lg font-bold text-amber-500" dir="ltr">{inProgressSkills}</div>
                  <div className="text-[11px] text-muted-foreground">جاری</div>
                </div>
                <div className="glass-card p-2.5 text-center rounded-lg">
                  <div className="text-lg font-bold text-muted-foreground" dir="ltr">{pendingSkills}</div>
                  <div className="text-[11px] text-muted-foreground">شروع</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills by Course */}
          {Array.from(skillsByCourse.entries()).map(([courseId, skills]) => {
            const course = courseMap.get(courseId)
            const courseCompleted = skills.filter((s) => s.status === "Completed").length
            const courseProgress = skills.length > 0 ? Math.round((courseCompleted / skills.length) * 100) : 0

            return (
              <Card key={courseId} className="pro-card border-0 animate-fade-in">
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="section-title-icon bg-gradient-to-br from-teal-500/15 to-emerald-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                        <ChevronLeft className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base truncate">{course?.name || "کورس"}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {courseCompleted}/{skills.length}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs font-bold ${
                          courseProgress === 100
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : courseProgress > 0
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                            : ""
                        }`}
                      >
                        {courseProgress}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={courseProgress} className="h-2 mt-2" />
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-2">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                        skill.status === "Completed"
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20"
                          : skill.status === "In Progress"
                          ? "bg-amber-50/60 dark:bg-amber-950/20"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {skill.status === "Completed" ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        ) : skill.status === "In Progress" ? (
                          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                            <Clock className="h-3.5 w-3.5 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center shrink-0">
                            <Circle className="h-3 w-3 text-muted-foreground/40" />
                          </div>
                        )}
                        <span
                          className={`text-sm ${
                            skill.status === "Completed"
                              ? "line-through text-muted-foreground"
                              : "font-medium"
                          }`}
                        >
                          {skill.skillName}
                        </span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant={skill.status === "Pending" ? "default" : "outline"}
                          className={`text-xs h-7 px-2.5 rounded-full ${
                            skill.status === "Pending"
                              ? "bg-gradient-to-l from-slate-500 to-slate-600 text-white hover:from-slate-600 hover:to-slate-700"
                              : ""
                          }`}
                          onClick={() => handleStatusChange(skill.id, "Pending")}
                          disabled={skill.status === "Pending"}
                        >
                          شروع کریں
                        </Button>
                        <Button
                          size="sm"
                          variant={skill.status === "In Progress" ? "default" : "outline"}
                          className={`text-xs h-7 px-2.5 rounded-full ${
                            skill.status === "In Progress"
                              ? "bg-gradient-to-l from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 border-0"
                              : ""
                          }`}
                          onClick={() => handleStatusChange(skill.id, "In Progress")}
                          disabled={skill.status === "In Progress"}
                        >
                          جاری
                        </Button>
                        <Button
                          size="sm"
                          variant={skill.status === "Completed" ? "default" : "outline"}
                          className={`text-xs h-7 px-2.5 rounded-full ${
                            skill.status === "Completed"
                              ? "bg-gradient-to-l from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 border-0"
                              : ""
                          }`}
                          onClick={() => handleComplete(skill, skills)}
                          disabled={skill.status === "Completed"}
                        >
                          مکمل
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}
