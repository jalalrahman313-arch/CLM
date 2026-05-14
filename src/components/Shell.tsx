"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  BookOpen,
  UserPlus,
  Network,
  ClipboardList,
  Award,
  FileBarChart,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  Crown,
  FlaskConical,
  Sparkles,
} from "lucide-react"
import { useAppSettings } from "@/hooks/use-app-settings"
import { DashboardSection } from "@/components/sections/DashboardSection"
import { AttendanceSection } from "@/components/sections/AttendanceSection"
import { ClassesSection } from "@/components/sections/ClassesSection"
import { CoursesSection } from "@/components/sections/CoursesSection"
import { StudentsSection } from "@/components/sections/StudentsSection"
import { SkillsSection } from "@/components/sections/SkillsSection"
import { TasksSection } from "@/components/sections/TasksSection"
import { CertificatesSection } from "@/components/sections/CertificatesSection"
import { ReportsSection } from "@/components/sections/ReportsSection"
import { SettingsSection } from "@/components/sections/SettingsSection"

const navItems = [
  { id: "dashboard", label: "ڈیش بورڈ", icon: LayoutDashboard, group: "مرکزی" },
  { id: "attendance", label: "حاضری", icon: CheckSquare, group: "مرکزی" },
  { id: "classes", label: "کلاسز", icon: Users, group: "انتظامیہ" },
  { id: "courses", label: "کورسز", icon: BookOpen, group: "انتظامیہ" },
  { id: "students", label: "طلباء", icon: UserPlus, group: "انتظامیہ" },
  { id: "skills", label: "اسکلز ٹریکر", icon: Network, group: "تعلیمی" },
  { id: "tasks", label: "ٹاسکس", icon: ClipboardList, group: "تعلیمی" },
  { id: "certificates", label: "سرٹیفکیٹ", icon: Award, group: "آؤٹ پٹ" },
  { id: "reports", label: "رپورٹس", icon: FileBarChart, group: "آؤٹ پٹ" },
  { id: "settings", label: "سیٹنگز", icon: Settings, group: "آؤٹ پٹ" },
]

const sectionComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardSection,
  attendance: AttendanceSection,
  classes: ClassesSection,
  courses: CoursesSection,
  students: StudentsSection,
  skills: SkillsSection,
  tasks: TasksSection,
  certificates: CertificatesSection,
  reports: ReportsSection,
  settings: SettingsSection,
}

// Group labels for sidebar
const groupLabels: Record<string, string> = {
  "مرکزی": "مرکزی",
  "انتظامیہ": "انتظامیہ",
  "تعلیمی": "تعلیمی",
  "آؤٹ پٹ": "آؤٹ پٹ",
}

interface SidebarContentProps {
  activeSection: string
  onNavClick: (id: string) => void
  userName?: string | null
  userEmail?: string | null
  institutionName?: string
  isPremium?: boolean
}

function SidebarContent({ activeSection, onNavClick, userName, userEmail, institutionName, isPremium }: SidebarContentProps) {
  // Group nav items by group
  const grouped = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      {/* Logo / Brand Header - Pro style */}
      <div className="px-3 pt-4 pb-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-l from-teal-600 via-emerald-600 to-teal-700 shadow-lg shadow-teal-600/20 relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute top-2 right-6 w-16 h-16 rounded-full bg-white" />
            <div className="absolute bottom-1 right-1/3 w-10 h-10 rounded-full bg-white" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20 relative">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1 relative">
            <h2 className="text-sm font-bold text-white leading-tight truncate">لیب مینجمنٹ</h2>
            <p className="text-[10px] text-white/70 leading-tight truncate mt-0.5">{institutionName}</p>
          </div>
          {isPremium && (
            <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/30 relative">
              <Crown className="h-3.5 w-3.5 text-amber-900" />
            </div>
          )}
        </div>
      </div>

      <Separator className="mx-3 opacity-30" />

      {/* Navigation with Groups */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                {groupLabels[group]}
              </p>
              {items.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavClick(item.id)}
                    className={`sidebar-nav-item w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-all ${
                      isActive ? "active" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className={`h-[17px] w-[17px] shrink-0 transition-colors ${isActive ? "text-primary" : ""}`} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <Separator className="mx-3 opacity-30" />

      {/* User & Logout */}
      <div className="px-3 py-3 space-y-2">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/40 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-[11px] font-bold text-white">{(userName || userEmail || "?")[0]}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium truncate leading-tight">{userName || userEmail}</p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">{isPremium ? "پریمیم یوزر" : "عام یوزر"}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-[13px] h-9 rounded-lg gap-2"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-4 w-4" />
          لاگ آؤٹ
        </Button>
      </div>
    </div>
  )
}

export function Shell() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const { settings: appSettings } = useAppSettings()
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const today = new Date().toLocaleDateString("ur-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const handleNavClick = (id: string) => {
    setActiveSection(id)
    setSidebarOpen(false)
  }

  const ActiveComponent = sectionComponents[activeSection] || DashboardSection
  const activeLabel = navItems.find((item) => item.id === activeSection)?.label || "ڈیش بورڈ"
  const activeIcon = navItems.find((item) => item.id === activeSection)?.icon || LayoutDashboard

  const isPremium = session?.user?.isPremium ?? false

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar - Professional with depth */}
      <aside className="hidden md:flex w-60 shrink-0 border-l bg-sidebar text-sidebar-foreground flex-col no-print shadow-sm">
        <SidebarContent
          activeSection={activeSection}
          onNavClick={handleNavClick}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          institutionName={appSettings.effectiveInstitutionName}
          isPremium={isPremium}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Sleek and minimal */}
        <header className="h-12 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 shrink-0 no-print">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-60 p-0">
                <SheetTitle className="sr-only">نیویگیشن مینو</SheetTitle>
                <SidebarContent
                  activeSection={activeSection}
                  onNavClick={handleNavClick}
                  userName={session?.user?.name}
                  userEmail={session?.user?.email}
                  institutionName={appSettings.effectiveInstitutionName}
                  isPremium={isPremium}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <activeIcon className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-sm font-bold">{activeLabel}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              {today}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "لائٹ موڈ" : "ڈارک موڈ"}
              className="rounded-full h-8 w-8"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto custom-scrollbar p-4 md:p-5 lg:p-6">
          <div className="animate-fade-in">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  )
}
