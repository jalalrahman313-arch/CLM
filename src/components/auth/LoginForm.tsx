"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Loader2, FlaskConical } from "lucide-react"

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("ای میل یا پاسورڈ غلط ہے")
      }
    } catch {
      setError("لاگ ان میں خرابی پیش آئی")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border shadow-2xl overflow-hidden rounded-2xl">
      {/* Header with gradient */}
      <div className="bg-gradient-to-l from-teal-600 via-emerald-600 to-teal-700 p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          <div className="absolute top-2 left-8 w-20 h-20 rounded-full bg-white" />
          <div className="absolute bottom-1 left-1/3 w-14 h-14 rounded-full bg-white" />
        </div>
        <div className="relative">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 border border-white/30 shadow-lg">
            <FlaskConical className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">لاگ ان</CardTitle>
          <CardDescription className="text-white/80 mt-1.5">اپنے اکاؤنٹ میں داخل ہوں</CardDescription>
        </div>
      </div>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">ای میل</Label>
            <Input
              id="email"
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
            <Label htmlFor="password" className="text-sm font-medium">پاسورڈ</Label>
            <Input
              id="password"
              type="password"
              placeholder="پاسورڈ درج کریں"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                <LogIn className="h-5 w-5 ml-2" />
                لاگ ان
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            اکاؤنٹ نہیں ہے؟{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary hover:underline font-semibold"
            >
              رجسٹر کریں
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
