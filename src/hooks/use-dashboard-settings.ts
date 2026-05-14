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

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(loadSettings)

  // Apply font size to document root
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-font-size", settings.fontSize)
    }
  }, [settings.fontSize])

  const updateSettings = useCallback((updates: Partial<DashboardSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      } catch {
        // ignore
      }
      return newSettings
    })
  }, [])

  return { settings, updateSettings }
}
