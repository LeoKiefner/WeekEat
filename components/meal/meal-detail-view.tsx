"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, parseTags } from "@/lib/utils"
import { Clock, Utensils, AlertTriangle, Heart, HeartOff, Ban } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
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

interface MealDetailViewProps {
  meal: {
    id: string
    date: Date
    mealType: string
    prepTime: number | null
    recipe: {
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
    } | null
  }
  householdId: string
  userId: string
}

export function MealDetailView({ meal, householdId, userId }: MealDetailViewProps) {
  const { toast } = useToast()
  const [banningIngredient, setBanningIngredient] = useState<string | null>(null)
  const [banDialog, setBanDialog] = useState<{ open: boolean; ingredientId: string | null }>({
    open: false,
    ingredientId: null,
  })

  if (!meal.recipe) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Repas non défini</CardTitle>
          </CardHeader>
      </Card>

      {/* Dialog de confirmation pour bannir un ingrédient */}
      <AlertDialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ ...banDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bannir cet ingrédient ?</AlertDialogTitle>
            <AlertDialogDescription>
              Bannir cet ingrédient pour tout le foyer ?
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
    </div>
  )
}

  function openBanDialog(ingredientId: string) {
    setBanDialog({ open: true, ingredientId })
  }

  async function handleBanIngredient() {
    if (!banDialog.ingredientId) return

    setBanningIngredient(banDialog.ingredientId)
    try {
      const res = await fetch(`/api/household/${householdId}/ban-ingredient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientId: banDialog.ingredientId }),
      })

      if (res.ok) {
        toast({
          title: "Ingrédient banni avec succès",
          variant: "success",
        })
        setBanDialog({ open: false, ingredientId: null })
        window.location.reload()
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Erreur",
        description: "Erreur lors du bannissement",
        variant: "destructive",
      })
    } finally {
      setBanningIngredient(null)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link href={`/household/${householdId}/week`} className="text-sm text-muted-foreground hover:underline mb-2 inline-block">
            ← Retour à la semaine
          </Link>
          <h1 className="text-3xl font-bold">{meal.recipe.name}</h1>
          <p className="text-muted-foreground capitalize">
            {formatDate(meal.date)} • {meal.mealType}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {meal.recipe.description || "Aucune description"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line space-y-4">
                {meal.recipe.instructions.split("\n").map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="font-semibold text-primary">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {meal.recipe.dishwareTips && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Astuce vaisselle minimale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{meal.recipe.dishwareTips}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Ingrédients</CardTitle>
              <CardDescription>{meal.recipe.servings} portions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {meal.recipe.ingredients.map((ri) => (
                  <li key={ri.id} className="flex justify-between items-center group">
                    <span>
                      {ri.quantity} {ri.unit} {ri.ingredient.name}
                      {ri.notes && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({ri.notes})
                        </span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openBanDialog(ri.ingredient.id)}
                      disabled={banningIngredient === ri.ingredient.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Ban className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Préparation</p>
                  <p className="font-semibold">{meal.recipe.prepTime} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cuisson</p>
                  <p className="font-semibold">{meal.recipe.cookTime} min</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {parseTags(meal.recipe.tags).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Heart className="mr-2 h-4 w-4" />
                J'aime
              </Button>
              <Button variant="outline" className="w-full">
                <HeartOff className="mr-2 h-4 w-4" />
                Je n'aime pas
              </Button>
              <Button variant="outline" className="w-full">
                Remplacer ce repas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
