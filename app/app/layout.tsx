import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from "@/components/providers/session-provider"
import { LoadingIndicator } from "@/components/navigation/loading-indicator"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

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
