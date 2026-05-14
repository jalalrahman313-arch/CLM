"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/ThemeProvider"
import { QueryProvider } from "@/components/QueryProvider"
import { Toaster } from "@/components/ui/sonner"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { useServiceWorker } from "@/hooks/use-service-worker"

function ServiceWorkerRegistrar() {
  useServiceWorker()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <QueryProvider>
          <ServiceWorkerRegistrar />
          {children}
          <PWAInstallPrompt />
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
