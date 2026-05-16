"use client"

import { useEffect } from "react"

const STORAGE_KEY = "lab-dashboard-settings"
const DEFAULT_FONT_SIZE = "medium"

/**
 * Lightweight hook that applies the saved font size on app mount.
 * Runs independently of the full dashboard settings hook so the
 * font-size is correct even on the login page.
 */
export function useFontSize() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.fontSize) {
          document.documentElement.setAttribute("data-font-size", parsed.fontSize)
          return
        }
      }
    } catch {
      // ignore
    }
    document.documentElement.setAttribute("data-font-size", DEFAULT_FONT_SIZE)
  }, [])
}
