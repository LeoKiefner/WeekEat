"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createHouseholdAfterAuth } from "@/lib/actions/household"
import { useToast } from "@/components/ui/use-toast"

const STORAGE_KEY = "weekeat_onboarding_data"

interface OnboardingData {
  householdName: string
  creatorEmail: string
  creatorFirstName: string
  dietType: string | null
  meatFrequency?: number
  allergies: string
  members: Array<{ email: string; firstName: string }>
  minDishware: boolean
  prioritizeSeasonal: boolean
  thursdayRestaurant: boolean
  batchCooking: boolean
}

export function CompleteOnboarding() {
  const router = useRouter()
  const { toast } = useToast()
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    async function complete() {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return

      try {
        const data: OnboardingData = JSON.parse(saved)
        setIsCompleting(true)

        // Parser les allergies
        const allergiesList = data.allergies
          ? data.allergies.split(",").map(a => a.trim()).filter(a => a.length > 0)
          : []

        // Créer le foyer
        await createHouseholdAfterAuth({
          householdName: data.householdName,
          creatorEmail: data.creatorEmail,
          creatorFirstName: data.creatorFirstName,
          dietType: data.dietType || undefined,
          meatFrequency: data.meatFrequency,
          allergies: allergiesList.length > 0 ? allergiesList : undefined,
          minDishware: data.minDishware,
          prioritizeSeasonal: data.prioritizeSeasonal,
          memberEmails: data.members,
        })

        // Nettoyer localStorage
        localStorage.removeItem(STORAGE_KEY)

        toast({
          title: "Foyer créé !",
          description: "🎉 Bienvenue sur WeekEat ! Ta planification peut commencer.",
          variant: "success",
        })

        // Recharger la page
        router.refresh()
      } catch (error: any) {
        console.error("Erreur création foyer:", error)
        toast({
          title: "Erreur",
          description: error.message || "Erreur lors de la création du foyer",
          variant: "destructive",
        })
      } finally {
        setIsCompleting(false)
      }
    }

    complete()
  }, [router, toast])

  if (isCompleting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-float">🍽️</div>
          <p className="text-lg">Création de ton foyer...</p>
        </div>
      </div>
    )
  }

  return null
}
