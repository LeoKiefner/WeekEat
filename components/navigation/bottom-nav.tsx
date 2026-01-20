"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, ShoppingCart, Users, History } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/app/week",
    label: "Semaine",
    icon: Calendar,
  },
  {
    href: "/app/groceries",
    label: "Courses",
    icon: ShoppingCart,
  },
  {
    href: "/app/household",
    label: "Foyer",
    icon: Users,
  },
  {
    href: "/app/history",
    label: "Historique",
    icon: History,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
