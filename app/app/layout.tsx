"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from "@/components/providers/session-provider"
import { LoadingIndicator } from "@/components/navigation/loading-indicator"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  return (
    <SessionProvider>
      <LoadingIndicator />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 pb-20">
        {children}
        <BottomNav />
        <Toaster />
      </div>
    </SessionProvider>
  )
}
