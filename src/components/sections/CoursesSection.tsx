"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, BookOpen, X, Clock, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface CourseItem {
  id: string
  name: string
  duration: string
  skills: { id: string; name: string }[]
  createdAt: string
}

export function CoursesSection() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<CourseItem | null>(null)
  const [formName, setFormName] = useState("")
  const [formDuration, setFormDuration] = useState("")
  const [formSkills, setFormSkills] = useState<{ id: string; name: string }[]>([])
  const [newSkill, setNewSkill] = useState("")

  const { data: coursesData, isLoading } = useQuery<{ data: CourseItem[] }>({
    queryKey: ["courses"],
    queryFn: () => fetch("/api/courses").then((r) => r.json()),
  })

  const courses = coursesData?.data || []

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      toast.success("کورس کامیابی سے بنایا گیا")
      closeDialog()
    },
    onError: () => toast.error("کورس بنانے میں خرابی"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: unknown }) =>
      fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      toast.success("کورس کامیابی سے اپ ڈیٹ ہوا")
      closeDialog()
    },
    onError: () => toast.error("کورس اپ ڈیٹ میں خرابی"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/courses/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      toast.success("کورس کامیابی سے حذف ہوا")
      setDeleteDialogOpen(false)
      setDeletingCourse(null)
    },
    onError: () => toast.error("کورس حذف کرنے میں خرابی"),
  })

  const openCreateDialog = () => {
    setEditingCourse(null)
    setFormName("")
    setFormDuration("")
    setFormSkills([])
    setDialogOpen(true)
  }

  const openEditDialog = (course: CourseItem) => {
    setEditingCourse(course)
    setFormName(course.name)
    setFormDuration(course.duration)
    setFormSkills(course.skills || [])
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingCourse(null)
  }

  const addSkill = () => {
    if (!newSkill.trim()) return
    setFormSkills([...formSkills, { id: Date.now().toString(), name: newSkill.trim() }])
    setNewSkill("")
  }

  const removeSkill = (id: string) => {
    setFormSkills(formSkills.filter((s) => s.id !== id))
  }

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error("کورس کا نام ضروری ہے")
      return
    }

    const body = {
      name: formName.trim(),
      duration: formDuration.trim(),
      skills: formSkills,
    }

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, ...body })
    } else {
      createMutation.mutate(body)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-3d bg-card border rounded-2xl h-36 animate-pulse overflow-hidden">
            <div className="h-1 bg-muted shimmer" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ====== Section Header ====== */}
      <div className="section-header">
        <div className="section-title">
          <div className="section-title-icon bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
            <BookOpen className="h-4 w-4" />
          </div>
          کورسز
        </div>
        <Button onClick={openCreateDialog} className="btn-3d bg-gradient-to-r from-violet-600 to-purple-600 border-0 text-white hover:from-violet-700 hover:to-purple-700">
          <Plus className="h-4 w-4 ml-2" />
          نیا کورس
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="pro-card bg-card text-center text-muted-foreground">
          <div className="h-1 bg-gradient-to-l from-violet-400 to-purple-400" />
          <div className="p-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-violet-500 opacity-60" />
            </div>
            <p className="text-base font-medium mb-1">ابھی کوئی کورس نہیں ہے</p>
            <p className="text-sm opacity-70">نیا کورس بنائیں تاکہ اسکلز کو منظم کیا جا سکے</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="pro-card group">
              {/* Top Accent Strip */}
              <div className="h-1.5 bg-gradient-to-l from-violet-500 to-purple-500" />
              <CardContent className="p-4 pb-3">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base leading-tight truncate">{course.name}</h3>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600"
                      onClick={() => openEditDialog(course)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20 text-destructive"
                      onClick={() => {
                        setDeletingCourse(course)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Duration */}
                {course.duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <div className="w-6 h-6 rounded-md bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="font-medium text-foreground">{course.duration}</span>
                  </div>
                )}

                {/* Skills */}
                {course.skills && course.skills.length > 0 && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {course.skills.map((skill) => (
                        <Badge
                          key={skill.id}
                          variant="secondary"
                          className="text-[10px] px-2 py-0.5 bg-gradient-to-l from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800/50 font-medium"
                        >
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="section-title-icon bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
                {editingCourse ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </div>
              {editingCourse ? "کورس میں ترمیم" : "نیا کورس بنائیں"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">کورس کا نام</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="کورس کا نام درج کریں"
                className="h-10 rounded-lg border-border/60 focus:border-violet-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">مدت</Label>
              <div className="relative">
                <Input
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  placeholder="مثلاً: 6 ماہ"
                  className="h-10 rounded-lg border-border/60 focus:border-violet-500 pr-10"
                />
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">اسکلز</Label>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="اسکل کا نام"
                  className="h-10 rounded-lg border-border/60 focus:border-violet-500"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <Button
                  type="button"
                  onClick={addSkill}
                  size="icon"
                  className="h-10 w-10 shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 hover:from-violet-600 hover:to-purple-700 rounded-lg shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 p-2 rounded-lg bg-muted/20 border border-dashed">
                  {formSkills.map((skill) => (
                    <Badge
                      key={skill.id}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 bg-gradient-to-l from-violet-500 to-purple-600 text-white border-0 font-medium shadow-sm"
                    >
                      {skill.name}
                      <button
                        onClick={() => removeSkill(skill.id)}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} className="rounded-lg">منسوخ</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-3d bg-gradient-to-r from-violet-600 to-purple-600 border-0 text-white hover:from-violet-700 hover:to-purple-700 rounded-lg"
            >
              {editingCourse ? "اپ ڈیٹ" : "بنائیں"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="section-title-icon bg-gradient-to-br from-red-500 to-rose-600 text-white">
                <Trash2 className="h-4 w-4" />
              </div>
              کورس حذف کریں؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              کیا آپ واقعی &ldquo;{deletingCourse?.name}&rdquo; کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCourse && deleteMutation.mutate(deletingCourse.id)}
              className="bg-gradient-to-r from-red-600 to-rose-600 text-white border-0 hover:from-red-700 hover:to-rose-700"
            >
              حذف کریں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
