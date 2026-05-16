"use client"

import { useState, useCallback, useEffect } from "react"

interface DashboardSettings {
  showStats: boolean
  showTodayAttendance: boolean
  showSkillsProgress: boolean
  showWeeklyChart: boolean
  showTasksChart: boolean
  fontSize: "small" | "medium" | "large" | "xlarge"
}

const DEFAULT_SETTINGS: DashboardSettings = {
  showStats: true,
  showTodayAttendance: true,
  showSkillsProgress: true,
  showWeeklyChart: true,
  showTasksChart: true,
  fontSize: "medium",
}

const STORAGE_KEY = "lab-dashboard-settings"

function loadSettings(): DashboardSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS
}

/** Apply font size to <html> so all rem-based Tailwind classes scale */
function applyFontSize(fontSize: string) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-font-size", fontSize)
  }
}

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(loadSettings)

  // Apply font size whenever it changes (and on initial mount)
  useEffect(() => {
    applyFontSize(settings.fontSize)
  }, [settings.fontSize])

  const updateSettings = useCallback((updates: Partial<DashboardSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      } catch {
        // ignore
      }
      // Apply font size immediately for instant visual feedback
      if (updates.fontSize) {
        applyFontSize(updates.fontSize)
      }
      return newSettings
    })
  }, [])

  return { settings, updateSettings }
}
