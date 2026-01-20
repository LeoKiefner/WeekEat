"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface GenerateWeekButtonProps {
  householdId: string
  variant?: "default" | "secondary"
}

export function GenerateWeekButton({ householdId, variant = "default" }: GenerateWeekButtonProps) {
  const router = useRouter()

  function handleClick() {
    router.push(`/household/${householdId}/week/generate?generating=true`)
  }

  return (
    <Button
      onClick={handleClick}
      size="lg"
      variant={variant}
      className="text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
    >
      <Sparkles className="mr-2 h-5 w-5" />
      {variant === "default" ? "Générer ma semaine" : "Régénérer la semaine"}
    </Button>
  )
}
