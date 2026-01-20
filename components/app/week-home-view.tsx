"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, parseTags } from "@/lib/utils"
import Link from "next/link"
import { UtensilsCrossed, Clock, Leaf, Sparkles, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GenerateWeekButton } from "@/components/week/generate-week-button"
import { OnboardingModal } from "@/components/app/onboarding-modal"
import { WeekViewTabs } from "./week-view-tabs"

interface Household {
  id: string
  name: string
  prioritizeSeasonal: boolean
  minDishware: boolean
}

interface MealPlan {
  id: string
  weekStart: Date
  weekEnd: Date
  meals: Array<{
    id: string
    date: Date
    mealType: string
    prepTime: number | null
    recipe: {
      id: string
      name: string
      description: string | null
      tags: string | string[]
      prepTime: number
      cookTime: number
    } | null
  }>
}

interface WeekHomeViewProps {
  household: Household | null
  mealPlan: MealPlan | null
  householdId: string | null
  showOnboarding: boolean
}

export function WeekHomeView({ household, mealPlan, householdId, showOnboarding }: WeekHomeViewProps) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(showOnboarding)

  // Si pas de foyer, état vide avec onboarding
  if (!household || !householdId) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4">
          <div className="text-8xl animate-float">🍽️</div>
          <div className="space-y-3 max-w-md">
            <h2 className="text-3xl font-bold text-foreground">
              Bienvenue sur WeekEat !
            </h2>
            <p className="text-lg text-muted-foreground">
              On te simplifie la vie. Commence par créer ton foyer pour planifier
              tes repas de la semaine avec l'IA.
            </p>
          </div>
          <Button
            onClick={() => setIsOnboardingOpen(true)}
            size="lg"
            className="text-lg px-8 py-6 rounded-xl"
          >
            Créer mon foyer
          </Button>
        </div>
        <OnboardingModal 
          open={isOnboardingOpen} 
          onClose={() => setIsOnboardingOpen(false)} 
        />
      </>
    )
  }

  // Debug: vérifier ce qu'on reçoit
  console.log("[WeekHomeView] mealPlan:", mealPlan ? { id: mealPlan.id, mealsCount: mealPlan.meals?.length || 0 } : "null")

  // Si pas de planification, état vide cosy
  if (!mealPlan || !mealPlan.meals || mealPlan.meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4">
        <div className="text-8xl animate-float">🍽️</div>
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl font-bold text-foreground">
            Prêt pour une nouvelle semaine ?
          </h2>
          <p className="text-lg text-muted-foreground">
            On te simplifie la vie. Laisse notre IA créer ta planification
            personnalisée avec des recettes délicieuses et adaptées à tes goûts.
          </p>
        </div>
        <GenerateWeekButton householdId={householdId} />
      </div>
    )
  }

  // Plus besoin de grouper, les vues le font elles-mêmes
  const avgTime = Math.round(
    mealPlan.meals.reduce((acc, m) => acc + (m.prepTime || 0), 0) /
      mealPlan.meals.length
  )

  // Info saisonnière (simplifiée)
  const currentMonth = new Date().getMonth() + 1
  const seasonalInfo = currentMonth >= 11 || currentMonth <= 2 
    ? "🍂 Choux, carottes, pommes de terre"
    : currentMonth >= 3 && currentMonth <= 5
    ? "🌸 Asperges, épinards, radis"
    : "☀️ Tomates, courgettes, haricots verts"

  return (
    <div className="space-y-6 w-full">
      {/* Bandeau résumé doux */}
      <Card className="border-2 border-primary/20 shadow-md bg-gradient-cosy">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Cette semaine</CardTitle>
            <span className="text-2xl">✨</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{mealPlan.meals.length}</p>
              <p className="text-xs text-muted-foreground">repas</p>
            </div>
            <div className="text-center">
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{avgTime}</p>
              <p className="text-xs text-muted-foreground">min</p>
            </div>
          </div>
          
          {household.prioritizeSeasonal && (
            <div className="mt-4 pt-4 border-t border-primary/20 flex items-center gap-2 text-sm">
              <Leaf className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">{seasonalInfo}</span>
            </div>
          )}

          {household.minDishware && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>🧹</span>
              <span>Vaisselle minimale activée</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vue avec tabs (Liste et Calendrier) */}
      <WeekViewTabs mealPlan={mealPlan} householdId={householdId} />
      {/* Fin ancienne grille */}

      {/* Actions principales */}
      <div className="flex flex-col gap-3 pt-4">
        <GenerateWeekButton householdId={householdId} variant="secondary" />
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-xl"
        >
          <Link href="/app/groceries">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Optimiser la liste de courses
          </Link>
        </Button>
      </div>
    </div>
  )
}

