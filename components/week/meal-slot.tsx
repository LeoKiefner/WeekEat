"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { parseTags } from "@/lib/utils"
import { Clock, MoreVertical, Trash2, RefreshCw, Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

interface MealSlotProps {
  meal: {
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
  }
  mealPlanId: string
  householdId: string
}

export function MealSlot({ meal, mealPlanId, householdId }: MealSlotProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isClearing, setIsClearing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const mealTypeLabel = meal.mealType === "lunch" ? "🍽️ Midi" : "🌙 Soir"
  const tags = meal.recipe ? parseTags(meal.recipe.tags) : []
  const isEmpty = !meal.recipe

  async function handleClear() {
    setIsClearing(true)
    try {
      const { clearMeal } = await import("@/lib/actions/meal-plan")
      await clearMeal(meal.id)
      toast({
        title: "Repas supprimé",
        description: "Le slot est maintenant vide",
        variant: "success",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
      setClearDialogOpen(false)
    }
  }

  async function handleRegenerate() {
    setIsRegenerating(true)
    try {
      const { replaceMealInPlan } = await import("@/lib/actions/meal-plan")
      await replaceMealInPlan(mealPlanId, meal.id)
      toast({
        title: "Repas régénéré",
        description: "Un nouveau repas a été généré",
        variant: "success",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la régénération",
        variant: "destructive",
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  // Si le meal n'a pas d'ID réel (slot virtuel), on doit le créer d'abord
  const isVirtualSlot = meal.id.startsWith("lunch-") || meal.id.startsWith("dinner-")

  if (isEmpty || isVirtualSlot) {
    return (
      <Card className="border-2 border-dashed border-primary/20 bg-primary/5 min-h-[80px] flex items-center justify-center">
        <CardContent className="p-3 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{mealTypeLabel}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={async () => {
                  // Si c'est un slot virtuel, le créer d'abord
                  if (isVirtualSlot) {
                    try {
                      const { ensureMealSlot } = await import("@/lib/actions/meal-plan")
                      const createdMeal = await ensureMealSlot(mealPlanId, meal.date, meal.mealType as "lunch" | "dinner")
                      router.push(`/app/week/add-meal?mealId=${createdMeal.id}`)
                    } catch (error: any) {
                      toast({
                        title: "Erreur",
                        description: error.message || "Erreur lors de la création du slot",
                        variant: "destructive",
                      })
                    }
                  } else {
                    router.push(`/app/week/add-meal?mealId=${meal.id}`)
                  }
                }}>
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher un repas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  if (isVirtualSlot) {
                    try {
                      const { ensureMealSlot } = await import("@/lib/actions/meal-plan")
                      const createdMeal = await ensureMealSlot(mealPlanId, meal.date, meal.mealType as "lunch" | "dinner")
                      router.push(`/app/week/add-meal?mealId=${createdMeal.id}&manual=true`)
                    } catch (error: any) {
                      toast({
                        title: "Erreur",
                        description: error.message || "Erreur lors de la création du slot",
                        variant: "destructive",
                      })
                    }
                  } else {
                    router.push(`/app/week/add-meal?mealId=${meal.id}&manual=true`)
                  }
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer manuellement
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  // Si c'est un slot virtuel, le créer d'abord
                  if (isVirtualSlot) {
                    try {
                      const { ensureMealSlot, replaceMealInPlan } = await import("@/lib/actions/meal-plan")
                      const createdMeal = await ensureMealSlot(mealPlanId, meal.date, meal.mealType as "lunch" | "dinner")
                      await replaceMealInPlan(mealPlanId, createdMeal.id)
                      toast({
                        title: "Repas généré",
                        description: "Un nouveau repas a été généré",
                        variant: "success",
                      })
                      router.refresh()
                    } catch (error: any) {
                      toast({
                        title: "Erreur",
                        description: error.message || "Erreur lors de la génération",
                        variant: "destructive",
                      })
                    }
                  } else {
                    await handleRegenerate()
                  }
                }} disabled={isRegenerating}>
                  {isRegenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Générer avec l'IA
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="hover:bg-primary/5 transition-colors border-0 bg-card/50 relative group">
        <Link href={`/app/recipe/${meal.id}`} className="block">
          <CardContent className="p-2 space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-xs">{mealTypeLabel}</span>
              <h4 className="font-medium text-xs line-clamp-1 flex-1">
                {meal.recipe!.name}
              </h4>
            </div>
            {meal.prepTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{meal.prepTime}min</span>
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-0.5">
                {tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] px-1 py-0 h-4 bg-primary/10 text-primary border-0"
                  >
                    {tag === "one-pan" ? "🥘" : tag === "quick" ? "⚡" : tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Link>
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRegenerate} disabled={isRegenerating}>
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Régénérer avec l'IA
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/app/week/add-meal?mealId=${meal.id}`)}>
                <Search className="h-4 w-4 mr-2" />
                Remplacer par un repas existant
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setClearDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce repas ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le slot sera vidé mais pourra être rempli plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} disabled={isClearing}>
              {isClearing ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
