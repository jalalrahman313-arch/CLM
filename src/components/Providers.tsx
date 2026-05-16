"use client"

import { ThemeProvider } from "@/components/ThemeProvider"
import { QueryProvider } from "@/components/QueryProvider"
import { Toaster } from "@/components/ui/sonner"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { useServiceWorker } from "@/hooks/use-service-worker"
import { useFontSize } from "@/hooks/use-font-size"
import { AuthProvider } from "@/hooks/use-auth"

function ServiceWorkerRegistrar() {
  useServiceWorker()
  return null
}

function FontSizeApplier() {
  useFontSize()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <QueryProvider>
          <FontSizeApplier />
          <ServiceWorkerRegistrar />
          {children}
          <PWAInstallPrompt />
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
