"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Plus, Pencil, Trash2, Users, BookOpen, Calendar } from "lucide-react"
import { toast } from "sonner"

interface ClassItem {
  id: string
  name: string
  hijriYear: string
  isActive: boolean
  createdAt: string
  studentCount: number
  courses: { id: string; name: string }[]
}

interface CourseItem {
  id: string
  name: string
}

export function ClassesSection() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null)
  const [formName, setFormName] = useState("")
  const [formHijriYear, setFormHijriYear] = useState("")
  const [formCourseIds, setFormCourseIds] = useState<string[]>([])
  const [formIsActive, setFormIsActive] = useState(true)

  const { data: classesData, isLoading } = useQuery<{ data: ClassItem[] }>({
    queryKey: ["classes"],
    queryFn: () => fetch("/api/classes").then((r) => r.json()),
  })

  const { data: coursesData } = useQuery<{ data: CourseItem[] }>({
    queryKey: ["courses"],
    queryFn: () => fetch("/api/courses").then((r) => r.json()),
  })

  const classes = classesData?.data || []
  const courses = coursesData?.data || []

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("کلاس کامیابی سے بنائی گئی")
      closeDialog()
    },
    onError: () => toast.error("کلاس بنانے میں خرابی"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: unknown }) =>
      fetch(`/api/classes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("کلاس کامیابی سے اپ ڈیٹ ہوئی")
      closeDialog()
    },
    onError: () => toast.error("کلاس اپ ڈیٹ میں خرابی"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/classes/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("کلاس کامیابی سے حذف ہوئی")
      setDeleteDialogOpen(false)
      setDeletingClass(null)
    },
    onError: () => toast.error("کلاس حذف کرنے میں خرابی"),
  })

  const openCreateDialog = () => {
    setEditingClass(null)
    setFormName("")
    setFormHijriYear("")
    setFormCourseIds([])
    setFormIsActive(true)
    setDialogOpen(true)
  }

  const openEditDialog = (cls: ClassItem) => {
    setEditingClass(cls)
    setFormName(cls.name)
    setFormHijriYear(cls.hijriYear || "")
    setFormCourseIds(cls.courses.map((c) => c.id))
    setFormIsActive(cls.isActive)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingClass(null)
  }

  const toggleCourse = (courseId: string) => {
    setFormCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    )
  }

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error("کلاس کا نام ضروری ہے")
      return
    }
    if (!formHijriYear.trim()) {
      toast.error("ہجری سال ضروری ہے")
      return
    }

    const body = {
      name: formName.trim(),
      hijriYear: formHijriYear.trim(),
      courseIds: formCourseIds,
      isActive: formIsActive,
    }

    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, ...body })
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
          <div className="section-title-icon bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
            <Users className="h-4 w-4" />
          </div>
          کلاسز
        </div>
        <Button onClick={openCreateDialog} className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 border-0 text-white hover:from-teal-700 hover:to-emerald-700">
          <Plus className="h-4 w-4 ml-2" />
          نئی کلاس
        </Button>
      </div>

      {classes.length === 0 ? (
        <div className="pro-card bg-card text-center text-muted-foreground">
          <div className="h-1 bg-gradient-to-l from-teal-400 to-emerald-400" />
          <div className="p-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-teal-500 opacity-60" />
            </div>
            <p className="text-base font-medium mb-1">ابھی کوئی کلاس نہیں ہے</p>
            <p className="text-sm opacity-70">نئی کلاس بنائیں تاکہ طلباء کو منظم کیا جا سکے</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="pro-card group">
              {/* Top Accent Strip */}
              <div className={`h-1.5 ${cls.isActive ? "bg-gradient-to-l from-teal-500 to-emerald-500" : "bg-gradient-to-l from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700"}`} />
              <CardContent className="p-4 pb-3">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${cls.isActive ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white" : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-500 dark:text-gray-300"}`}>
                      <span className="text-sm font-bold">{cls.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base leading-tight truncate">{cls.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {cls.hijriYear && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-2 py-0 font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                          >
                            <Calendar className="h-2.5 w-2.5 ml-0.5" />
                            {cls.hijriYear} ہجری
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-2 py-0 font-semibold border ${
                            cls.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                          }`}
                        >
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1 ${cls.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {cls.isActive ? "فعال" : "غیر فعال"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600"
                      onClick={() => openEditDialog(cls)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20 text-destructive"
                      onClick={() => {
                        setDeletingClass(cls)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="font-medium text-foreground" dir="ltr">{cls.studentCount}</span>
                    <span className="text-xs">طلباء</span>
                  </div>
                </div>

                {/* Courses Row */}
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {cls.courses.length > 0 ? (
                      cls.courses.map((course) => (
                        <Badge
                          key={course.id}
                          variant="secondary"
                          className="text-[10px] px-2 py-0.5 bg-gradient-to-l from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800/50 font-medium"
                        >
                          {course.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">کوئی کورس نہیں</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="section-title-icon bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-sm">
                {editingClass ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </div>
              {editingClass ? "کلاس میں ترمیم" : "نئی کلاس بنائیں"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">کلاس کا نام <span className="text-red-500">*</span></Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="کلاس کا نام درج کریں"
                className="h-10 rounded-lg border-border/60 focus:border-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">ہجری سال <span className="text-red-500">*</span></Label>
              <Input
                value={formHijriYear}
                onChange={(e) => setFormHijriYear(e.target.value)}
                placeholder="مثلاً: 1446"
                className="h-10 rounded-lg border-border/60 focus:border-teal-500"
                dir="ltr"
              />
              <p className="text-[11px] text-muted-foreground">صرف ہجری سال لکھیں (مثلاً: 1446)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">کورسز (ایک سے زائد منتخب کر سکتے ہیں)</Label>
              {courses.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                  <BookOpen className="h-5 w-5 mx-auto mb-1 opacity-40" />
                  پہلے کورسز بنائیں
                </div>
              ) : (
                <div className="border rounded-xl p-2 max-h-48 overflow-y-auto custom-scrollbar bg-muted/10">
                  <div className="space-y-0.5">
                    {courses.map((course) => {
                      const isSelected = formCourseIds.includes(course.id)
                      return (
                        <label
                          key={course.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? "bg-gradient-to-l from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border border-teal-200 dark:border-teal-800/50"
                              : "hover:bg-accent border border-transparent"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCourse(course.id)}
                            className={isSelected ? "data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600" : ""}
                          />
                          <span className={`text-sm ${isSelected ? "font-medium text-teal-700 dark:text-teal-300" : ""}`}>{course.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
              {formCourseIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formCourseIds.map((cId) => {
                    const course = courses.find((c) => c.id === cId)
                    return course ? (
                      <Badge
                        key={cId}
                        className="text-[10px] px-2 py-0.5 bg-gradient-to-l from-teal-500 to-emerald-600 text-white border-0 font-medium shadow-sm"
                      >
                        {course.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
              <Label className="text-sm font-semibold">فعال</Label>
              <Switch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} className="rounded-lg">منسوخ</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 border-0 text-white hover:from-teal-700 hover:to-emerald-700 rounded-lg"
            >
              {editingClass ? "اپ ڈیٹ" : "بنائیں"}
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
              کلاس حذف کریں؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              کیا آپ واقعی &ldquo;{deletingClass?.name}&rdquo; کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا اور تمام متعلقہ ڈیٹا حذف ہو جائے گا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingClass && deleteMutation.mutate(deletingClass.id)}
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
