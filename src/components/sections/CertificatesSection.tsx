"use client"

import { useState, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Award, Search, Download, FileText, Eye, Printer, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import { useAppSettings } from "@/hooks/use-app-settings"
import { useAuth } from "@/hooks/use-auth"
import { PremiumGuard } from "@/components/PremiumGuard"

interface StudentItem {
  id: string
  rollNo: string
  name: string
  status: string
  className: string
  classId: string
}

interface ClassItem {
  id: string
  name: string
}

interface CourseItem {
  id: string
  name: string
  skills: { id: string; name: string }[]
}

export function CertificatesSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterClassId, setFilterClassId] = useState<string>("all")
  const [previewStudent, setPreviewStudent] = useState<StudentItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [premiumGuardOpen, setPremiumGuardOpen] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)
  const { settings: appSettings } = useAppSettings()
  const { user } = useAuth()
  const isPremium = user?.isPremium ?? false

  const institutionName = appSettings.effectiveInstitutionName

  const { data: studentsData } = useQuery<{ data: StudentItem[] }>({
    queryKey: ["students"],
    queryFn: () => fetch("/api/students").then((r) => r.json()),
  })

  const { data: classesData } = useQuery<{ data: ClassItem[] }>({
    queryKey: ["classes"],
    queryFn: () => fetch("/api/classes").then((r) => r.json()),
  })

  const { data: coursesData } = useQuery<{ data: CourseItem[] }>({
    queryKey: ["courses"],
    queryFn: () => fetch("/api/courses").then((r) => r.json()),
  })

  const students = studentsData?.data || []
  const classes = classesData?.data || []
  const courses = coursesData?.data || []

  const classMap = new Map(classes.map((c) => [c.id, c.name]))

  const filteredStudents = students
    .filter((s) => s.status === "فارغ")
    .filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.name.includes(searchQuery) ||
        s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClass = filterClassId === "all" || s.classId === filterClassId
      return matchesSearch && matchesClass
    })

  const openPreview = (student: StudentItem) => {
    setPreviewStudent(student)
    setPreviewOpen(true)
  }

  const exportAsPNG = async () => {
    if (!certRef.current) return
    try {
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      })
      const link = document.createElement("a")
      link.download = `certificate-${previewStudent?.name || "student"}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
      toast.success("PNG ڈاؤن لوڈ ہو رہی ہے")
    } catch {
      toast.error("PNG ایکسپورٹ میں خرابی")
    }
  }

  const exportAsPDF = async () => {
    if (!isPremium) {
      setPremiumGuardOpen(true)
      return
    }
    if (!certRef.current) return
    try {
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("l", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = (pdfHeight - imgHeight * ratio) / 2
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      pdf.save(`certificate-${previewStudent?.name || "student"}.pdf`)
      toast.success("PDF ڈاؤن لوڈ ہو رہی ہے")
    } catch {
      toast.error("PDF ایکسپورٹ میں خرابی")
    }
  }

  const handlePrint = () => {
    if (!isPremium) {
      setPremiumGuardOpen(true)
      return
    }
    const printContent = certRef.current
    if (!printContent) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`
      <html dir="rtl">
        <head><title>سرٹیفکیٹ</title></head>
        <body style="margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;">
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-title">
          <span className="section-title-icon bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
            <GraduationCap className="h-4 w-4" />
          </span>
          سرٹیفکیٹ
        </div>
        <div className="text-xs text-muted-foreground" dir="ltr">
          {filteredStudents.length} فارغ طلباء
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="glass-card p-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="طالب علم تلاش کریں..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 h-8 text-xs"
              />
            </div>
          </div>
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
        </div>
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <Card className="card-3d border-0">
          <CardContent className="p-10 text-center">
            <div className="section-title-icon bg-gradient-to-br from-amber-500/20 to-orange-600/20 text-amber-600 mx-auto mb-4 w-16 h-16 rounded-2xl">
              <Award className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground text-sm">کوئی فارغ طالب علم نہیں ملا۔ سرٹیفکیٹ کے لیے طالب علم کا فارغ ہونا ضروری ہے۔</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pl-1">
          {filteredStudents.map((student, idx) => {
            const accentColors = [
              "from-teal-500 to-emerald-600",
              "from-amber-500 to-orange-600",
              "from-violet-500 to-purple-600",
              "from-rose-500 to-pink-600",
              "from-cyan-500 to-blue-600",
              "from-lime-500 to-green-600",
            ]
            const accent = accentColors[idx % accentColors.length]

            return (
              <Card key={student.id} className="pro-card border-0 overflow-hidden animate-fade-in group">
                {/* Gradient Accent Strip */}
                <div className={`h-1.5 bg-gradient-to-l ${accent}`} />
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`section-title-icon bg-gradient-to-br ${accent} text-white shadow-sm shrink-0`}>
                      <GraduationCap className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm truncate">{student.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">
                        {student.rollNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px] bg-muted/60">
                      {student.className}
                    </Badge>
                    <Button
                      size="sm"
                      className="btn-3d h-7 text-xs px-3 bg-gradient-to-l from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 border-0"
                      onClick={() => openPreview(student)}
                    >
                      <Eye className="h-3.5 w-3.5 ml-1" />
                      سرٹیفکیٹ دیکھیں
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Certificate Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="section-title-icon bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
                <Award className="h-4 w-4" />
              </span>
              سرٹیفکیٹ پیش نظارہ
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4 no-print">
            <Button onClick={exportAsPNG} size="sm" variant="outline" className="gap-1.5 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 dark:hover:bg-teal-950/30 dark:hover:text-teal-400">
              <Download className="h-3.5 w-3.5" />
              PNG
            </Button>
            <Button onClick={exportAsPDF} size="sm" variant="outline" className="gap-1.5 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-950/30 dark:hover:text-amber-400">
              <FileText className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button onClick={handlePrint} size="sm" variant="outline" className="gap-1.5 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300 dark:hover:bg-violet-950/30 dark:hover:text-violet-400">
              <Printer className="h-3.5 w-3.5" />
              پرنٹ
            </Button>
          </div>

          {/* Certificate Design */}
          <div ref={certRef}>
            <div className="certificate-container text-center p-8" style={{ minHeight: "400px" }}>
              {/* University Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-teal-800 mb-1" style={{ fontFamily: "inherit" }}>
                  {institutionName}
                </h1>
                <h2 className="text-lg text-teal-700 mb-1">
                  شعبہ علوم جدیدہ
                </h2>
                <div className="w-32 h-0.5 bg-teal-600 mx-auto my-3" />
              </div>

              {/* Certificate Title */}
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-teal-900 mb-2">
                  سرٹیفکیٹ
                </h3>
                <p className="text-teal-700">تکمیل کا سرٹیفکیٹ</p>
              </div>

              {/* Student Details */}
              <div className="mb-6">
                <p className="text-lg text-gray-600 mb-2">یہ سرٹیفکیٹ اس بات کی گواہی دیتا ہے کہ</p>
                <h4 className="text-2xl font-bold text-teal-800 mb-2 border-b-2 border-teal-400 inline-block pb-1">
                  {previewStudent?.name}
                </h4>
                <p className="text-gray-600 mt-3">
                  رول نمبر: <span className="font-mono font-bold" dir="ltr">{previewStudent?.rollNo}</span>
                </p>
              </div>

              {/* Course Details */}
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  نے کلاس <span className="font-bold text-teal-700">{previewStudent?.className}</span> میں
                </p>
                <div className="flex flex-wrap justify-center gap-2 my-3">
                  {courses.map((course) => (
                    <span
                      key={course.id}
                      className="bg-teal-50 border border-teal-200 px-3 py-1 rounded text-sm text-teal-800"
                    >
                      {course.name}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600">کامیابی سے مکمل کیا</p>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end mt-12 pt-6">
                <div className="text-center">
                  <div className="w-40 border-b border-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">مہتمم</p>
                  <p className="text-xs text-gray-500">{institutionName}</p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">ناظم شعبہ</p>
                  <p className="text-xs text-gray-500">شعبہ علوم جدیدہ</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium Guard */}
      <PremiumGuard
        open={premiumGuardOpen}
        onOpenChange={setPremiumGuardOpen}
        feature="PDF رپورٹ / پرنٹ"
      />
    </div>
  )
}
