"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Loader2, Clock, Monitor } from "lucide-react"

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("پاسورڈ مماثل نہیں ہے")
      return
    }

    if (password.length < 6) {
      setError("پاسورڈ کم از کم 6 حروف کا ہونا چاہیے")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "رجسٹریشن میں خرابی")
        return
      }

      if (data.needsApproval) {
        setPendingApproval(true)
      } else {
        // Auto-login after registration
        await login(email, password)
      }
    } catch {
      setError("رجسٹریشن میں خرابی پیش آئی")
    } finally {
      setLoading(false)
    }
  }

  if (pendingApproval) {
    return (
      <Card className="w-full max-w-md mx-auto border shadow-2xl overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-l from-amber-500 to-orange-500 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
            <div className="absolute top-2 left-8 w-20 h-20 rounded-full bg-white" />
          </div>
          <div className="relative">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 border border-white/30 shadow-lg">
              <Clock className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">رجسٹریشن کامیاب!</CardTitle>
            <CardDescription className="text-white/80 mt-1.5">اپروو کا انتظار</CardDescription>
          </div>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl text-sm text-center border border-amber-200 dark:border-amber-800">
            آپ کی رجسٹریشن کامیاب ہو گئی ہے۔ ایڈمن کے اپروو کا انتظار کریں۔ اپروو ہونے کے بعد آپ لاگ ان کر سکیں گے۔
          </div>
          <Button onClick={onSwitchToLogin} variant="outline" className="w-full h-11 rounded-xl">
            لاگ ان پیج پر جائیں
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto border shadow-2xl overflow-hidden rounded-2xl">
      <div className="bg-gradient-to-l from-teal-600 via-emerald-600 to-teal-700 p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          <div className="absolute top-2 left-8 w-20 h-20 rounded-full bg-white" />
        </div>
        <div className="relative">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 border border-white/30 shadow-lg">
            <UserPlus className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">رجسٹریشن</CardTitle>
          <CardDescription className="text-white/80 mt-1.5">نیا اکاؤنٹ بنائیں</CardDescription>
        </div>
      </div>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="reg-name" className="text-sm font-medium">نام</Label>
            <Input
              id="reg-name"
              type="text"
              placeholder="اپنا نام درج کریں"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email" className="text-sm font-medium">ای میل</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="text-left h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password" className="text-sm font-medium">پاسورڈ</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="پاسورڈ درج کریں"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
              className="text-left h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-confirm-password" className="text-sm font-medium">پاسورڈ دہرائیں</Label>
            <Input
              id="reg-confirm-password"
              type="password"
              placeholder="پاسورڈ دوبارہ درج کریں"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              dir="ltr"
              className="text-left h-11 rounded-xl"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3.5 rounded-xl text-sm text-center font-medium border border-destructive/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full btn-3d h-11 rounded-xl text-base font-semibold bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                لوڈ ہو رہا ہے...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 ml-2" />
                رجسٹر کریں
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            پہلے سے اکاؤنٹ ہے؟{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-semibold"
            >
              لاگ ان کریں
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
