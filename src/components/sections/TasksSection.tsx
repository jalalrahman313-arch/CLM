"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, ClipboardList, CheckCircle2, Circle, ListTodo } from "lucide-react"
import { toast } from "sonner"

interface TaskItem {
  id: string
  title: string
  description: string
  status: string
  classId: string | null
  courseId: string | null
  createdAt: string
  class?: { name: string } | null
  course?: { name: string } | null
}

interface ClassItem {
  id: string
  name: string
}

interface CourseItem {
  id: string
  name: string
}

export function TasksSection() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formClassId, setFormClassId] = useState<string>("")
  const [formCourseId, setFormCourseId] = useState<string>("")
  const [formStatus, setFormStatus] = useState("Pending")
  const [filterClassId, setFilterClassId] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const { data: tasksData, isLoading } = useQuery<{ data: TaskItem[] }>({
    queryKey: ["tasks"],
    queryFn: () => fetch("/api/tasks").then((r) => r.json()),
  })

  const { data: classesData } = useQuery<{ data: ClassItem[] }>({
    queryKey: ["classes"],
    queryFn: () => fetch("/api/classes").then((r) => r.json()),
  })

  const { data: coursesData } = useQuery<{ data: CourseItem[] }>({
    queryKey: ["courses"],
    queryFn: () => fetch("/api/courses").then((r) => r.json()),
  })

  const tasks = tasksData?.data || []
  const classes = classesData?.data || []
  const courses = coursesData?.data || []

  const filteredTasks = tasks.filter((t) => {
    const matchesClass = filterClassId === "all" || t.classId === filterClassId
    const matchesStatus = filterStatus === "all" || t.status === filterStatus
    return matchesClass && matchesStatus
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("ٹاسک کامیابی سے بنایا گیا")
      closeDialog()
    },
    onError: () => toast.error("ٹاسک بنانے میں خرابی"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: unknown }) =>
      fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("ٹاسک کامیابی سے اپ ڈیٹ ہوا")
      closeDialog()
    },
    onError: () => toast.error("ٹاسک اپ ڈیٹ میں خرابی"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/tasks/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success("ٹاسک کامیابی سے حذف ہوا")
      setDeleteDialogOpen(false)
      setDeletingTask(null)
    },
    onError: () => toast.error("ٹاسک حذف کرنے میں خرابی"),
  })

  const toggleStatus = (task: TaskItem) => {
    const newStatus = task.status === "Pending" ? "Completed" : "Pending"
    updateMutation.mutate({
      id: task.id,
      title: task.title,
      description: task.description,
      status: newStatus,
      classId: task.classId,
      courseId: task.courseId,
    })
  }

  const openCreateDialog = () => {
    setEditingTask(null)
    setFormTitle("")
    setFormDescription("")
    setFormClassId("")
    setFormCourseId("")
    setFormStatus("Pending")
    setDialogOpen(true)
  }

  const openEditDialog = (task: TaskItem) => {
    setEditingTask(task)
    setFormTitle(task.title)
    setFormDescription(task.description)
    setFormClassId(task.classId || "")
    setFormCourseId(task.courseId || "")
    setFormStatus(task.status)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingTask(null)
  }

  const handleSubmit = () => {
    if (!formTitle.trim()) {
      toast.error("ٹاسک کا عنوان ضروری ہے")
      return
    }

    const body = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      classId: formClassId || null,
      courseId: formCourseId || null,
      status: formStatus,
    }

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, ...body })
    } else {
      createMutation.mutate(body)
    }
  }

  const pendingCount = tasks.filter((t) => t.status === "Pending").length
  const completedCount = tasks.filter((t) => t.status === "Completed").length

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-title">
          <span className="section-title-icon bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
            <ListTodo className="h-4 w-4" />
          </span>
          ٹاسکس
          {(pendingCount > 0 || completedCount > 0) && (
            <div className="flex gap-1.5 mr-2">
              {pendingCount > 0 && (
                <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0">
                  {pendingCount} زیر التواء
                </Badge>
              )}
              {completedCount > 0 && (
                <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0">
                  {completedCount} مکمل
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button onClick={openCreateDialog} className="btn-3d bg-gradient-to-l from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 border-0">
          <Plus className="h-4 w-4 ml-2" />
          نیا ٹاسک
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-3">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filterClassId} onValueChange={setFilterClassId}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="کلاس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">تمام کلاسز</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="حیثیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">تمام</SelectItem>
              <SelectItem value="Pending">زیر التواء</SelectItem>
              <SelectItem value="Completed">مکمل</SelectItem>
            </SelectContent>
          </Select>
          <div className="mr-auto text-xs text-muted-foreground" dir="ltr">
            {filteredTasks.length} / {tasks.length}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-20 animate-pulse bg-muted/50 card-3d" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="card-3d border-0">
          <CardContent className="p-10 text-center">
            <div className="section-title-icon bg-gradient-to-br from-violet-500/20 to-purple-600/20 text-violet-600 mx-auto mb-4 w-16 h-16 rounded-2xl">
              <ClipboardList className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground text-sm">کوئی ٹاسک نہیں ملا۔ نیا ٹاسک بنائیں۔</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={`pro-card border-0 animate-fade-in ${
                task.status === "Completed" ? "opacity-75" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleStatus(task)}
                      className="mt-0.5 shrink-0 transition-transform duration-200 hover:scale-110"
                    >
                      {task.status === "Completed" ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center hover:border-violet-400 transition-colors">
                          <Circle className="h-3 w-3 text-muted-foreground/40" />
                        </div>
                      )}
                    </button>
                    <div className="min-w-0">
                      <h3
                        className={`font-medium text-sm ${
                          task.status === "Completed" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {task.class?.name && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-0">
                            {task.class.name}
                          </Badge>
                        )}
                        {task.course?.name && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {task.course.name}
                          </Badge>
                        )}
                        {task.status === "Completed" ? (
                          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0">
                            مکمل
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0">
                            زیر التواء
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/30 dark:hover:text-violet-400"
                      onClick={() => openEditDialog(task)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                      onClick={() => {
                        setDeletingTask(task)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "ٹاسک میں ترمیم" : "نیا ٹاسک"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="ٹاسک کا عنوان"
              />
            </div>
            <div className="space-y-2">
              <Label>تفصیل</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="تفصیل درج کریں"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>کلاس</Label>
                <Select value={formClassId} onValueChange={setFormClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>کورس</Label>
                <Select value={formCourseId} onValueChange={setFormCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>حیثیت</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">زیر التواء</SelectItem>
                  <SelectItem value="Completed">مکمل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>منسوخ</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-l from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 border-0"
            >
              {editingTask ? "اپ ڈیٹ" : "بنائیں"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ٹاسک حذف کریں؟</AlertDialogTitle>
            <AlertDialogDescription>
              کیا آپ واقعی &ldquo;{deletingTask?.title}&rdquo; کو حذف کرنا چاہتے ہیں؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTask && deleteMutation.mutate(deletingTask.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف کریں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
