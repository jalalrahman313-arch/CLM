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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search, UserPlus, Eye, Users } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { StudentDetailPanel } from "./StudentDetailPanel"
import { PremiumGuard } from "@/components/PremiumGuard"

interface StudentItem {
  id: string
  rollNo: string
  name: string
  status: string
  enrolledAt: string
  classId: string
  className: string
}

interface ClassItem {
  id: string
  name: string
}

export function StudentsSection() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [premiumGuardOpen, setPremiumGuardOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<StudentItem | null>(null)
  const [formName, setFormName] = useState("")
  const [formClassId, setFormClassId] = useState("")
  const [formStatus, setFormStatus] = useState("جاری")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterClassId, setFilterClassId] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null)

  const { data: studentsData, isLoading } = useQuery<{ data: StudentItem[] }>({
    queryKey: ["students"],
    queryFn: () => fetch("/api/students").then((r) => r.json()),
  })

  const { data: classesData } = useQuery<{ data: ClassItem[] }>({
    queryKey: ["classes"],
    queryFn: () => fetch("/api/classes").then((r) => r.json()),
  })

  const students = studentsData?.data || []
  const classes = classesData?.data || []

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name.includes(searchQuery) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = filterClassId === "all" || s.classId === filterClassId
    const matchesStatus = filterStatus === "all" || s.status === filterStatus
    return matchesSearch && matchesClass && matchesStatus
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success("طالب علم کامیابی سے شامل کیا گیا")
      closeDialog()
    },
    onError: () => toast.error("طالب علم شامل کرنے میں خرابی"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: unknown }) =>
      fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success("طالب علم کامیابی سے اپ ڈیٹ ہوا")
      closeDialog()
    },
    onError: () => toast.error("طالب علم اپ ڈیٹ میں خرابی"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/students/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success("طالب علم کامیابی سے حذف ہوا")
      setDeleteDialogOpen(false)
      setDeletingStudent(null)
    },
    onError: () => toast.error("طالب علم حذف کرنے میں خرابی"),
  })

  const isPremium = session?.user?.isPremium ?? false

  const openCreateDialog = () => {
    // Check premium limit: non-premium users can't add more than 100 students
    if (!isPremium && students.length >= 100) {
      setPremiumGuardOpen(true)
      return
    }
    setEditingStudent(null)
    setFormName("")
    setFormClassId("")
    setFormStatus("جاری")
    setDialogOpen(true)
  }

  const openEditDialog = (student: StudentItem) => {
    setEditingStudent(student)
    setFormName(student.name)
    setFormClassId(student.classId)
    setFormStatus(student.status)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingStudent(null)
  }

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error("طالب علم کا نام ضروری ہے")
      return
    }
    if (!formClassId) {
      toast.error("کلاس کا انتخاب ضروری ہے")
      return
    }

    const body = {
      name: formName.trim(),
      classId: formClassId,
      status: formStatus,
    }

    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, ...body })
    } else {
      createMutation.mutate(body)
    }
  }

  // If a student is selected, show detail panel
  if (selectedStudent) {
    return (
      <StudentDetailPanel
        studentId={selectedStudent.id}
        onBack={() => setSelectedStudent(null)}
      />
    )
  }

  // Compute counts for summary
  const activeCount = filteredStudents.filter((s) => s.status === "جاری").length
  const graduatedCount = filteredStudents.filter((s) => s.status === "فارغ").length

  return (
    <div className="space-y-5">
      {/* ====== Section Header ====== */}
      <div className="section-header">
        <div className="section-title">
          <div className="section-title-icon bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25">
            <Users className="h-4.5 w-4.5" />
          </div>
          طلباء
        </div>
        <Button onClick={openCreateDialog} className="btn-3d rounded-xl h-9">
          <Plus className="h-4 w-4 ml-2" />
          نیا طالب علم
        </Button>
      </div>

      {/* ====== Compact Filter Bar ====== */}
      <div className="card-3d bg-card border p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="نام یا رول نمبر سے تلاش..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 h-9 rounded-lg"
              />
            </div>
          </div>
          <Select value={filterClassId} onValueChange={setFilterClassId}>
            <SelectTrigger className="w-[170px] h-9 rounded-lg">
              <SelectValue placeholder="کلاس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">تمام کلاسز</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] h-9 rounded-lg">
              <SelectValue placeholder="حیثیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">تمام</SelectItem>
              <SelectItem value="جاری">جاری</SelectItem>
              <SelectItem value="فارغ">فارغ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mini summary row */}
        {filteredStudents.length > 0 && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">جاری:</span>
              <span className="font-bold">{activeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">فارغ:</span>
              <span className="font-bold">{graduatedCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs mr-auto">
              <span className="text-muted-foreground">کل:</span>
              <span className="font-bold">{filteredStudents.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* ====== Students Table ====== */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse bg-muted rounded-xl" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/10">
            <UserPlus className="h-10 w-10 text-teal-500" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">کوئی طالب علم نہیں ملا۔ نیا طالب علم شامل کریں۔</p>
        </div>
      ) : (
        <div className="pro-card overflow-hidden">
          <div className="h-1 bg-gradient-to-l from-teal-500 via-emerald-500 to-teal-600" />
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-muted-foreground">رول نمبر</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">نام</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">کلاس</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">حیثیت</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="group transition-colors hover:bg-accent/50">
                    <TableCell className="font-mono text-xs" dir="ltr">{student.rollNo}</TableCell>
                    <TableCell>
                      <button
                        className="font-medium text-sm hover:text-primary hover:underline underline-offset-4 decoration-primary/40 transition-colors"
                        onClick={() => setSelectedStudent(student)}
                      >
                        {student.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{student.className}</TableCell>
                    <TableCell>
                      <Badge
                        variant={student.status === "جاری" ? "default" : "secondary"}
                        className={
                          student.status === "جاری"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-2"
                            : "text-[10px] px-2"
                        }
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950/30 dark:hover:text-teal-400"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                          onClick={() => openEditDialog(student)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-red-50 text-destructive dark:hover:bg-red-950/30"
                          onClick={() => {
                            setDeletingStudent(student)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Premium Guard */}
      <PremiumGuard
        open={premiumGuardOpen}
        onOpenChange={setPremiumGuardOpen}
        feature="100 سے زیادہ طلباء شامل کرنا"
      />

      {/* ====== Create/Edit Dialog ====== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/20">
                {editingStudent ? (
                  <Pencil className="h-4 w-4 text-white" />
                ) : (
                  <UserPlus className="h-4 w-4 text-white" />
                )}
              </div>
              {editingStudent ? "طالب علم میں ترمیم" : "نیا طالب علم"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">نام</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="طالب علم کا نام درج کریں"
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">کلاس</Label>
              <Select value={formClassId} onValueChange={setFormClassId}>
                <SelectTrigger className="h-9 rounded-lg">
                  <SelectValue placeholder="کلاس منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">حیثیت</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger className="h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="جاری">جاری</SelectItem>
                  <SelectItem value="فارغ">فارغ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} className="rounded-lg h-9">منسوخ</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-3d rounded-lg h-9"
            >
              {editingStudent ? "اپ ڈیٹ" : "شامل کریں"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== Delete Confirmation ====== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              طالب علم حذف کریں؟
            </AlertDialogTitle>
            <AlertDialogDescription className="mr-10">
              کیا آپ واقعی &ldquo;{deletingStudent?.name}&rdquo; کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">منسوخ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingStudent && deleteMutation.mutate(deletingStudent.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              حذف کریں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
