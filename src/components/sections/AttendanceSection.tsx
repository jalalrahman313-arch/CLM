"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CheckSquare,
  Users,
  SkipForward,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  ClipboardCheck,
  HelpCircle,
  AlertCircle,
  CheckCheck,
  Ban,
} from "lucide-react"
import { toast } from "sonner"

interface ClassItem {
  id: string
  name: string
  hijriYear: string
  studentCount: number
}

interface StudentItem {
  id: string
  rollNo: string
  name: string
  status: string
  className: string
}

interface AttendanceRecord {
  id: string
  studentId: string
  status: string
  date: string
}

interface ClassStatusItem {
  classId: string
  className: string
  hijriYear: string
  isActive: boolean
  studentCount: number
  attendanceStatus: "taken" | "not_taken" | "no_class"
}

type AttendanceStatus = "حاضر" | "رخصت" | "غائب" | "skip"

export function AttendanceSection() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [userOverrides, setUserOverrides] = useState<Record<string, AttendanceStatus>>({})

  const { data: classesData } = useQuery<{ data: ClassItem[] }>({
    queryKey: ["classes"],
    queryFn: () => fetch("/api/classes").then((r) => r.json()),
  })

  // Fetch attendance status for all classes on selected date
  const { data: statusData } = useQuery<{ data: ClassStatusItem[] }>({
    queryKey: ["attendance-status", selectedDate],
    queryFn: () => fetch(`/api/attendance/status?date=${selectedDate}`).then((r) => r.json()),
    enabled: !!selectedDate,
  })

  const { data: studentsData, isLoading: studentsLoading } = useQuery<{ data: StudentItem[] }>({
    queryKey: ["students", selectedClassId],
    queryFn: () =>
      fetch(`/api/students?classId=${selectedClassId}`).then((r) => r.json()),
    enabled: !!selectedClassId,
  })

  const { data: attendanceData } = useQuery<{ data: AttendanceRecord[] }>({
    queryKey: ["attendance", selectedClassId, selectedDate],
    queryFn: () =>
      fetch(`/api/attendance?classId=${selectedClassId}&date=${selectedDate}`).then((r) => r.json()),
    enabled: !!selectedClassId && !!selectedDate,
  })

  const classes = classesData?.data || []
  const classStatuses = statusData?.data || []
  const students = (studentsData?.data || []).filter((s) => s.status === "جاری")
  const existingAttendance = attendanceData?.data || []

  // Build a status lookup map
  const statusMap = useMemo(() => {
    const map: Record<string, ClassStatusItem> = {}
    for (const cs of classStatuses) {
      map[cs.classId] = cs
    }
    return map
  }, [classStatuses])

  // Compute base map from API data (handle backward compat: 'غیر حاضر'/'غایب' → 'غائب')
  const baseMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {}
    for (const record of existingAttendance) {
      // Convert old 'غیر حاضر'/'غایب' to new 'غائب'
      const normalizedStatus = (record.status === "غیر حاضر" || record.status === "غایب") ? "غائب" : record.status
      map[record.studentId] = normalizedStatus as AttendanceStatus
    }
    return map
  }, [existingAttendance])

  // Merge base map with user overrides (user overrides take precedence)
  const attendanceMap = useMemo(() => {
    return { ...baseMap, ...userOverrides }
  }, [baseMap, userOverrides])

  // Reset overrides when class/date changes
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    setUserOverrides({})
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setUserOverrides({})
  }

  const bulkMutation = useMutation({
    mutationFn: (records: { studentId: string; classId: string; date: string; status: string }[]) =>
      fetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClassId, date: selectedDate, records }),
      }).then((r) => {
        if (!r.ok) throw new Error("خرابی")
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", selectedClassId, selectedDate] })
      queryClient.invalidateQueries({ queryKey: ["attendance-status", selectedDate] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setUserOverrides({})
      toast.success("حاضری کامیابی سے محفوظ ہوئی")
    },
    onError: () => toast.error("حاضری محفوظ کرنے میں خرابی"),
  })

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setUserOverrides((prev) => ({ ...prev, [studentId]: status }))
  }

  const markAllPresent = () => {
    const map: Record<string, AttendanceStatus> = {}
    for (const s of students) {
      map[s.id] = "حاضر"
    }
    setUserOverrides(map)
  }

  const skipDay = () => {
    const map: Record<string, AttendanceStatus> = {}
    for (const s of students) {
      map[s.id] = "skip"
    }
    setUserOverrides(map)
  }

  const handleSave = () => {
    if (!selectedClassId || !selectedDate) {
      toast.error("کلاس اور تاریخ منتخب کریں")
      return
    }

    const records = students.map((s) => ({
      studentId: s.id,
      classId: selectedClassId,
      date: selectedDate,
      status: attendanceMap[s.id] || "غائب",
    }))

    bulkMutation.mutate(records)
  }

  // Compute attendance summary
  const presentCount = students.filter((s) => attendanceMap[s.id] === "حاضر").length
  const leaveCount = students.filter((s) => attendanceMap[s.id] === "رخصت").length
  const absentCount = students.filter((s) => attendanceMap[s.id] === "غائب" || attendanceMap[s.id] === "غایب" || attendanceMap[s.id] === "غیر حاضر").length

  // Get status icon and colors for a class
  const getStatusDisplay = (status: "taken" | "not_taken" | "no_class") => {
    switch (status) {
      case "taken":
        return {
          icon: <CheckCheck className="h-4.5 w-4.5" />,
          bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
          textColor: "text-emerald-600 dark:text-emerald-400",
          borderColor: "border-emerald-300 dark:border-emerald-700",
          shadowColor: "shadow-emerald-500/15",
          label: "حاضری لگ چکی",
          ringColor: "ring-emerald-400/40",
        }
      case "not_taken":
        return {
          icon: <HelpCircle className="h-4.5 w-4.5" />,
          bgColor: "bg-amber-100 dark:bg-amber-900/30",
          textColor: "text-amber-600 dark:text-amber-400",
          borderColor: "border-amber-300 dark:border-amber-700",
          shadowColor: "shadow-amber-500/15",
          label: "حاضری باقی",
          ringColor: "ring-amber-400/40",
        }
      case "no_class":
        return {
          icon: <AlertCircle className="h-4.5 w-4.5" />,
          bgColor: "bg-red-100 dark:bg-red-900/20",
          textColor: "text-red-500 dark:text-red-400",
          borderColor: "border-red-300 dark:border-red-700/60",
          shadowColor: "shadow-red-500/15",
          label: "کلاس نہیں",
          ringColor: "ring-red-400/30",
        }
    }
  }

  return (
    <div className="space-y-5">
      {/* ====== Section Header ====== */}
      <div className="section-header">
        <div className="section-title">
          <div className="section-title-icon bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25">
            <ClipboardCheck className="h-4.5 w-4.5" />
          </div>
          حاضری
        </div>
      </div>

      {/* ====== Date Selector ====== */}
      <div className="card-3d bg-card border p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-teal-500" />
              تاریخ
            </Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-[180px] h-9 rounded-lg"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* ====== Class Cards Grid ====== */}
      {classStatuses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {classStatuses.map((cls) => {
            const isSelected = selectedClassId === cls.classId
            const statusDisplay = getStatusDisplay(cls.attendanceStatus)

            return (
              <button
                key={cls.classId}
                onClick={() => {
                  if (cls.attendanceStatus === "no_class") {
                    toast.error("یہ کلاس غیر فعال ہے")
                    return
                  }
                  handleClassChange(cls.classId)
                }}
                className={`
                  group relative text-right w-full rounded-xl border p-4 transition-all duration-200
                  ${isSelected
                    ? "bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 border-teal-400 dark:border-teal-600 shadow-lg shadow-teal-500/15 ring-2 ring-teal-400/40 scale-[1.01]"
                    : `bg-card border-border hover:border-${cls.attendanceStatus === "taken" ? "emerald" : cls.attendanceStatus === "not_taken" ? "amber" : "red"}-300 hover:shadow-md`
                  }
                `}
              >
                {/* Status Badge - Top Right */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold
                    ${statusDisplay.bgColor} ${statusDisplay.textColor} border ${statusDisplay.borderColor}
                    ring-1 ${statusDisplay.ringColor}
                  `}>
                    {statusDisplay.icon}
                    {statusDisplay.label}
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
                      <CheckCheck className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Class Name */}
                <h3 className="font-bold text-sm mb-1 truncate">{cls.className}</h3>

                {/* Bottom Info Row */}
                <div className="flex items-center gap-3">
                  {/* Student Count */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-5 h-5 rounded-md bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                      <Users className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="font-medium text-foreground" dir="ltr">{cls.studentCount}</span>
                    <span>طلباء</span>
                  </div>

                  {/* Hijri Year */}
                  {cls.hijriYear && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3 text-amber-500" />
                      <span className="font-medium text-amber-600 dark:text-amber-400" dir="ltr">{cls.hijriYear}</span>
                    </div>
                  )}
                </div>

                {/* No-class overlay effect */}
                {cls.attendanceStatus === "no_class" && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-50/30 to-transparent dark:from-red-900/10 dark:to-transparent pointer-events-none" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ====== Attendance Card ====== */}
      {selectedClassId && (
        <div className="pro-card">
          {/* Card Header with Gradient Accent */}
          <div className="h-1 bg-gradient-to-l from-teal-500 via-emerald-500 to-teal-600" />
          <div className="p-5">
            {/* Header Row */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <CalendarDays className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">حاضری</h3>
                  <p className="text-[11px] text-muted-foreground" dir="ltr">{selectedDate}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllPresent}
                  className="h-8 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                  سب حاضر
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipDay}
                  className="h-8 rounded-lg"
                >
                  <SkipForward className="h-3.5 w-3.5 ml-1" />
                  دن چھوڑیں
                </Button>
              </div>
            </div>

            {/* Attendance Summary Mini-Stats */}
            {students.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="stat-3d bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3 text-center" style={{ '--accent-color': '#10b981' } as React.CSSProperties}>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</p>
                  <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-medium">حاضر</p>
                </div>
                <div className="stat-3d bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-3 text-center" style={{ '--accent-color': '#f59e0b' } as React.CSSProperties}>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{leaveCount}</p>
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-medium">رخصت</p>
                </div>
                <div className="stat-3d bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 text-center" style={{ '--accent-color': '#ef4444' } as React.CSSProperties}>
                  <p className="text-lg font-bold text-red-500 dark:text-red-400">{absentCount}</p>
                  <p className="text-[10px] text-red-500/70 dark:text-red-400/70 font-medium">غائب</p>
                </div>
              </div>
            )}

            {/* Student List */}
            {studentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse bg-muted rounded-xl" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">اس کلاس میں کوئی فعال طالب علم نہیں</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {students.map((student, idx) => {
                  const currentStatus = attendanceMap[student.id] || ""
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/60 transition-all duration-200 group border border-transparent hover:border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center text-[10px] font-bold text-muted-foreground" dir="ltr">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground ml-1" dir="ltr">
                          {student.rollNo}
                        </span>
                        <span className="font-medium text-sm">{student.name}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant={currentStatus === "حاضر" ? "default" : "outline"}
                          className={
                            currentStatus === "حاضر"
                              ? "h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25 border-0"
                              : "h-8 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                          }
                          onClick={() => setStatus(student.id, "حاضر")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                          حاضر
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === "رخصت" ? "default" : "outline"}
                          className={
                            currentStatus === "رخصت"
                              ? "h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25 border-0"
                              : "h-8 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
                          }
                          onClick={() => setStatus(student.id, "رخصت")}
                        >
                          <Clock className="h-3.5 w-3.5 ml-1" />
                          رخصت
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === "غائب" ? "default" : "outline"}
                          className={
                            currentStatus === "غائب"
                              ? "h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/25 border-0"
                              : "h-8 rounded-lg border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                          }
                          onClick={() => setStatus(student.id, "غائب")}
                        >
                          <XCircle className="h-3.5 w-3.5 ml-1" />
                          غائب
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== Save Button ====== */}
      {selectedClassId && students.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={handleSave}
            disabled={bulkMutation.isPending}
            className="btn-3d px-10 h-11 text-base rounded-xl bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            size="lg"
          >
            <Save className="h-5 w-5 ml-2" />
            {bulkMutation.isPending ? "محفوظ ہو رہا ہے..." : "حاضری محفوظ کریں"}
          </Button>
        </div>
      )}

      {/* ====== Empty State ====== */}
      {classStatuses.length === 0 && (
        <div className="glass-card p-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/10">
            <CheckSquare className="h-10 w-10 text-teal-500" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">حاضری لینے کے لیے پہلے کلاس بنائیں۔</p>
        </div>
      )}
    </div>
  )
}
