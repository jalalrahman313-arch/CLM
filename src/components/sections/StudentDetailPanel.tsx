"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, User, BookOpen, Calendar, CheckCircle2, XCircle, Clock, BarChart3 } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface StudentDetail {
  id: string
  rollNo: string
  name: string
  status: string
  enrolledAt: string
  classId: string
  className: string
  attendance: { id: string; date: string; status: string }[]
}

interface StudentDetailPanelProps {
  studentId: string
  onBack: () => void
}

export function StudentDetailPanel({ studentId, onBack }: StudentDetailPanelProps) {
  const { data, isLoading } = useQuery<{ data: StudentDetail }>({
    queryKey: ["student", studentId],
    queryFn: () => fetch(`/api/students/${studentId}`).then((r) => r.json()),
  })

  const student = data?.data

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-32 animate-pulse bg-muted rounded-xl" />
        <div className="h-64 animate-pulse bg-muted rounded-2xl" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        طالب علم کا ڈیٹا لوڈ نہیں ہو سکا
      </div>
    )
  }

  const attendanceRecords = student.attendance || []
  const presentCount = attendanceRecords.filter((a) => a.status === "حاضر").length
  const absentCount = attendanceRecords.filter((a) => a.status === "غیر حاضر").length
  const leaveCount = attendanceRecords.filter((a) => a.status === "رخصت").length
  const skipCount = attendanceRecords.filter((a) => a.status === "skip").length
  const totalRecords = attendanceRecords.length
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

  const pieData = [
    { name: "حاضر", value: presentCount, color: "#10b981" },
    { name: "غیر حاضر", value: absentCount, color: "#ef4444" },
    { name: "رخصت", value: leaveCount, color: "#f59e0b" },
    { name: "چھوڑ", value: skipCount, color: "#6b7280" },
  ].filter((d) => d.value > 0)

  const recentAttendance = attendanceRecords.slice(-10).reverse()

  return (
    <div className="space-y-5">
      {/* Back button and header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl gap-1.5">
          <ArrowRight className="h-4 w-4" />
          واپس
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-bold">{student.name}</h2>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="pro-card">
        <div className="h-1.5 bg-gradient-to-l from-teal-500 to-emerald-500" />
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">نام</p>
                <p className="font-medium text-sm">{student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">رول نمبر</p>
                <p className="font-mono text-sm" dir="ltr">{student.rollNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">کلاس</p>
                <p className="font-medium text-sm">{student.className}</p>
              </div>
            </div>
            <div className="flex items-center justify-center p-2.5 rounded-xl bg-muted/40">
              <Badge variant={student.status === "جاری" ? "default" : "secondary"} className="text-sm">
                {student.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-3d bg-card border p-4 text-center" style={{ '--accent-color': '#10b981' } as React.CSSProperties}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-500/25">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{presentCount}</p>
          <p className="text-xs text-muted-foreground">حاضر</p>
        </div>
        <div className="stat-3d bg-card border p-4 text-center" style={{ '--accent-color': '#ef4444' } as React.CSSProperties}>
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center mx-auto mb-2 shadow-md shadow-red-500/25">
            <XCircle className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{absentCount}</p>
          <p className="text-xs text-muted-foreground">غیر حاضر</p>
        </div>
        <div className="stat-3d bg-card border p-4 text-center" style={{ '--accent-color': '#f59e0b' } as React.CSSProperties}>
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center mx-auto mb-2 shadow-md shadow-amber-500/25">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{leaveCount}</p>
          <p className="text-xs text-muted-foreground">رخصت</p>
        </div>
        <div className="stat-3d bg-card border p-4 text-center" style={{ '--accent-color': '#10b981' } as React.CSSProperties}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-teal-500/25">
            <span className="text-white font-bold text-sm">{attendanceRate}%</span>
          </div>
          <Progress value={attendanceRate} className="h-2 mt-1" />
          <p className="text-xs text-muted-foreground mt-1.5">حاضری کی شرح</p>
        </div>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="card-3d bg-card border overflow-hidden">
          <div className="p-5 pb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              حاضری کا جائزہ
            </h3>
          </div>
          <CardContent className="px-5 pb-5">
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </div>
      )}

      {/* Recent Attendance */}
      {recentAttendance.length > 0 && (
        <div className="card-3d bg-card border overflow-hidden">
          <div className="p-5 pb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              حالیہ حاضری
            </h3>
          </div>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {recentAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-accent transition-colors">
                  <span className="text-sm font-mono" dir="ltr">{record.date}</span>
                  <Badge
                    variant={
                      record.status === "حاضر"
                        ? "default"
                        : record.status === "رخصت"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {record.status === "skip" ? "چھوڑ" : record.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </div>
      )}
    </div>
  )
}
