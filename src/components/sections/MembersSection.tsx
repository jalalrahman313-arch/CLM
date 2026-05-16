"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Users,
  UserPlus,
  Shield,
  Crown,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Mail,
  User,
  ChevronDown,
  MoreVertical,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface MemberData {
  id: string
  email: string
  name: string
  role: string
  isApproved: boolean
  isPremium: boolean
  createdAt: string
  _count?: {
    classes: number
    students: number
    courses: number
  }
}

type FilterType = "all" | "pending" | "approved" | "admins" | "premium"

export function MembersSection() {
  const { user: authUser } = useAuth()
  const isAdmin = authUser?.role === "admin"

  const [members, setMembers] = useState<MemberData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Add member dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addEmail, setAddEmail] = useState("")
  const [addPassword, setAddPassword] = useState("")
  const [addRole, setAddRole] = useState<string>("user")
  const [addPremium, setAddPremium] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MemberData | null>(null)

  // Fetch members
  const fetchMembers = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    try {
      const res = await fetch("/api/members")
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.success) {
        setMembers(data.data)
      }
    } catch {
      toast.error("ممبران لانے میں خرابی")
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Handle member action
  const handleAction = async (memberId: string, action: string, memberName: string) => {
    setActionLoading(memberId)
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "عمل میں خرابی")
        return
      }
      toast.success(data.message)
      fetchMembers()
    } catch {
      toast.error("عمل میں خرابی")
    } finally {
      setActionLoading(null)
    }
  }

  // Handle add member
  const handleAddMember = async () => {
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      toast.error("تمام فیلڈز بھریں")
      return
    }
    if (addPassword.length < 6) {
      toast.error("پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے")
      return
    }
    setAddLoading(true)
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          password: addPassword,
          role: addRole,
          isPremium: addPremium,
          isApproved: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "ممبر شامل کرنے میں خرابی")
        return
      }
      toast.success(data.message)
      setAddDialogOpen(false)
      setAddName("")
      setAddEmail("")
      setAddPassword("")
      setAddRole("user")
      setAddPremium(false)
      fetchMembers()
    } catch {
      toast.error("ممبر شامل کرنے میں خرابی")
    } finally {
      setAddLoading(false)
    }
  }

  // Handle delete member
  const handleDeleteMember = async () => {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    try {
      const res = await fetch(`/api/members/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || "حذف کرنے میں خرابی")
        return
      }
      toast.success(data.message)
      fetchMembers()
    } catch {
      toast.error("حذف کرنے میں خرابی")
    } finally {
      setActionLoading(null)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // Filter members
  const filteredMembers = members.filter((m) => {
    // Search filter
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())

    // Category filter
    let matchesFilter = true
    switch (activeFilter) {
      case "pending":
        matchesFilter = !m.isApproved
        break
      case "approved":
        matchesFilter = m.isApproved && m.role === "user"
        break
      case "admins":
        matchesFilter = m.role === "admin"
        break
      case "premium":
        matchesFilter = m.isPremium
        break
      default:
        matchesFilter = true
    }

    return matchesSearch && matchesFilter
  })

  // Stats
  const stats = {
    total: members.length,
    pending: members.filter((m) => !m.isApproved).length,
    admins: members.filter((m) => m.role === "admin").length,
    premium: members.filter((m) => m.isPremium).length,
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">صرف ایڈمن رسائی رکھتا ہے</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            ممبر مینجمنٹ
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            ممبران شامل کریں، اپروو کریں، پریمیم یا ایڈمن بنائیں
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
        >
          <UserPlus className="h-4 w-4 ml-2" />
          نیا ممبر
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveFilter("all")}
          className={`p-3 rounded-xl border-2 text-center transition-all ${
            activeFilter === "all"
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border hover:border-primary/30 hover:bg-muted/50"
          }`}
        >
          <div className="text-xl font-bold text-primary">{stats.total}</div>
          <div className="text-[11px] text-muted-foreground">کل ممبران</div>
        </button>
        <button
          onClick={() => setActiveFilter("pending")}
          className={`p-3 rounded-xl border-2 text-center transition-all ${
            activeFilter === "pending"
              ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20 shadow-md"
              : "border-border hover:border-orange-500/30 hover:bg-muted/50"
          }`}
        >
          <div className="text-xl font-bold text-orange-500">{stats.pending}</div>
          <div className="text-[11px] text-muted-foreground">انتظار میں</div>
        </button>
        <button
          onClick={() => setActiveFilter("admins")}
          className={`p-3 rounded-xl border-2 text-center transition-all ${
            activeFilter === "admins"
              ? "border-teal-500 bg-teal-50 dark:bg-teal-950/20 shadow-md"
              : "border-border hover:border-teal-500/30 hover:bg-muted/50"
          }`}
        >
          <div className="text-xl font-bold text-teal-600">{stats.admins}</div>
          <div className="text-[11px] text-muted-foreground">ایڈمنز</div>
        </button>
        <button
          onClick={() => setActiveFilter("premium")}
          className={`p-3 rounded-xl border-2 text-center transition-all ${
            activeFilter === "premium"
              ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20 shadow-md"
              : "border-border hover:border-amber-500/30 hover:bg-muted/50"
          }`}
        >
          <div className="text-xl font-bold text-amber-500">{stats.premium}</div>
          <div className="text-[11px] text-muted-foreground">پریمیم</div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="نام یا ای میل تلاش کریں..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 h-10 rounded-xl"
        />
      </div>

      {/* Active Filter Badge */}
      {activeFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">فلٹر:</span>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-destructive/10"
            onClick={() => setActiveFilter("all")}
          >
            {activeFilter === "pending" && "انتظار میں"}
            {activeFilter === "approved" && "اپرووڈ یوزرز"}
            {activeFilter === "admins" && "ایڈمنز"}
            {activeFilter === "premium" && "پریمیم"}
            <XCircle className="h-3 w-3 mr-1" />
          </Badge>
        </div>
      )}

      {/* Members List */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>ممبران کی فہرست</span>
            <Badge variant="secondary">{filteredMembers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "کوئی ممبر نہیں ملا" : "ابھی کوئی ممبر نہیں ہے"}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 ml-2" />
                  نیا ممبر شامل کریں
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-all"
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm ${
                    member.role === "admin"
                      ? "bg-gradient-to-br from-teal-500 to-emerald-600"
                      : member.isPremium
                      ? "bg-gradient-to-br from-amber-400 to-amber-600"
                      : "bg-gradient-to-br from-slate-400 to-slate-500"
                  }`}>
                    {member.name[0]}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      {member.role === "admin" && (
                        <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-300 text-[10px] px-1.5 py-0">
                          <Shield className="h-2.5 w-2.5 ml-0.5" />
                          ایڈمن
                        </Badge>
                      )}
                      {member.isPremium && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 text-[10px] px-1.5 py-0">
                          <Crown className="h-2.5 w-2.5 ml-0.5" />
                          پریمیم
                        </Badge>
                      )}
                      {!member.isApproved && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          انتظار
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    {member._count && (
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{member._count.classes} کلاسز</span>
                        <span>{member._count.students} طلباء</span>
                        <span>{member._count.courses} کورسز</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Quick actions for pending */}
                    {!member.isApproved && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAction(member.id, "approve", member.name)}
                          disabled={actionLoading === member.id}
                          className="h-8 w-8 p-0"
                          title="اپروو"
                        >
                          {actionLoading === member.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(member.id, "reject", member.name)}
                          disabled={actionLoading === member.id}
                          className="h-8 w-8 p-0"
                          title="مسترد"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {/* More actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={actionLoading === member.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="left" className="w-48">
                        {/* Approval actions */}
                        {!member.isApproved && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleAction(member.id, "approve", member.name)}
                              className="gap-2 text-green-600 focus:text-green-600"
                            >
                              <UserCheck className="h-4 w-4" />
                              اپروو کریں
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction(member.id, "reject", member.name)}
                              className="gap-2 text-red-600 focus:text-red-600"
                            >
                              <UserX className="h-4 w-4" />
                              مسترد کریں
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}

                        {/* Role actions */}
                        {member.role === "user" ? (
                          <DropdownMenuItem
                            onClick={() => handleAction(member.id, "makeAdmin", member.name)}
                            className="gap-2 text-teal-600 focus:text-teal-600"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            ایڈمن بنائیں
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleAction(member.id, "makeUser", member.name)}
                            className="gap-2"
                          >
                            <ArrowDownRight className="h-4 w-4" />
                            عام یوزر بنائیں
                          </DropdownMenuItem>
                        )}

                        {/* Premium action */}
                        <DropdownMenuItem
                          onClick={() => handleAction(member.id, "togglePremium", member.name)}
                          className={`gap-2 ${member.isPremium ? "" : "text-amber-600 focus:text-amber-600"}`}
                        >
                          <Crown className="h-4 w-4" />
                          {member.isPremium ? "پریمیم ہٹائیں" : "پریمیم بنائیں"}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Delete */}
                        <DropdownMenuItem
                          onClick={() => {
                            setDeleteTarget(member)
                            setDeleteDialogOpen(true)
                          }}
                          className="gap-2 text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف کریں
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-5 w-5 text-primary" />
              نیا ممبر شامل کریں
            </DialogTitle>
            <DialogDescription>
              نیا ممبر شامل کریں۔ یہ خودکار طور پر اپروو ہو جائے گا۔
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="member-name">نام</Label>
              <Input
                id="member-name"
                placeholder="ممبر کا نام"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="member-email">ای میل</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="example@email.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="member-password">پاس ورڈ</Label>
              <div className="relative">
                <Input
                  id="member-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="کم از کم 6 حروف"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  dir="ltr"
                  className="text-left pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>کردار</Label>
              <Select value={addRole} onValueChange={setAddRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      عام یوزر
                    </span>
                  </SelectItem>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      ایڈمن
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Premium toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <Label className="cursor-pointer">پریمیم ممبر</Label>
              </div>
              <button
                onClick={() => setAddPremium(!addPremium)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  addPremium ? "bg-amber-500" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                    addPremium ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setAddDialogOpen(false)
                setAddName("")
                setAddEmail("")
                setAddPassword("")
                setAddRole("user")
                setAddPremium(false)
              }}
            >
              منسوخ
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={addLoading}
              className="bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            >
              {addLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  شامل ہو رہا ہے...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 ml-2" />
                  شامل کریں
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ممبر حذف کریں</AlertDialogTitle>
            <AlertDialogDescription>
              کیا آپ واقعی <strong>{deleteTarget?.name}</strong> کو حذف کرنا چاہتے ہیں؟
              یہ عمل واپس نہیں ہو سکتا اور ان کا تمام ڈیٹا (کلاسز، طلباء، حاضری وغیرہ) بھی حذف ہو جائے گا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف کریں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
