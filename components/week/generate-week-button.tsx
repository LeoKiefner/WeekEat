"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"

interface GenerateWeekButtonProps {
  householdId: string
  variant?: "default" | "secondary"
}

export function GenerateWeekButton({ householdId, variant = "default" }: GenerateWeekButtonProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  function handleClick() {
    setIsGenerating(true)
    router.push(`/household/${householdId}/week/generate?generating=true`)
  }

  return (
    <Button
      onClick={handleClick}
      size="lg"
      variant={variant}
      disabled={isGenerating}
      className="text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Génération en cours...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" />
          {variant === "default" ? "Générer ma semaine" : "Régénérer la semaine"}
        </>
      )}
    </Button>
  )
}
