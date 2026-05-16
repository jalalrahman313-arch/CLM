"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { LoginForm } from "@/components/auth/LoginForm"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { Shell } from "@/components/Shell"
import { Loader2, Monitor } from "lucide-react"
import { useAppSettings } from "@/hooks/use-app-settings"

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)
  const { settings: appSettings } = useAppSettings()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
            <Monitor className="h-7 w-7 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground text-sm">لوڈ ہو رہا ہے...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-teal-950/20 dark:via-background dark:to-emerald-950/20" />
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-teal-200/20 dark:bg-teal-800/5 blur-3xl" />
        <div className="absolute bottom-20 left-20 w-56 h-56 rounded-full bg-emerald-200/20 dark:bg-emerald-800/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-100/10 dark:bg-teal-900/5 blur-3xl" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo and institution */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Monitor className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">لیب مینجمنٹ سسٹم</h1>
            <p className="text-muted-foreground">
              {appSettings.effectiveInstitutionName}
            </p>
            <p className="text-muted-foreground/60 text-sm mt-1">کاوش: ابن رحمت</p>
          </div>
          {showRegister ? (
            <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    )
  }

  return <Shell />
}
