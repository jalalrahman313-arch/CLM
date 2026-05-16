"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  User,
  Mail,
  Shield,
  KeyRound,
  Users,
  CheckCircle,
  XCircle,
  Database,
  Loader2,
  Trash,
  UserCog,
  ToggleLeft,
  Building2,
  Crown,
  Type,
} from "lucide-react"
import { toast } from "sonner"
import { useDashboardSettings } from "@/hooks/use-dashboard-settings"
import { useAppSettings } from "@/hooks/use-app-settings"
import { PremiumGuard } from "@/components/PremiumGuard"

interface PendingUser {
  id: string
  email: string
  name: string
  role: string
  isApproved: boolean
  isPremium: boolean
  createdAt: string
}

export function SettingsSection() {
  const { user: authUser } = useAuth()
  const queryClient = useQueryClient()
  const { settings, updateSettings } = useDashboardSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetConfirmDialogOpen, setResetConfirmDialogOpen] = useState(false)

  // Premium check from database
  const isAdmin = authUser?.role === "admin"
  const isPremium = authUser?.isPremium ?? false

  // Account management states
  const [editName, setEditName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // User management states (admin)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dummy data loading
  const [loadingSeed, setLoadingSeed] = useState(false)

  // Institution name
  const { settings: appSettings, refetch: refetchAppSettings } = useAppSettings()
  const [editInstitutionName, setEditInstitutionName] = useState("")
  const [isEditingInstitution, setIsEditingInstitution] = useState(false)
  const [savingInstitution, setSavingInstitution] = useState(false)

  // Personal institution name (for premium users)
  const [editPersonalInstitutionName, setEditPersonalInstitutionName] = useState("")
  const [isEditingPersonalInstitution, setIsEditingPersonalInstitution] = useState(false)
  const [savingPersonalInstitution, setSavingPersonalInstitution] = useState(false)

  const [premiumGuardOpen, setPremiumGuardOpen] = useState(false)

  // Initialize edit name with current name
  useEffect(() => {
    if (authUser?.name) {
      setEditName(authUser.name)
    }
  }, [authUser?.name])

  // Load users for admin
  const fetchUsers = async () => {
    if (!isAdmin) return
    setLoadingUsers(true)
    try {
      const res = await fetch("/api/settings/users")
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.success) {
        setPendingUsers(data.data.filter((u: PendingUser) => !u.isApproved))
        setApprovedUsers(data.data.filter((u: PendingUser) => u.isApproved))
      }
    } catch {
      toast.error("یوزرز لانے میں خرابی")
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  // Initialize institution name
  useEffect(() => {
    if (appSettings.institutionName) {
      setEditInstitutionName(appSettings.institutionName)
    }
  }, [appSettings.institutionName])

  // Initialize personal institution name
  useEffect(() => {
    const personalName = appSettings.userInstitutionName || appSettings.effectiveInstitutionName
    setEditPersonalInstitutionName(personalName)
  }, [appSettings.userInstitutionName, appSettings.effectiveInstitutionName])

  // Handle name update
  const handleUpdateName = async () => {
    if (!editName.trim()) {
      toast.error("نام درج کریں")
      return
    }
    setSavingName(true)
    try {
      const res = await fetch("/api/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "name", name: editName }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "نام تبدیل کرنے میں خرابی")
        return
      }
      toast.success("نام کامیابی سے تبدیل ہو گیا")
      // Re-login to refresh token with updated name
      if (authUser?.email) {
        // Refresh user data from session API
        const sessionRes = await fetch("/api/auth/session")
        const sessionData = await sessionRes.json()
        if (sessionData.success && sessionData.user) {
          localStorage.setItem("auth-user", JSON.stringify(sessionData.user))
        }
      }
      setIsEditingName(false)
    } catch {
      toast.error("نام تبدیل کرنے میں خرابی")
    } finally {
      setSavingName(false)
    }
  }

  // Handle password update
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("تمام فیلڈز بھریں")
      return
    }
    if (newPassword.length < 6) {
      toast.error("نئے پاسورڈ میں کم از کم 6 حروف ہونے چاہئیں")
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("نئے پاسورڈ مماثل نہیں ہے")
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch("/api/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "password",
          currentPassword,
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "پاسورڈ تبدیل کرنے میں خرابی")
        return
      }
      toast.success("پاسورڈ کامیابی سے تبدیل ہو گیا")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      setIsChangingPassword(false)
    } catch {
      toast.error("پاسورڈ تبدیل کرنے میں خرابی")
    } finally {
      setSavingPassword(false)
    }
  }

  // Handle user approve/reject
  const handleUserAction = async (userId: string, action: "approve" | "reject" | "toggleRole" | "togglePremium" | "delete", userName: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch("/api/settings/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "عمل میں خرابی")
        return
      }
      toast.success(data.message)
      fetchUsers()
    } catch {
      toast.error("عمل میں خرابی")
    } finally {
      setActionLoading(null)
    }
  }

  // Handle global institution name update (admin only)
  const handleUpdateInstitutionName = async () => {
    if (!editInstitutionName.trim()) {
      toast.error("ادارے کا نام درج کریں")
      return
    }
    setSavingInstitution(true)
    try {
      const res = await fetch("/api/settings/app", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionName: editInstitutionName }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "ادارے کا نام تبدیل کرنے میں خرابی")
        return
      }
      toast.success("ادارے کا نام کامیابی سے تبدیل ہو گیا")
      refetchAppSettings()
      setIsEditingInstitution(false)
    } catch {
      toast.error("ادارے کا نام تبدیل کرنے میں خرابی")
    } finally {
      setSavingInstitution(false)
    }
  }

  // Handle personal institution name update (premium users)
  const handleUpdatePersonalInstitutionName = async () => {
    if (!editPersonalInstitutionName.trim()) {
      toast.error("ادارے کا نام درج کریں")
      return
    }
    if (!isPremium) {
      setPremiumGuardOpen(true)
      return
    }
    setSavingPersonalInstitution(true)
    try {
      const res = await fetch("/api/settings/app", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionName: editPersonalInstitutionName, isPersonalUpdate: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "ادارے کا نام تبدیل کرنے میں خرابی")
        return
      }
      toast.success("ادارے کا نام کامیابی سے تبدیل ہو گیا")
      refetchAppSettings()
      setIsEditingPersonalInstitution(false)
    } catch {
      toast.error("ادارے کا نام تبدیل کرنے میں خرابی")
    } finally {
      setSavingPersonalInstitution(false)
    }
  }

  // Handle dummy data load
  const handleLoadDummyData = async () => {
    setLoadingSeed(true)
    try {
      const res = await fetch("/api/settings/seed", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "ڈمی ڈیٹا لوڈ کرنے میں خرابی")
        return
      }
      toast.success(data.message)
      queryClient.invalidateQueries()
    } catch {
      toast.error("ڈمی ڈیٹا لوڈ کرنے میں خرابی")
    } finally {
      setLoadingSeed(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch("/api/settings/export")
      if (!res.ok) throw new Error()
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      // Format: "date - institution name.json"
      const date = new Date().toISOString().split("T")[0]
      const institutionName = appSettings.effectiveInstitutionName || "لیب مینجمنٹ"
      link.download = `${date} - ${institutionName}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success("بیک اپ کامیابی سے بن گیا")
    } catch {
      toast.error("ایکسپورٹ میں خرابی")
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const res = await fetch("/api/settings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error()
      const result = await res.json()
      toast.success(`ایمپورٹ کامیاب: ${JSON.stringify(result.data)}`)
      queryClient.invalidateQueries()
    } catch {
      toast.error("ایمپورٹ میں خرابی")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleReset = async () => {
    try {
      const endpoints = ["/api/classes", "/api/courses", "/api/students", "/api/tasks"]
      for (const endpoint of endpoints) {
        const res = await fetch(endpoint)
        if (res.ok) {
          const { data } = await res.json()
          for (const item of data || []) {
            await fetch(`${endpoint}/${item.id}`, { method: "DELETE" })
          }
        }
      }
      queryClient.invalidateQueries()
      toast.success("تمام ڈیٹا حذف ہو گیا")
      setResetConfirmDialogOpen(false)
    } catch {
      toast.error("ڈیٹا حذف کرنے میں خرابی")
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">سیٹنگز</h2>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="account" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            <User className="h-4 w-4 ml-1" />
            اکاؤنٹ
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            <SettingsIcon className="h-4 w-4 ml-1" />
            ڈیش بورڈ
          </TabsTrigger>
          <TabsTrigger value="data" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            <Database className="h-4 w-4 ml-1" />
            ڈیٹا
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="flex-1 min-w-[100px] text-xs sm:text-sm">
              <Users className="h-4 w-4 ml-1" />
              یوزرز
            </TabsTrigger>
          )}
        </TabsList>

        {/* ==================== ACCOUNT TAB ==================== */}
        <TabsContent value="account" className="space-y-4 mt-4">
          {/* Account Info */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                اکاؤنٹ کی معلومات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">ای میل</p>
                  <p className="text-sm font-medium truncate">{authUser?.email}</p>
                </div>
              </div>

              {/* Name */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">نام</p>
                      {isEditingName ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="نام درج کریں"
                          />
                          <Button
                            size="sm"
                            onClick={handleUpdateName}
                            disabled={savingName}
                            className="h-8 px-3"
                          >
                            {savingName ? <Loader2 className="h-3 w-3 animate-spin" /> : "محفوظ کریں"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsEditingName(false)
                              setEditName(authUser?.name || "")
                            }}
                            className="h-8 px-3"
                          >
                            منسوخ
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm font-medium">{authUser?.name}</p>
                      )}
                    </div>
                  </div>
                  {!isEditingName && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingName(true)}
                      className="h-8"
                    >
                      ترمیم
                    </Button>
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">کردار</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={isAdmin ? "default" : "secondary"}>
                      {isAdmin ? "ایڈمن" : "یوزر"}
                    </Badge>
                    {isPremium && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300">
                        <Crown className="h-3 w-3 ml-1" />
                        پریمیم
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-User Institution Name (Premium Users) */}
          {isPremium && (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  ادارے کا نام
                  <Crown className="h-4 w-4 text-amber-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isEditingPersonalInstitution ? (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{appSettings.effectiveInstitutionName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        یہ نام آپ کے ڈیش بورڈ، سرٹیفکیٹس اور رپورٹس پر دکھائی دے گا
                        {appSettings.userInstitutionName && (
                          <span className="block text-primary mt-0.5">
                            (ذاتی: {appSettings.userInstitutionName})
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!isPremium) {
                          setPremiumGuardOpen(true)
                          return
                        }
                        setEditPersonalInstitutionName(appSettings.userInstitutionName || appSettings.effectiveInstitutionName)
                        setIsEditingPersonalInstitution(true)
                      }}
                      className="h-8"
                    >
                      ترمیم
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="personal-institution-name">ادارے کا نام</Label>
                      <Input
                        id="personal-institution-name"
                        value={editPersonalInstitutionName}
                        onChange={(e) => setEditPersonalInstitutionName(e.target.value)}
                        placeholder="ادارے کا نام درج کریں"
                      />
                      <p className="text-xs text-muted-foreground">
                        یہ تبدیلی صرف آپ کے اکاؤنٹ پر لاگو ہوگی
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdatePersonalInstitutionName}
                        disabled={savingPersonalInstitution}
                        className="flex-1"
                      >
                        {savingPersonalInstitution ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            محفوظ ہو رہا ہے...
                          </>
                        ) : (
                          "محفوظ کریں"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsEditingPersonalInstitution(false)
                          setEditPersonalInstitutionName(appSettings.userInstitutionName || appSettings.effectiveInstitutionName)
                        }}
                      >
                        منسوخ
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Change Password */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                پاسورڈ تبدیل کریں
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <Button
                  variant="outline"
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full"
                >
                  <KeyRound className="h-4 w-4 ml-2" />
                  پاسورڈ تبدیل کریں
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">موجودہ پاسورڈ</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="موجودہ پاسورڈ درج کریں"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">نیا پاسورڈ</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="نیا پاسورڈ درج کریں"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">نیا پاسورڈ دہرائیں</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="نیا پاسورڈ دوبارہ درج کریں"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdatePassword}
                      disabled={savingPassword}
                      className="flex-1"
                    >
                      {savingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          محفوظ ہو رہا ہے...
                        </>
                      ) : (
                        "محفوظ کریں"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsChangingPassword(false)
                        setCurrentPassword("")
                        setNewPassword("")
                        setConfirmNewPassword("")
                      }}
                    >
                      منسوخ
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DASHBOARD TAB ==================== */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          {/* Global Institution Name (Admin Only) */}
          {isAdmin && (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  ادارے کا نام (عام)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isEditingInstitution ? (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{appSettings.institutionName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        یہ نام تمام یوزرز کے لیے ڈیفالٹ ہے۔ پریمیم یوزرز اپنا الگ نام سیٹ کر سکتے ہیں۔
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!isPremium) {
                          setPremiumGuardOpen(true)
                          return
                        }
                        setEditInstitutionName(appSettings.institutionName)
                        setIsEditingInstitution(true)
                      }}
                      className="h-8"
                    >
                      ترمیم
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="institution-name">ادارے کا نام</Label>
                      <Input
                        id="institution-name"
                        value={editInstitutionName}
                        onChange={(e) => setEditInstitutionName(e.target.value)}
                        placeholder="ادارے کا نام درج کریں"
                      />
                      <p className="text-xs text-muted-foreground">
                        یہ تبدیلی تمام یوزرز کے لیے ڈیفالٹ نام بدل دے گی
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdateInstitutionName}
                        disabled={savingInstitution}
                        className="flex-1"
                      >
                        {savingInstitution ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            محفوظ ہو رہا ہے...
                          </>
                        ) : (
                          "محفوظ کریں"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsEditingInstitution(false)
                          setEditInstitutionName(appSettings.institutionName)
                        }}
                      >
                        منسوخ
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Font Size Setting */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                فونٹ سائز
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "small", label: "چھوٹا", size: "14px" },
                  { value: "medium", label: "درمیانہ", size: "16px" },
                  { value: "large", label: "بڑا", size: "18px" },
                  { value: "xlarge", label: "بہت بڑا", size: "20px" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ fontSize: opt.value as "small" | "medium" | "large" | "xlarge" })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      settings.fontSize === opt.value
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <span style={{ fontSize: opt.size }} className="font-bold block mb-1">الف</span>
                    <span className="text-[10px] text-muted-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                ڈیش بورڈ وجیٹس
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>اعداد و شمار کارڈز</Label>
                <Switch
                  checked={settings.showStats}
                  onCheckedChange={(v) => updateSettings({ showStats: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>آج کی حاضری</Label>
                <Switch
                  checked={settings.showTodayAttendance}
                  onCheckedChange={(v) => updateSettings({ showTodayAttendance: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>اسکلز کی پیش رفت</Label>
                <Switch
                  checked={settings.showSkillsProgress}
                  onCheckedChange={(v) => updateSettings({ showSkillsProgress: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>ہفتہ وار چارٹ</Label>
                <Switch
                  checked={settings.showWeeklyChart}
                  onCheckedChange={(v) => updateSettings({ showWeeklyChart: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>ٹاسکس چارٹ</Label>
                <Switch
                  checked={settings.showTasksChart}
                  onCheckedChange={(v) => updateSettings({ showTasksChart: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DATA TAB ==================== */}
        <TabsContent value="data" className="space-y-4 mt-4">
          {/* Dummy Data Load */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                ڈمی ڈیٹا
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                ٹیسٹنگ کے لیے نمونہ ڈیٹا لوڈ کریں۔ اس میں 3 کلاسز، 3 کورسز، 12 طلباء، حاضری، اسکلز، اور ٹاسکس شامل ہیں۔
              </p>
              <Button
                onClick={handleLoadDummyData}
                variant="outline"
                className="w-full"
                disabled={loadingSeed}
              >
                {loadingSeed ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    لوڈ ہو رہا ہے...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 ml-2" />
                    ڈمی ڈیٹا لوڈ کریں
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Import/Export */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                ڈیٹا مینجمنٹ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleExport} variant="outline" className="flex-1 min-w-[140px]">
                  <Download className="h-4 w-4 ml-2" />
                  ایکسپورٹ JSON
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1 min-w-[140px]"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  ایمپورٹ JSON
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </div>

              <Separator />

              <div>
                <Button
                  variant="destructive"
                  onClick={() => setResetDialogOpen(true)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  تمام ڈیٹا حذف کریں
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  یہ عمل واپس نہیں ہو سکتا۔ احتیاط سے استعمال کریں۔
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== USERS TAB (Admin Only) ==================== */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-4 mt-4">
            {/* Pending Approvals */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  اپروو کا انتظار
                  {pendingUsers.length > 0 && (
                    <Badge variant="destructive" className="mr-2">
                      {pendingUsers.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    کوئی اپروو کا انتظار نہیں
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {pendingUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString("ur-PK")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUserAction(user.id, "approve", user.name)}
                            disabled={actionLoading === user.id}
                            className="h-8 px-2"
                            title="اپروو"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUserAction(user.id, "reject", user.name)}
                            disabled={actionLoading === user.id}
                            className="h-8 px-2"
                            title="مسترد"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approved Users */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  اپرووڈ یوزرز
                  <Badge variant="secondary" className="mr-2">
                    {approvedUsers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : approvedUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    کوئی اپرووڈ یوزر نہیں
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {approvedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <Badge
                              variant={user.role === "admin" ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {user.role === "admin" ? "ایڈمن" : "یوزر"}
                            </Badge>
                            {user.isPremium && (
                              <Badge
                                className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300"
                              >
                                <Crown className="h-2.5 w-2.5 ml-0.5" />
                                پریمیم
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString("ur-PK")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Don't show actions for self */}
                          {user.id !== authUser?.id && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUserAction(user.id, "togglePremium", user.name)}
                                disabled={actionLoading === user.id}
                                className="h-8 px-2"
                                title={user.isPremium ? "نارمل یوزر بنائیں" : "پریمیم بنائیں"}
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Crown className={`h-4 w-4 ${user.isPremium ? "text-amber-500" : "text-muted-foreground"}`} />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUserAction(user.id, "toggleRole", user.name)}
                                disabled={actionLoading === user.id}
                                className="h-8 px-2"
                                title={user.role === "admin" ? "یوزر بنائیں" : "ایڈمن بنائیں"}
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUserAction(user.id, "delete", user.name)}
                                disabled={actionLoading === user.id}
                                className="h-8 px-2 text-destructive hover:text-destructive"
                                title="حذف کریں"
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                          {user.id === authUser?.id && (
                            <Badge variant="outline" className="text-[10px]">
                              آپ
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Premium Guard */}
      <PremiumGuard
        open={premiumGuardOpen}
        onOpenChange={setPremiumGuardOpen}
        feature="ادارے کا نام تبدیل کرنا"
      />

      {/* Reset Confirmation - Step 1 */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>کیا آپ واقعی تمام ڈیٹا حذف کرنا چاہتے ہیں؟</AlertDialogTitle>
            <AlertDialogDescription>
              یہ عمل تمام کلاسز، کورسز، طلباء، حاضری، اسکلز، اور ٹاسکس حذف کر دے گا۔ یہ عمل واپس نہیں ہو سکتا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setResetDialogOpen(false)
                setResetConfirmDialogOpen(true)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              جی، جاری رکھیں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation - Step 2 */}
      <AlertDialog open={resetConfirmDialogOpen} onOpenChange={setResetConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حتمی تصدیق</AlertDialogTitle>
            <AlertDialogDescription>
              تمام ڈیٹا مستقل طور پر حذف ہو جائے گا۔ کیا آپ پوری یقین سے یہ کرنا چاہتے ہیں؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ہاں، حذف کریں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
