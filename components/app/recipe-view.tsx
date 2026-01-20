"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Clock, Heart, HeartOff, RefreshCw, Ban, ShoppingCart } from "lucide-react"
import { useState } from "react"
import { parseTags } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
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

interface Recipe {
  id: string
  name: string
  description: string | null
  instructions: string
  dishwareTips: string | null
  prepTime: number
  cookTime: number
  servings: number
  tags: string | string[]
  ingredients: Array<{
    id: string
    quantity: number
    unit: string
    notes: string | null
    ingredient: {
      id: string
      name: string
    }
  }>
}

interface Meal {
  id: string
  recipe: Recipe
  mealPlan: {
    household: {
      id: string
    }
  }
}

interface RecipeViewProps {
  meal: Meal
  userId: string
}

export function RecipeView({ meal, userId }: RecipeViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [banningIngredient, setBanningIngredient] = useState<string | null>(null)
  const [banDialog, setBanDialog] = useState<{ open: boolean; ingredientId: string | null; ingredientName: string }>({
    open: false,
    ingredientId: null,
    ingredientName: "",
  })
  const [replaceDialog, setReplaceDialog] = useState<{ open: boolean }>({ open: false })

  function openBanDialog(ingredientId: string, ingredientName: string) {
    setBanDialog({ open: true, ingredientId, ingredientName })
  }

  async function handleBanIngredient() {
    if (!banDialog.ingredientId) return

    setBanningIngredient(banDialog.ingredientId)
    try {
      const res = await fetch(`/api/household/${meal.mealPlan.household.id}/ban-ingredient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientId: banDialog.ingredientId }),
      })

      if (res.ok) {
        toast({
          title: "Ingrédient banni",
          description: `On ne te proposera plus jamais ${banDialog.ingredientName} dans ce foyer.`,
          variant: "success",
        })
        setBanDialog({ open: false, ingredientId: null, ingredientName: "" })
        setReplaceDialog({ open: true })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du bannissement",
        variant: "destructive",
      })
    } finally {
      setBanningIngredient(null)
    }
  }

  function handleReplaceMeal() {
    setReplaceDialog({ open: false })
    // TODO: Implémenter remplacement
    router.refresh()
  }

  const totalTime = meal.recipe.prepTime + meal.recipe.cookTime

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-3xl font-bold">{meal.recipe.name}</h1>
          {meal.recipe.description && (
            <p className="text-muted-foreground">{meal.recipe.description}</p>
          )}
        </div>

        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{totalTime} min</span>
          </div>
          <div className="text-muted-foreground">
            {meal.recipe.servings} portion{meal.recipe.servings > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Ingrediénts */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6 space-y-3">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🥕</span>
            Ingrédients
          </h2>
          <ul className="space-y-3">
            {meal.recipe.ingredients.map((ri) => {
              return (
                <li
                  key={ri.id}
                  className="flex justify-between items-center group cursor-pointer hover:bg-accent/50 p-3 rounded-xl -mx-1 transition-all border border-transparent hover:border-primary/20"
                  onClick={() => openBanDialog(ri.ingredient.id, ri.ingredient.name)}
                >
                  <span className="flex-1">
                    <span className="font-semibold text-foreground">{ri.quantity} {ri.unit}</span>{" "}
                    <span className="text-foreground">{ri.ingredient.name}</span>
                    {ri.notes && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({ri.notes})
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-lg"
                      title="Bannir cet ingrédient"
                    >
                      <Ban className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Étapes */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="text-2xl">👨‍🍳</span>
            Étapes de préparation
          </h2>
          <div className="space-y-4">
            {meal.recipe.instructions.split("\n").filter(step => step.trim()).map((step, i) => {
              // Nettoyer l'étape (enlever numérotation si présente)
              const cleanStep = step.replace(/^\d+\.\s*/, "").trim()
              if (!cleanStep) return null
              
              return (
                <div key={i} className="flex gap-4 group">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-lg font-bold shadow-sm group-hover:shadow-md transition-shadow">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-base leading-relaxed text-foreground">{cleanStep}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Vaisselle minimale - encart fixe */}
      {meal.recipe.dishwareTips && (
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🧹</span>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Vaisselle minimale</h3>
                <p className="text-sm text-muted-foreground">
                  {meal.recipe.dishwareTips}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {parseTags(meal.recipe.tags).length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {parseTags(meal.recipe.tags).map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Barre d'actions */}
      <div className="fixed bottom-20 left-0 right-0 border-t border-border bg-card/95 backdrop-blur p-4 z-40 sm:bottom-24">
        <div className="container mx-auto max-w-2xl flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Heart className="h-4 w-4 mr-2" />
            J'aime
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <HeartOff className="h-4 w-4 mr-2" />
            J'aime pas
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Remplacer
          </Button>
        </div>
      </div>

      {/* Dialog de confirmation pour bannir un ingrédient */}
      <AlertDialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ ...banDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bannir cet ingrédient ?</AlertDialogTitle>
            <AlertDialogDescription>
              On ne te proposera plus jamais {banDialog.ingredientName} dans ce foyer. C'est ok ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanIngredient} disabled={banningIngredient !== null}>
              {banningIngredient ? "Bannissement..." : "Bannir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog pour proposer de remplacer le repas */}
      <AlertDialog open={replaceDialog.open} onOpenChange={(open) => setReplaceDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remplacer ce repas ?</AlertDialogTitle>
            <AlertDialogDescription>
              Veux-tu remplacer ce repas maintenant ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.back()}>Non, retour</AlertDialogCancel>
            <AlertDialogAction onClick={handleReplaceMeal}>Oui, remplacer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
