"use client"

import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Plus, Pencil, Trash2, Search, UserPlus, Eye, Users,
  Phone, Mail, Upload, FileDown, X, PlusCircle, MinusCircle,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { StudentDetailPanel } from "./StudentDetailPanel"
import { PremiumGuard } from "@/components/PremiumGuard"

interface StudentItem {
  id: string
  rollNo: string
  name: string
  phone?: string | null
  email?: string | null
  status: string
  enrolledAt: string
  classId: string
  className: string
}

interface ClassItem {
  id: string
  name: string
}

interface BulkRow {
  name: string
  phone: string
  email: string
}

export function StudentsSection() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [premiumGuardOpen, setPremiumGuardOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<StudentItem | null>(null)
  const [formName, setFormName] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formClassId, setFormClassId] = useState("")
  const [formStatus, setFormStatus] = useState("جاری")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterClassId, setFilterClassId] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null)

  // Bulk import states
  const [bulkClassId, setBulkClassId] = useState("")
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([{ name: "", phone: "", email: "" }])
  const csvInputRef = useRef<HTMLInputElement>(null)

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
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery)) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const bulkCreateMutation = useMutation({
    mutationFn: (body: { classId: string; students: BulkRow[] }) =>
      fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success(`${data.data.count} طلباء کامیابی سے شامل ہو گئے`)
      setBulkDialogOpen(false)
      setBulkRows([{ name: "", phone: "", email: "" }])
      setBulkClassId("")
    },
    onError: () => toast.error("بلک امپورٹ میں خرابی"),
  })

  const isPremium = user?.isPremium ?? false

  const openCreateDialog = () => {
    if (!isPremium && students.length >= 100) {
      setPremiumGuardOpen(true)
      return
    }
    setEditingStudent(null)
    setFormName("")
    setFormPhone("")
    setFormEmail("")
    setFormClassId("")
    setFormStatus("جاری")
    setDialogOpen(true)
  }

  const openEditDialog = (student: StudentItem) => {
    setEditingStudent(student)
    setFormName(student.name)
    setFormPhone(student.phone || "")
    setFormEmail(student.email || "")
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

    const body: Record<string, unknown> = {
      name: formName.trim(),
      classId: formClassId,
      status: formStatus,
    }
    if (formPhone.trim()) body.phone = formPhone.trim()
    if (formEmail.trim()) body.email = formEmail.trim()

    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, ...body })
    } else {
      createMutation.mutate(body)
    }
  }

  // Bulk import handlers
  const addBulkRow = () => {
    setBulkRows([...bulkRows, { name: "", phone: "", email: "" }])
  }

  const removeBulkRow = (index: number) => {
    if (bulkRows.length <= 1) return
    setBulkRows(bulkRows.filter((_, i) => i !== index))
  }

  const updateBulkRow = (index: number, field: keyof BulkRow, value: string) => {
    const updated = [...bulkRows]
    updated[index] = { ...updated[index], [field]: value }
    setBulkRows(updated)
  }

  const handleBulkSubmit = () => {
    if (!bulkClassId) {
      toast.error("کلاس کا انتخاب ضروری ہے")
      return
    }
    const validRows = bulkRows.filter((r) => r.name.trim())
    if (validRows.length === 0) {
      toast.error("کم از کم ایک طالب علم کا نام درج کریں")
      return
    }
    bulkCreateMutation.mutate({ classId: bulkClassId, students: validRows })
  }

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split("\n").filter((l) => l.trim())
        const parsed: BulkRow[] = []

        // Skip header row if it contains "name" or "نام"
        const startIndex = lines[0]?.toLowerCase().includes("name") || lines[0]?.includes("نام") ? 1 : 0

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""))
          if (parts[0]) {
            parsed.push({
              name: parts[0] || "",
              phone: parts[1] || "",
              email: parts[2] || "",
            })
          }
        }

        if (parsed.length === 0) {
          toast.error("CSV میں کوئی درست ڈیٹا نہیں ملا")
          return
        }

        setBulkRows(parsed)
        toast.success(`${parsed.length} طلباء کا ڈیٹا CSV سے لوڈ ہو گیا`)
      } catch {
        toast.error("CSV پڑھنے میں خرابی")
      }
    }
    reader.readAsText(file)
    if (csvInputRef.current) csvInputRef.current.value = ""
  }

  const handleDownloadTemplate = () => {
    const csv = "نام,فون,ای میل\nاحمد خان,0300-1234567,ahmed@example.com\nمحمد علی,0301-2345678,"
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "students-template.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast.success("ٹیمپلیٹ ڈاؤن لوڈ ہو رہی ہے")
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setBulkClassId("")
              setBulkRows([{ name: "", phone: "", email: "" }])
              setBulkDialogOpen(true)
            }}
            className="rounded-xl h-9 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/30"
          >
            <Upload className="h-4 w-4 ml-1.5" />
            بلک امپورٹ
          </Button>
          <Button onClick={openCreateDialog} className="btn-3d rounded-xl h-9">
            <Plus className="h-4 w-4 ml-2" />
            نیا طالب علم
          </Button>
        </div>
      </div>

      {/* ====== Compact Filter Bar ====== */}
      <div className="card-3d bg-card border p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="نام، رول نمبر، فون یا ای میل سے تلاش..."
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
                  <TableHead className="text-xs font-semibold text-muted-foreground">فون</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">ای میل</TableHead>
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
                    <TableCell className="text-xs text-muted-foreground">
                      {student.phone ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 cursor-pointer" dir="ltr">
                                <Phone className="h-3 w-3 text-teal-500 shrink-0" />
                                {student.phone}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span dir="ltr">{student.phone}</span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {student.email ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 cursor-pointer max-w-[120px] truncate" dir="ltr">
                                <Mail className="h-3 w-3 text-cyan-500 shrink-0" />
                                {student.email}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span dir="ltr">{student.email}</span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
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
              <Label className="text-xs font-semibold text-muted-foreground">نام *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="طالب علم کا نام درج کریں"
                className="h-9 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  فون
                  <span className="text-muted-foreground/50 font-normal">(آپشنل)</span>
                </Label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="h-9 rounded-lg"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  ای میل
                  <span className="text-muted-foreground/50 font-normal">(آپشنل)</span>
                </Label>
                <Input
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="student@email.com"
                  className="h-9 rounded-lg"
                  dir="ltr"
                  type="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">کلاس *</Label>
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

      {/* ====== Bulk Import Dialog ====== */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/20">
                <Upload className="h-4 w-4 text-white" />
              </div>
              بلک امپورٹ — طلباء
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 overflow-y-auto flex-1 custom-scrollbar">
            {/* Class Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">کلاس *</Label>
              <Select value={bulkClassId} onValueChange={setBulkClassId}>
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

            {/* CSV Import Section */}
            <div className="p-3 rounded-xl bg-muted/40 border border-dashed border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">CSV سے امپورٹ</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-teal-600 hover:text-teal-700"
                  onClick={handleDownloadTemplate}
                >
                  <FileDown className="h-3.5 w-3.5 ml-1" />
                  ٹیمپلیٹ ڈاؤن لوڈ
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs flex-1"
                  onClick={() => csvInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 ml-1" />
                  CSV فائل منتخب کریں
                </Button>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVImport}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                فارمیٹ: نام, فون, ای میل (ہر سطر ایک طالب علم)
              </p>
            </div>

            {/* Manual Entry Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">
                  دستی اندراج
                  <span className="text-muted-foreground/50 font-normal mr-1">({bulkRows.length} طلباء)</span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-teal-600"
                  onClick={addBulkRow}
                >
                  <PlusCircle className="h-3.5 w-3.5 ml-1" />
                  سطر شامل
                </Button>
              </div>

              {/* Header Row */}
              <div className="grid grid-cols-[1fr_120px_1fr_32px] gap-2 items-center px-1">
                <span className="text-[10px] font-semibold text-muted-foreground">نام *</span>
                <span className="text-[10px] font-semibold text-muted-foreground">فون</span>
                <span className="text-[10px] font-semibold text-muted-foreground">ای میل</span>
                <span />
              </div>

              {bulkRows.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_120px_1fr_32px] gap-2 items-center">
                  <Input
                    value={row.name}
                    onChange={(e) => updateBulkRow(index, "name", e.target.value)}
                    placeholder="نام"
                    className="h-8 text-xs rounded-lg"
                  />
                  <Input
                    value={row.phone}
                    onChange={(e) => updateBulkRow(index, "phone", e.target.value)}
                    placeholder="فون"
                    className="h-8 text-xs rounded-lg"
                    dir="ltr"
                  />
                  <Input
                    value={row.email}
                    onChange={(e) => updateBulkRow(index, "email", e.target.value)}
                    placeholder="ای میل"
                    className="h-8 text-xs rounded-lg"
                    dir="ltr"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => removeBulkRow(index)}
                    disabled={bulkRows.length <= 1}
                  >
                    <MinusCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setBulkDialogOpen(false)}
              className="rounded-lg h-9"
            >
              منسوخ
            </Button>
            <Button
              onClick={handleBulkSubmit}
              disabled={bulkCreateMutation.isPending}
              className="btn-3d rounded-lg h-9 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
            >
              {bulkCreateMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 ml-1.5 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />
                  شامل ہو رہے ہیں...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 ml-1.5" />
                  {bulkRows.filter((r) => r.name.trim()).length} طلباء شامل کریں
                </>
              )}
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
