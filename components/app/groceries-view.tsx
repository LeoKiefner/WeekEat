"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Copy, Store, ChefHat } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface MealPlan {
  id: string
  meals: Array<{
    recipe: {
      ingredients: Array<{
        id: string
        quantity: number
        unit: string
        notes: string | null
        ingredient: {
          id: string
          name: string
          category: string
          aisle: string | null
        }
      }>
      name: string
    } | null
  }>
}

interface GroceriesViewProps {
  mealPlan: MealPlan | null
}

interface GroceryItem {
  ingredientId: string
  name: string
  category: string
  aisle: string | null
  totalQuantity: number
  unit: string
  notes: string[]
  checked: boolean
  fromRecipes: string[] // Noms des recettes
}

type ViewMode = "magasin" | "cuisine"

export function GroceriesView({ mealPlan }: GroceriesViewProps) {
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>("magasin")
  const [items, setItems] = useState<GroceryItem[]>(() => {
    if (!mealPlan || !mealPlan.meals) return []

    // Normaliser le nom pour regrouper les ingrédients similaires
    // (mettre en minuscule, supprimer les accents)
    function normalizeName(name: string): string {
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
        .trim()
    }

    // Créer une clé unique basée sur le nom normalisé et l'unité
    // Si l'unité est différente, on peut quand même regrouper pour le même nom
    function createKey(name: string, unit: string): string {
      const normalized = normalizeName(name)
      // Si l'unité est similaire (g/ml/pcs), on regroupe quand même
      // Sinon on garde l'unité dans la clé pour éviter de mélanger g et pcs par exemple
      const unitCategory = ["g", "kg", "mg"].includes(unit.toLowerCase()) 
        ? "weight" 
        : ["ml", "l", "cl"].includes(unit.toLowerCase())
        ? "volume"
        : unit.toLowerCase()
      return `${normalized}_${unitCategory}`
    }

    const aggregated = new Map<string, GroceryItem>()

    mealPlan.meals.forEach((meal) => {
      if (!meal.recipe) return

      meal.recipe.ingredients.forEach((ri) => {
        const key = createKey(ri.ingredient.name, ri.unit)
        const existing = aggregated.get(key)

        if (existing) {
          // Même ingrédient (nom normalisé similaire), additionner les quantités
          existing.totalQuantity += ri.quantity
          if (ri.notes && !existing.notes.includes(ri.notes)) {
            existing.notes.push(ri.notes)
          }
          if (!existing.fromRecipes.includes(meal.recipe!.name)) {
            existing.fromRecipes.push(meal.recipe!.name)
          }
        } else {
          aggregated.set(key, {
            ingredientId: ri.ingredient.id,
            name: ri.ingredient.name,
            category: ri.ingredient.category,
            aisle: ri.ingredient.aisle,
            totalQuantity: ri.quantity,
            unit: ri.unit,
            notes: ri.notes ? [ri.notes] : [],
            checked: false,
            fromRecipes: [meal.recipe!.name],
          })
        }
      })
    })

    return Array.from(aggregated.values()).sort((a, b) => {
      if (viewMode === "magasin") {
        if (a.aisle !== b.aisle) {
          return (a.aisle || "zzz").localeCompare(b.aisle || "zzz")
        }
      }
      return a.name.localeCompare(b.name)
    })
  })

  function toggleItem(ingredientId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.ingredientId === ingredientId
          ? { ...item, checked: !item.checked }
          : item
      )
    )
  }

  function generateListText(): string {
    if (viewMode === "magasin") {
      const byAisle = new Map<string, GroceryItem[]>()
      items.forEach((item) => {
        const aisle = item.aisle || "Autres"
        if (!byAisle.has(aisle)) {
          byAisle.set(aisle, [])
        }
        byAisle.get(aisle)!.push(item)
      })

      let text = "Liste de courses - WeekEat\n"
      text += "=".repeat(30) + "\n\n"

      Array.from(byAisle.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([aisle, aisleItems]) => {
          text += `\n${aisle.toUpperCase()}\n`
          text += "-".repeat(aisle.length) + "\n"

          aisleItems.forEach((item) => {
            const check = item.checked ? "✓" : "☐"
            const qty = `${item.totalQuantity} ${item.unit}`
            text += `${check} ${qty} ${item.name}\n`
          })
        })

      return text
    } else {
      // Mode cuisine: par recette
      // TODO: Implémenter le groupement par recette
      return "Mode cuisine (à implémenter)"
    }
  }

  function handleCopy() {
    const text = generateListText()
    navigator.clipboard.writeText(text)
    toast({
      title: "Liste copiée ! 📋",
      variant: "success",
    })
  }

  function handleDownload() {
    const text = generateListText()
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "liste-de-courses.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!mealPlan || items.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl">🛒</div>
        <h2 className="text-2xl font-bold">Aucune liste de courses</h2>
        <p className="text-muted-foreground">
          Générez d'abord ta semaine pour voir ta liste ici
        </p>
      </div>
    )
  }

  // Mode magasin
  if (viewMode === "magasin") {
    const byAisle = new Map<string, GroceryItem[]>()
    items.forEach((item) => {
      const aisle = item.aisle || "Autres"
      if (!byAisle.has(aisle)) {
        byAisle.set(aisle, [])
      }
      byAisle.get(aisle)!.push(item)
    })

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Liste de courses</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "magasin" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("magasin")}
            >
              <Store className="h-4 w-4 mr-2" />
              Magasin
            </Button>
            <Button
              variant={(viewMode as ViewMode) === "cuisine" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cuisine")}
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Cuisine
            </Button>
          </div>
        </div>

        {/* Actions export */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy} className="flex-1">
            <Copy className="mr-2 h-4 w-4" />
            Copier
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Télécharger
          </Button>
        </div>

        {/* Liste par rayons */}
        <div className="space-y-4">
          {Array.from(byAisle.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([aisle, aisleItems]) => (
              <Card key={aisle} className="border-2 border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{aisle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aisleItems.map((item) => (
                      <li
                        key={item.ingredientId}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(item.ingredientId)}
                        />
                        <span className="flex-1">
                          <span className="font-medium">
                            {item.totalQuantity} {item.unit}
                          </span>{" "}
                          <span>{item.name}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    )
  }

  // Mode cuisine (à implémenter complètement)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Liste de courses</h1>
        <div className="flex gap-2">
          <Button
            variant={(viewMode as ViewMode) === "magasin" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("magasin")}
          >
            <Store className="h-4 w-4 mr-2" />
            Magasin
          </Button>
          <Button
            variant={(viewMode as ViewMode) === "cuisine" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cuisine")}
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Cuisine
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Mode cuisine (à venir) - Regroupement par recette pour batch cooking
        </CardContent>
      </Card>
    </div>
  )
}
