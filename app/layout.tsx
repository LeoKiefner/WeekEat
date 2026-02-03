import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from "next/script"
import "./globals.css"
import { SessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "@/components/ui/toaster"

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "500", "600", "700", "800"],
})

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
      <body className={`${nunito.variable} font-sans`}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
        <SpeedInsights />
        <Script
          src="https://app.iclosed.io/assets/widget.js"
          data-cta-widget="ljvPrirKVq5S"
          strategy="afterInteractive"
          async
        />
      </body>
    </html>
  )
}
