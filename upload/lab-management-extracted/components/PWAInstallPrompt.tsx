"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").then(
          (registration) => {
            console.log("Service Worker registered with scope:", registration.scope);
          },
          (err) => {
            console.log("Service Worker registration failed:", err);
          }
        );
      });
    }

    // Handle BeforeInstallPrompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-surface-base border border-border-subtle rounded-2xl p-4 shadow-2xl z-50 flex items-center justify-between animate-in slide-in-from-bottom-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm text-text-primary">ایپ انسٹال کریں</p>
          <p className="text-xs text-text-muted">تیز رفتار رسائی کے لیے</p>
        </div>
      </div>
      <button 
        onClick={handleInstallClick}
        className="px-4 py-1.5 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-bold transition-colors"
      >
        انسٹال
      </button>
    </div>
  );
}
