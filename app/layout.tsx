import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/providers/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WeekEat - Planification de repas avec IA",
  description: "Générez automatiquement vos repas de la semaine avec IA",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
