"use client"

import { useQuery } from "@tanstack/react-query"

interface AppSettings {
  institutionName: string
  userInstitutionName: string | null
  effectiveInstitutionName: string
}

const DEFAULT_SETTINGS: AppSettings = {
  institutionName: "جامعہ اشرفیہ",
  userInstitutionName: null,
  effectiveInstitutionName: "جامعہ اشرفیہ",
}

export function useAppSettings() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings/app")
        if (!res.ok) return DEFAULT_SETTINGS
        const result = await res.json()
        return result.data as AppSettings
      } catch {
        return DEFAULT_SETTINGS
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })

  return {
    settings: data || DEFAULT_SETTINGS,
    isLoading,
    refetch,
  }
}
