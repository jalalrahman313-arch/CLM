"use client"

import { useQuery } from "@tanstack/react-query"
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
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    )
  }

  const statCards = [
    { title: "کلاسز", value: stats?.totalClasses || 0, icon: Users, accentColor: "#10b981", iconBg: "bg-emerald-500", iconSectionBg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { title: "فعال طلباء", value: stats?.activeStudents || 0, icon: UserCheck, accentColor: "#059669", iconBg: "bg-teal-500", iconSectionBg: "bg-teal-50 dark:bg-teal-950/40" },
    { title: "فارغ", value: stats?.graduatedStudents || 0, icon: GraduationCap, accentColor: "#f59e0b", iconBg: "bg-amber-500", iconSectionBg: "bg-amber-50 dark:bg-amber-950/40" },
    { title: "کورسز", value: stats?.totalCourses || 0, icon: BookOpen, accentColor: "#06b6d4", iconBg: "bg-cyan-500", iconSectionBg: "bg-cyan-50 dark:bg-cyan-950/40" },
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
    <div className="space-y-3">
      {/* ====== Welcome Hero Banner ====== */}
      <div className="bg-gradient-to-l from-teal-600 via-emerald-600 to-teal-700 p-3.5 text-white relative rounded-2xl shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.06] pointer-events-none">
          <div className="absolute top-4 left-12 w-28 h-28 rounded-full bg-white" />
          <div className="absolute bottom-2 left-1/3 w-20 h-20 rounded-full bg-white" />
          <div className="absolute top-8 right-16 w-12 h-12 rounded-full bg-white" />
        </div>
        <div dir="ltr" className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2">
            <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-center border border-white/20 min-w-[52px]">
              <p className="text-lg font-bold leading-tight">{stats?.todayPresent || 0}</p>
              <p className="text-[9px] opacity-70">حاضر</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-center border border-white/20 min-w-[52px]">
              <p className="text-lg font-bold leading-tight">{todayAttendanceRate}%</p>
              <p className="text-[9px] opacity-70">شرح</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-center border border-white/20 min-w-[52px]">
              <p className="text-lg font-bold leading-tight">{todayAbsent}</p>
              <p className="text-[9px] opacity-70">غائب</p>
            </div>
          </div>
          <div className="min-w-0 text-right">
            <div className="flex items-center gap-2 mb-0.5 justify-end">
              <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
              <h2 className="text-base font-bold truncate">{institutionName}</h2>
            </div>
            <p className="text-xs opacity-75">لیب مینجمنٹ سسٹم میں خوش آمدید</p>
          </div>
        </div>
      </div>

      {/* ====== Stat Cards - Split Layout ====== */}
      {settings.showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} dir="ltr" className="overflow-hidden bg-card border rounded-2xl flex min-h-[80px] shadow-sm hover:shadow-md transition-shadow" style={{ '--accent-color': card.accentColor } as React.CSSProperties}>
                {/* Left: Data */}
                <div className="flex-1 p-3.5 flex flex-col justify-center min-w-0">
                  <p className="text-[11px] text-muted-foreground font-medium leading-tight">{card.title}</p>
                  <p className="text-2xl font-bold tracking-tight leading-none mt-1">{card.value}</p>
                </div>
                {/* Right: Icon Section with soft tinted background */}
                <div className={`${card.iconSectionBg} w-[60px] flex items-center justify-center shrink-0`}>
                  <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ====== Today's Attendance & Skills - Split Cards ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {settings.showTodayAttendance && (
          <div dir="ltr" className="overflow-hidden bg-card border rounded-2xl flex min-h-[80px] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-1 p-3.5 flex flex-col justify-center min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium leading-tight">آج کی حاضری</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold tracking-tight leading-none">{stats?.todayPresent || 0}</span>
                <span className="text-[10px] text-muted-foreground">/ {stats?.activeStudents || 0}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Progress value={todayAttendanceRate} className="h-1.5 flex-1" />
                <span className="text-[11px] font-bold text-primary min-w-[32px]">{todayAttendanceRate}%</span>
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 w-[60px] flex items-center justify-center shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        )}
        {settings.showSkillsProgress && (
          <div dir="ltr" className="overflow-hidden bg-card border rounded-2xl flex min-h-[80px] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-1 p-3.5 flex flex-col justify-center min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium leading-tight">اسکلز کی پیش رفت</p>
              <p className="text-2xl font-bold tracking-tight leading-none mt-1 text-primary">{stats?.skillsProgress || 0}%</p>
              <Progress value={stats?.skillsProgress || 0} className="h-1.5 mt-1.5" />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 w-[60px] flex items-center justify-center shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====== Charts ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {settings.showWeeklyChart && (
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 pb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2" dir="rtl">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 text-white" />
                </div>
                ہفتہ وار حاضری
              </h3>
            </div>
            <div className="px-4 pb-4">
              {weeklyData.length > 0 ? (
                <div className="h-48" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="day" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="present" name="حاضر" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" name="غائب" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="leave" name="رخصت" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  حاضری کا ڈیٹا دستیاب نہیں
                </div>
              )}
            </div>
          </div>
        )}

        {settings.showTasksChart && (
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 pb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2" dir="rtl">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <PieChartIcon className="h-3.5 w-3.5 text-white" />
                </div>
                ٹاسکس کا جائزہ
              </h3>
            </div>
            <div className="px-4 pb-4">
              {taskData.length > 0 && (taskData[0].value > 0 || taskData[1].value > 0) ? (
                <div className="h-48" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {taskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
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
