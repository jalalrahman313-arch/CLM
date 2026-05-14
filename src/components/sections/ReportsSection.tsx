"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  FileBarChart,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  CalendarDays,
  School,
  AlertTriangle,
  BarChart3,
  UserX,
  UserCheck,
  FlaskConical,
  GraduationCap,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { PremiumGuard } from "@/components/PremiumGuard"
import { useAppSettings } from "@/hooks/use-app-settings"

interface ReportData {
  attendanceMetrics: {
    total: number
    present: number
    absent: number
    leave: number
    attendanceRate: number
  }
  dailyTrends: { date: string; present: number; absent: number; leave: number; total: number }[]
  monthlyTrends: { month: string; present: number; absent: number; leave: number; total: number }[]
  classSummaries: { classId: string; className: string; present: number; absent: number; leave: number; total: number; attendanceRate: number; studentCount: number }[]
  studentAbsenceList: { studentId: string; studentName: string; rollNo: string; studentStatus: string; className: string; total: number; absent: number; absenceRate: number; attendanceRate: number; present: number; leave: number }[]
  studentAttendanceList: { studentId: string; studentName: string; rollNo: string; studentStatus: string; className: string; classId: string; total: number; present: number; absent: number; leave: number; attendanceRate: number; absenceRate: number }[]
  skillMetrics: {
    total: number
    completed: number
    inProgress: number
    pending: number
    completionRate: number
  }
  totalDays: number
  totalStudents: number
  totalClasses: number
}

interface ClassItem {
  id: string
  name: string
}

interface StudentItem {
  id: string
  name: string
  rollNo: string
  className: string
}

export function ReportsSection() {
  const { data: session } = useSession()
  const isPremium = session?.user?.isPremium ?? false
  const [premiumGuardOpen, setPremiumGuardOpen] = useState(false)
  const { settings: appSettings } = useAppSettings()
  const institutionName = appSettings.effectiveInstitutionName

  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const [startDate, setStartDate] = useState(thirtyDaysAgo)
  const [endDate, setEndDate] = useState(today)
  const [filterClassId, setFilterClassId] = useState<string>("all")
  const [filterStudentId, setFilterStudentId] = useState<string>("all")
  const [generateReport, setGenerateReport] = useState(false)

  const { data: classesData } = useQuery<{ data: ClassItem[] }>({
    queryKey: ["classes"],
    queryFn: () => fetch("/api/classes").then((r) => r.json()),
  })

  const { data: studentsData } = useQuery<{ data: StudentItem[] }>({
    queryKey: ["students", filterClassId],
    queryFn: () =>
      fetch(`/api/students${filterClassId !== "all" ? `?classId=${filterClassId}` : ""}`).then((r) => r.json()),
    enabled: filterClassId !== "all",
  })

  const classes = classesData?.data || []
  const studentsInClass = studentsData?.data || []

  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)
  if (filterClassId !== "all") params.set("classId", filterClassId)
  if (filterStudentId !== "all") params.set("studentId", filterStudentId)

  const { data: reportData, isLoading } = useQuery<{ data: ReportData }>({
    queryKey: ["reports", startDate, endDate, filterClassId, filterStudentId],
    queryFn: () => fetch(`/api/reports?${params.toString()}`).then((r) => r.json()),
    enabled: generateReport && !!startDate && !!endDate,
  })

  const report = reportData?.data

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      toast.error("تاریخ کی حد منتخب کریں")
      return
    }
    setGenerateReport(true)
  }

  const handleExportCSV = () => {
    if (!isPremium) {
      setPremiumGuardOpen(true)
      return
    }
    if (!report) return

    const rows: string[][] = []

    // Header
    rows.push([institutionName])
    rows.push(["حاضری کی تفصیلی رپورٹ"])
    rows.push([`دورانیہ: ${startDate} سے ${endDate} تک`])
    rows.push([])

    // Per-class detailed breakdown
    for (const cls of report.classSummaries) {
      rows.push([`=== کلاس: ${cls.className} ===`])
      rows.push(["طلباء", String(cls.studentCount), "حاضر", String(cls.present), "غیر حاضر", String(cls.absent), "رخصت", String(cls.leave), "شرح", `${cls.attendanceRate}%`])
      rows.push([])

      rows.push(["#", "نام", "رول نمبر", "حاضر", "غیر حاضر", "رخصت", "کل", "حاضری شرح", "غیر حاضری شرح"])
      const classStudents = report.studentAttendanceList.filter(s => s.classId === cls.classId)
      classStudents.forEach((s, idx) => {
        rows.push([
          String(idx + 1),
          s.studentName,
          s.rollNo,
          String(s.present),
          String(s.absent),
          String(s.leave),
          String(s.total),
          `${s.attendanceRate}%`,
          `${s.absenceRate}%`,
        ])
      })
      rows.push([])
    }

    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `attendance-report-${startDate}-${endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV ڈاؤن لوڈ ہو رہی ہے")
  }

  const handlePrint = () => {
    if (!isPremium) {
      setPremiumGuardOpen(true)
      return
    }
    window.print()
  }

  const attendancePie = report
    ? [
        { name: "حاضر", value: report.attendanceMetrics.present, color: "#10b981" },
        { name: "غیر حاضر", value: report.attendanceMetrics.absent, color: "#ef4444" },
        { name: "رخصت", value: report.attendanceMetrics.leave, color: "#f59e0b" },
      ].filter((d) => d.value > 0)
    : []

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("ur-PK", { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return dateStr
    }
  }

  // Group students by class for per-class breakdown
  const studentsByClass = report
    ? report.classSummaries.map(cls => ({
        ...cls,
        students: report.studentAttendanceList.filter(s => s.classId === cls.classId),
      }))
    : []

  return (
    <div className="space-y-5 print-area">
      {/* ====== PRINT HEADER (only visible in print) ====== */}
      <div className="hidden print:block" style={{ marginBottom: '12px' }}>
        <div className="text-center" style={{ borderBottom: '3px solid #0d9488', paddingBottom: '10px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>ل</span>
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0d9488' }}>{institutionName}</h1>
          </div>
          <h2 style={{ fontSize: '14px', color: '#0d9488', marginBottom: '2px' }}>حاضری کی تفصیلی رپورٹ (کلاس وائز)</h2>
          <p style={{ fontSize: '10px', color: '#666' }}>
            {formatDate(startDate)} سے {formatDate(endDate)} تک &nbsp;|&nbsp;
            {report?.totalDays || 0} دن &nbsp;|&nbsp;
            {report?.totalStudents || 0} طلباء &nbsp;|&nbsp;
            {report?.totalClasses || 0} کلاسز
          </p>
        </div>
      </div>

      {/* ====== Section Header (screen only) ====== */}
      <div className="section-header no-print">
        <div className="section-title">
          <div className="section-title-icon bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
            <FileBarChart className="h-4 w-4" />
          </div>
          رپورٹس
        </div>
      </div>

      {/* ====== Filters Card (screen only) ====== */}
      <div className="pro-card no-print">
        <div className="h-1.5 bg-gradient-to-l from-teal-500 to-emerald-500" />
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <CalendarDays className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">فلٹرز</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">شروع تاریخ</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} dir="ltr" className="h-9 text-sm rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">آخری تاریخ</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} dir="ltr" className="h-9 text-sm rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">کلاس</Label>
              <Select value={filterClassId} onValueChange={(v) => { setFilterClassId(v); setFilterStudentId("all") }}>
                <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue placeholder="کلاس" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">تمام کلاسز</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {filterClassId !== "all" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">طالب علم</Label>
                <Select value={filterStudentId} onValueChange={setFilterStudentId}>
                  <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue placeholder="طالب علم" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">تمام طلباء</SelectItem>
                    {studentsInClass.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleGenerate} className="h-9 text-sm btn-3d bg-gradient-to-r from-teal-600 to-emerald-600 border-0 text-white hover:from-teal-700 hover:to-emerald-700 rounded-lg">
              <FileBarChart className="h-4 w-4 ml-1" />
              رپورٹ بنائیں
            </Button>
          </div>
        </CardContent>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 no-print">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="stat-3d bg-card border rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      )}

      {report && !isLoading && (
        <>
          <PremiumGuard open={premiumGuardOpen} onOpenChange={setPremiumGuardOpen} feature="PDF رپورٹ جنریٹ کرنا" />

          {/* ====== Action Buttons (screen only) ====== */}
          <div className="flex gap-2 no-print">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 text-xs rounded-lg border-border/60 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400">
              <Download className="h-3.5 w-3.5 ml-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-xs rounded-lg border-border/60 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 dark:hover:bg-teal-900/20 dark:hover:text-teal-400">
              <Printer className="h-3.5 w-3.5 ml-1" />
              پرنٹ
            </Button>
          </div>

          {/* ============ OVERALL SUMMARY BAR ============ */}
          <div className="grid grid-cols-5 gap-3 print-no-break">
            <div className="stat-3d text-center p-3 rounded-xl bg-card border" style={{ '--accent-color': '#0d9488' } as React.CSSProperties}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <p className="text-xl font-bold leading-tight">{report.attendanceMetrics.attendanceRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">حاضری شرح</p>
            </div>
            <div className="stat-3d text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800" style={{ '--accent-color': '#10b981' } as React.CSSProperties}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <p className="text-xl font-bold text-emerald-600 leading-tight">{report.attendanceMetrics.present}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">حاضر</p>
            </div>
            <div className="stat-3d text-center p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" style={{ '--accent-color': '#ef4444' } as React.CSSProperties}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                <XCircle className="h-4 w-4 text-white" />
              </div>
              <p className="text-xl font-bold text-red-600 leading-tight">{report.attendanceMetrics.absent}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">غیر حاضر</p>
            </div>
            <div className="stat-3d text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" style={{ '--accent-color': '#f59e0b' } as React.CSSProperties}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <p className="text-xl font-bold text-amber-600 leading-tight">{report.attendanceMetrics.leave}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">رخصت</p>
            </div>
            <div className="stat-3d text-center p-3 rounded-xl bg-muted/30 border" style={{ '--accent-color': '#6b7280' } as React.CSSProperties}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <p className="text-xl font-bold leading-tight">{report.attendanceMetrics.total}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">کل ریکارڈز</p>
            </div>
          </div>

          {/* ============ CHARTS (screen only) ============ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 no-print">
            <div className="pro-card">
              <div className="h-1 bg-gradient-to-l from-teal-500 to-emerald-500" />
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                    <BarChart3 className="h-3.5 w-3.5 text-white" />
                  </div>
                  یومیہ رجحانات
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {report.dailyTrends.length > 0 ? (
                  <div className="h-44" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report.dailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" fontSize={10} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="present" name="حاضر" fill="#10b981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="absent" name="غیر حاضر" fill="#ef4444" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="leave" name="رخصت" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-6">ڈیٹا دستیاب نہیں</p>
                )}
              </CardContent>
            </div>

            <div className="pro-card">
              <div className="h-1 bg-gradient-to-l from-teal-500 to-emerald-500" />
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                    <FileBarChart className="h-3.5 w-3.5 text-white" />
                  </div>
                  حاضری کا تناسب
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {attendancePie.length > 0 ? (
                  <div className="h-44" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendancePie}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {attendancePie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-6">ڈیٹا دستیاب نہیں</p>
                )}
              </CardContent>
            </div>
          </div>

          {/* ============ PER-CLASS DETAILED BREAKDOWN ============ */}
          {studentsByClass.length > 0 && (
            <div className="space-y-5">
              <div className="text-center no-print">
                <h3 className="text-base font-bold text-primary flex items-center justify-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                    <School className="h-4 w-4 text-white" />
                  </div>
                  کلاس وائز تفصیلی رپورٹ
                </h3>
              </div>

              {studentsByClass.map((cls, clsIndex) => (
                <div
                  key={cls.classId}
                  className={`pro-card overflow-hidden print-class-section ${clsIndex > 0 ? 'print-break-before' : ''}`}
                >
                  {/* Class Header - Gradient with icon */}
                  <div className="bg-gradient-to-l from-teal-600 to-emerald-600 px-4 py-3 text-white print:bg-gray-100 print:text-black print:border-b print:border-gray-300">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center print:bg-teal-100 shadow-sm">
                          <School className="h-5 w-5 print:text-teal-700" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">{cls.className}</h4>
                          <p className="text-[10px] opacity-80 print:text-gray-600">{cls.studentCount} طلباء</p>
                        </div>
                      </div>
                      <div className="flex gap-2 text-center">
                        <div className="bg-white/20 px-3 py-1.5 rounded-lg print:bg-teal-50 print:border print:border-teal-200 backdrop-blur-sm">
                          <p className="text-sm font-bold print:text-teal-700 leading-tight">{cls.attendanceRate}%</p>
                          <p className="text-[9px] opacity-80 print:text-teal-600">شرح</p>
                        </div>
                        <div className="bg-white/20 px-3 py-1.5 rounded-lg print:bg-emerald-50 print:border print:border-emerald-200 backdrop-blur-sm">
                          <p className="text-sm font-bold print:text-emerald-700 leading-tight">{cls.present}</p>
                          <p className="text-[9px] opacity-80 print:text-emerald-600">حاضر</p>
                        </div>
                        <div className="bg-white/20 px-3 py-1.5 rounded-lg print:bg-red-50 print:border print:border-red-200 backdrop-blur-sm">
                          <p className="text-sm font-bold print:text-red-700 leading-tight">{cls.absent}</p>
                          <p className="text-[9px] opacity-80 print:text-red-600">غیرحاضر</p>
                        </div>
                        <div className="bg-white/20 px-3 py-1.5 rounded-lg print:bg-amber-50 print:border print:border-amber-200 backdrop-blur-sm">
                          <p className="text-sm font-bold print:text-amber-700 leading-tight">{cls.leave}</p>
                          <p className="text-[9px] opacity-80 print:text-amber-600">رخصت</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Summary Bar (screen only) */}
                  <div className="grid grid-cols-3 border-b no-print">
                    <div className="text-center py-2 bg-emerald-50/50 dark:bg-emerald-950/10 border-l">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <UserCheck className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {cls.present}
                        </span>
                      </div>
                      <div className="w-full bg-emerald-200 dark:bg-emerald-900 h-1 mt-1 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-l from-emerald-400 to-green-500 h-1 transition-all rounded-full" style={{ width: `${cls.total > 0 ? (cls.present / cls.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="text-center py-2 bg-red-50/50 dark:bg-red-950/10 border-l">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <UserX className="h-3 w-3 text-red-600" />
                        </div>
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                          {cls.absent}
                        </span>
                      </div>
                      <div className="w-full bg-red-200 dark:bg-red-900 h-1 mt-1 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-l from-red-400 to-rose-500 h-1 transition-all rounded-full" style={{ width: `${cls.total > 0 ? (cls.absent / cls.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="text-center py-2 bg-amber-50/50 dark:bg-amber-950/10 border-l">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Clock className="h-3 w-3 text-amber-600" />
                        </div>
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                          {cls.leave}
                        </span>
                      </div>
                      <div className="w-full bg-amber-200 dark:bg-amber-900 h-1 mt-1 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-l from-amber-400 to-yellow-500 h-1 transition-all rounded-full" style={{ width: `${cls.total > 0 ? (cls.leave / cls.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Student Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-l from-muted/40 to-muted/20 hover:from-muted/40 hover:to-muted/20 border-b">
                          <TableHead className="w-8 text-center text-xs h-9 font-semibold">#</TableHead>
                          <TableHead className="text-xs h-9 font-semibold">نام</TableHead>
                          <TableHead className="text-xs h-9 font-semibold">رول</TableHead>
                          <TableHead className="text-center text-xs h-9 font-semibold">
                            <div className="flex items-center justify-center gap-1">
                              <UserCheck className="h-3 w-3 text-emerald-600" />
                              <span>حاضر</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center text-xs h-9 font-semibold">
                            <div className="flex items-center justify-center gap-1">
                              <UserX className="h-3 w-3 text-red-600" />
                              <span>غ.حاضر</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center text-xs h-9 font-semibold">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span>رخصت</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center text-xs h-9 font-semibold">کل</TableHead>
                          <TableHead className="text-center text-xs h-9 font-semibold">شرح</TableHead>
                          <TableHead className="text-center text-xs h-9 font-semibold">غ.شرح</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cls.students.map((s, idx) => (
                          <TableRow key={s.studentId} className={`text-xs transition-colors ${s.absenceRate > 30 ? "bg-red-50/50 dark:bg-red-950/20" : "hover:bg-muted/20"}`}>
                            <TableCell className="text-center text-muted-foreground py-2">{idx + 1}</TableCell>
                            <TableCell className="font-medium py-2">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${s.attendanceRate >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : s.attendanceRate >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                  {s.studentName.charAt(0)}
                                </div>
                                {s.studentName}
                                {s.absenceRate > 30 && (
                                  <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-[11px] py-2" dir="ltr">{s.rollNo}</TableCell>
                            <TableCell className="text-center py-2">
                              <span className="font-semibold text-emerald-600">{s.present}</span>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <span className={`font-semibold ${s.absent > 0 ? "text-red-600" : "text-muted-foreground"}`}>{s.absent}</span>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <span className={`font-semibold ${s.leave > 0 ? "text-amber-600" : "text-muted-foreground"}`}>{s.leave}</span>
                            </TableCell>
                            <TableCell className="text-center font-medium py-2">{s.total}</TableCell>
                            <TableCell className="text-center py-2">
                              <Badge
                                variant={s.attendanceRate >= 80 ? "default" : s.attendanceRate >= 50 ? "secondary" : "destructive"}
                                className={`text-[10px] px-2 py-0 min-w-[38px] font-semibold ${
                                  s.attendanceRate >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : ""
                                }`}
                              >
                                {s.attendanceRate}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <Badge
                                variant={s.absenceRate > 30 ? "destructive" : "outline"}
                                className={`text-[10px] px-2 py-0 min-w-[38px] font-semibold ${
                                  s.absenceRate > 30 ? "" : "border-border/60"
                                }`}
                              >
                                {s.absenceRate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Class Totals */}
                        <TableRow className="font-bold bg-gradient-to-l from-muted/30 to-muted/10 border-t-2 text-xs">
                          <TableCell colSpan={3} className="py-2">کلاس کل</TableCell>
                          <TableCell className="text-center text-emerald-600 py-2">{cls.present}</TableCell>
                          <TableCell className="text-center text-red-600 py-2">{cls.absent}</TableCell>
                          <TableCell className="text-center text-amber-600 py-2">{cls.leave}</TableCell>
                          <TableCell className="text-center py-2">{cls.total}</TableCell>
                          <TableCell className="text-center py-2">
                            <Badge variant={cls.attendanceRate >= 80 ? "default" : "destructive"} className="text-[10px] px-2 py-0 font-semibold">
                              {cls.attendanceRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold border-border/60">
                              {cls.total > 0 ? Math.round((cls.absent / cls.total) * 100) : 0}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============ High Absence Alert ============ */}
          {report.studentAbsenceList.filter(s => s.absenceRate > 30).length > 0 && (
            <div className={`pro-card overflow-hidden shadow-sm print-break-before`}>
              <div className="h-1.5 bg-gradient-to-l from-red-500 to-rose-500" />
              <div className="bg-gradient-to-l from-red-600 to-rose-600 px-4 py-2.5 text-white flex items-center gap-2 print:bg-red-100 print:text-red-800">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center print:bg-red-200">
                  <AlertTriangle className="h-4 w-4 print:text-red-700" />
                </div>
                <h3 className="text-sm font-bold flex-1">زیادہ غیر حاضری</h3>
                <Badge className="bg-white/20 text-white border-0 text-[10px] px-2.5 py-0.5 print:bg-red-200 print:text-red-800 font-semibold">
                  {report.studentAbsenceList.filter(s => s.absenceRate > 30).length}
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50/50 dark:hover:bg-red-950/10">
                      <TableHead className="text-xs h-9 font-semibold">نام</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">رول</TableHead>
                      <TableHead className="text-xs h-9 font-semibold">کلاس</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">حاضر</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">غ.حاضر</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">رخصت</TableHead>
                      <TableHead className="text-center text-xs h-9 font-semibold">غ.شرح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.studentAbsenceList
                      .filter(s => s.absenceRate > 30)
                      .map((s) => (
                        <TableRow key={s.studentId} className="bg-red-50/30 dark:bg-red-950/10 text-xs hover:bg-red-50/50 dark:hover:bg-red-950/20">
                          <TableCell className="font-medium py-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-[10px] font-bold text-red-700 dark:text-red-400 shrink-0">
                                {s.studentName.charAt(0)}
                              </div>
                              <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                              {s.studentName}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] py-2" dir="ltr">{s.rollNo}</TableCell>
                          <TableCell className="py-2">{s.className}</TableCell>
                          <TableCell className="text-center text-emerald-600 py-2">{s.present}</TableCell>
                          <TableCell className="text-center text-red-600 font-bold py-2">{s.absent}</TableCell>
                          <TableCell className="text-center text-amber-600 py-2">{s.leave}</TableCell>
                          <TableCell className="text-center py-2">
                            <Badge variant="destructive" className="text-[10px] px-2 py-0 font-semibold">{s.absenceRate}%</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ============ Skill Metrics ============ */}
          {report.skillMetrics.total > 0 && (
            <div className="pro-card print-no-break">
              <div className="h-1.5 bg-gradient-to-l from-teal-500 to-emerald-500" />
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                    <GraduationCap className="h-3.5 w-3.5 text-white" />
                  </div>
                  اسکلز کا جائزہ
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-5 gap-3">
                  <div className="stat-3d text-center p-2.5 rounded-lg bg-muted/40" style={{ '--accent-color': '#6b7280' } as React.CSSProperties}>
                    <p className="text-lg font-bold leading-tight">{report.skillMetrics.total}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">کل</p>
                  </div>
                  <div className="stat-3d text-center p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30" style={{ '--accent-color': '#10b981' } as React.CSSProperties}>
                    <p className="text-lg font-bold text-emerald-600 leading-tight">{report.skillMetrics.completed}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">مکمل</p>
                  </div>
                  <div className="stat-3d text-center p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30" style={{ '--accent-color': '#f59e0b' } as React.CSSProperties}>
                    <p className="text-lg font-bold text-amber-600 leading-tight">{report.skillMetrics.inProgress}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">جاری</p>
                  </div>
                  <div className="stat-3d text-center p-2.5 rounded-lg bg-muted/30" style={{ '--accent-color': '#6b7280' } as React.CSSProperties}>
                    <p className="text-lg font-bold text-muted-foreground leading-tight">{report.skillMetrics.pending}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">منتظر</p>
                  </div>
                  <div className="stat-3d text-center p-2.5 rounded-lg bg-primary/5" style={{ '--accent-color': '#0d9488' } as React.CSSProperties}>
                    <p className="text-lg font-bold text-primary leading-tight">{report.skillMetrics.completionRate}%</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">تکمیل</p>
                  </div>
                </div>
              </CardContent>
            </div>
          )}

          {/* ============ PRINT FOOTER (only visible in print) ============ */}
          <div className="hidden print:block" style={{ marginTop: '1.5rem', borderTop: '1px solid #d1d5db', paddingTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#999' }}>
              <p>رپورٹ بنانے کی تاریخ: {new Date().toLocaleDateString("ur-PK")}</p>
              <p>{institutionName} - لیب مینجمنٹ سسٹم</p>
            </div>
          </div>
        </>
      )}

      {!generateReport && !isLoading && (
        <div className="pro-card no-print">
          <div className="h-1.5 bg-gradient-to-l from-teal-400 to-emerald-400" />
          <CardContent className="p-10 text-center text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <FileBarChart className="h-8 w-8 text-teal-500 opacity-50" />
            </div>
            <p className="text-base font-medium mb-1">رپورٹ بنائیں</p>
            <p className="text-sm opacity-70">تاریخ کی حد منتخب کریں اور &ldquo;رپورٹ بنائیں&rdquo; پر کلک کریں</p>
          </CardContent>
        </div>
      )}
    </div>
  )
}
