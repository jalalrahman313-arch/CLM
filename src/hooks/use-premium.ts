"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"

/**
 * Hook to check premium status from the database.
 * This is more reliable than just reading from the local auth state,
 * because the JWT is only updated at login time.
 * 
 * Use this in components that need to gate premium features.
 */
export function usePremiumCheck() {
  const { user } = useAuth()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["premium-check"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user/premium")
        if (!res.ok) return { isPremium: false, role: "user" }
        const result = await res.json()
        if (result.success) {
          return { isPremium: result.isPremium as boolean, role: result.role as string }
        }
        return { isPremium: false, role: "user" }
      } catch {
        return { isPremium: false, role: "user" }
      }
    },
    staleTime: 30 * 1000, // 30 seconds cache
    refetchOnWindowFocus: true,
  })

  // Prefer database value, fall back to local auth value
  const isPremium = data?.isPremium ?? user?.isPremium ?? false
  const isAdmin = (data?.role ?? user?.role) === "admin"

  return {
    isPremium,
    isAdmin,
    isLoading,
    refetch,
  }
}
