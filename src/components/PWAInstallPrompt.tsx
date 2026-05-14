"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

// Check if running as installed PWA
function getIsInstalled(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(getIsInstalled)

  useEffect(() => {
    // Already installed - skip
    if (isInstalled) return

    // Check if user previously dismissed
    const dismissed = localStorage.getItem("pwa-install-dismissed")
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return
      }
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after a short delay for better UX
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Listen for successful install
    const installedHandler = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("appinstalled", installedHandler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
    }
  }, [isInstalled])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
  }

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-80 z-50 animate-slide-in">
      <div className="glass-card p-4 border border-teal-200 dark:border-teal-800/50 shadow-xl shadow-teal-500/10 relative overflow-hidden">
        {/* Accent top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-teal-500 to-emerald-500" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-3 mt-1">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
            <Smartphone className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-bold text-sm mb-1">ایپ انسٹال کریں</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              لیب مینجمنٹ سسٹم اپنے فون پر انسٹال کریں — تیز رسائی، آف لائن سپورٹ، بہتر تجربہ
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="h-8 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 border-0 text-white hover:from-teal-700 hover:to-emerald-700 text-xs font-semibold shadow-md shadow-teal-500/20"
              >
                <Download className="h-3.5 w-3.5 ml-1" />
                انسٹال کریں
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 rounded-lg text-xs text-muted-foreground"
              >
                بعد میں
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
