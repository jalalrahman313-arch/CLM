"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardSettings } from "@/hooks/use-dashboard-settings"
import { useAppSettings } from "@/hooks/use-app-settings"
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Activity,
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

interface DashboardData {
  totalClasses: number
  activeStudents: number
  graduatedStudents: number
  totalCourses: number
  todayPresent: number
  skillsProgress: number
  weeklyAttendance: { date: string; day: string; present: number; absent: number; leave: number }[]
  tasksOverview: { pending: number; completed: number }
}

export function DashboardSection() {
  const { settings } = useDashboardSettings()
  const { settings: appSettings } = useAppSettings()

  const { data, isLoading } = useQuery<{ data: DashboardData }>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
  })

  const stats = data?.data
  const institutionName = appSettings.effectiveInstitutionName

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    )
  }

  const statCards = [
    { title: "کلاسز", value: stats?.totalClasses || 0, icon: Users, accentColor: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/30", iconBg: "bg-emerald-500" },
    { title: "فعال طلباء", value: stats?.activeStudents || 0, icon: UserCheck, accentColor: "#059669", bg: "bg-teal-50 dark:bg-teal-950/30", iconBg: "bg-teal-500" },
    { title: "فارغ", value: stats?.graduatedStudents || 0, icon: GraduationCap, accentColor: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/30", iconBg: "bg-amber-500" },
    { title: "کورسز", value: stats?.totalCourses || 0, icon: BookOpen, accentColor: "#06b6d4", bg: "bg-cyan-50 dark:bg-cyan-950/30", iconBg: "bg-cyan-500" },
  ]

  const weeklyData = stats?.weeklyAttendance || []
  const taskData = stats?.tasksOverview
    ? [
        { name: "زیر التواء", value: stats.tasksOverview.pending, color: "#f59e0b" },
        { name: "مکمل", value: stats.tasksOverview.completed, color: "#10b981" },
      ]
    : []

  const todayAttendanceRate = stats?.todayPresent && stats?.activeStudents
    ? Math.round((stats.todayPresent / stats.activeStudents) * 100)
    : 0

  const todayAbsent = (stats?.activeStudents || 0) - (stats?.todayPresent || 0)

  return (
    <div className="space-y-5">
      {/* ====== Welcome Hero Banner ====== */}
      <div className="gradient-card bg-gradient-to-l from-teal-600 via-emerald-600 to-teal-700 p-6 text-white relative rounded-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.06] pointer-events-none">
          <div className="absolute top-4 left-12 w-28 h-28 rounded-full bg-white" />
          <div className="absolute bottom-2 left-1/3 w-20 h-20 rounded-full bg-white" />
          <div className="absolute top-8 right-16 w-12 h-12 rounded-full bg-white" />
        </div>
        <div className="relative flex items-center justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-5 w-5 text-amber-300 shrink-0" />
              <h2 className="text-xl font-bold truncate">{institutionName}</h2>
            </div>
            <p className="text-sm opacity-80">لیب مینجمنٹ سسٹم میں خوش آمدید</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-xl text-center border border-white/20 min-w-[72px]">
              <p className="text-2xl font-bold leading-tight">{stats?.todayPresent || 0}</p>
              <p className="text-[10px] opacity-75 mt-0.5">حاضر</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-xl text-center border border-white/20 min-w-[72px]">
              <p className="text-2xl font-bold leading-tight">{todayAttendanceRate}%</p>
              <p className="text-[10px] opacity-75 mt-0.5">شرح</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-xl text-center border border-white/20 min-w-[72px]">
              <p className="text-2xl font-bold leading-tight">{todayAbsent}</p>
              <p className="text-[10px] opacity-75 mt-0.5">غایب</p>
            </div>
          </div>
        </div>
      </div>

      {/* ====== Stat Cards - Professional 3D ====== */}
      {settings.showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="stat-3d bg-card border p-5" style={{ '--accent-color': card.accentColor } as React.CSSProperties}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/20" />
                </div>
                <p className="text-3xl font-bold tracking-tight leading-none">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{card.title}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ====== Today's Attendance & Skills - Inline Cards ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {settings.showTodayAttendance && (
          <div className="card-3d bg-card border p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/25">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground font-medium">آج کی حاضری</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{stats?.todayPresent || 0}</span>
                    <span className="text-xs text-muted-foreground">/ {stats?.activeStudents || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={todayAttendanceRate} className="h-2 flex-1" />
                  <span className="text-xs font-bold text-primary min-w-[36px] text-left">{todayAttendanceRate}%</span>
                </div>
                <div className="flex gap-4 mt-2">
                  <span className="text-[11px] text-emerald-600 font-semibold">حاضر {stats?.todayPresent || 0}</span>
                  <span className="text-[11px] text-red-500 font-semibold">غایب {todayAbsent}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {settings.showSkillsProgress && (
          <div className="card-3d bg-card border p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground font-medium">اسکلز کی پیش رفت</p>
                  <span className="text-xl font-bold text-primary">{stats?.skillsProgress || 0}%</span>
                </div>
                <Progress value={stats?.skillsProgress || 0} className="h-2" />
                <p className="text-[11px] text-muted-foreground mt-2">
                  {stats?.skillsProgress === 100 ? "تمام اسکلز مکمل!" : "اسکلز جاری ہیں"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====== Charts ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {settings.showWeeklyChart && (
          <div className="card-3d bg-card border overflow-hidden">
            <div className="p-5 pb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                ہفتہ وار حاضری
              </h3>
            </div>
            <div className="px-5 pb-5">
              {weeklyData.length > 0 ? (
                <div className="h-52" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="day" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="present" name="حاضر" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" name="غیر حاضر" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="leave" name="رخصت" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
                  حاضری کا ڈیٹا دستیاب نہیں
                </div>
              )}
            </div>
          </div>
        )}

        {settings.showTasksChart && (
          <div className="card-3d bg-card border overflow-hidden">
            <div className="p-5 pb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <PieChartIcon className="h-4 w-4 text-white" />
                </div>
                ٹاسکس کا جائزہ
              </h3>
            </div>
            <div className="px-5 pb-5">
              {taskData.length > 0 && (taskData[0].value > 0 || taskData[1].value > 0) ? (
                <div className="h-52" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {taskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
                  ٹاسکس کا ڈیٹا دستیاب نہیں
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
