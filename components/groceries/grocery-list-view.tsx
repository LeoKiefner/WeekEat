"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Copy } from "lucide-react"
import { useState } from "react"
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
    } | null
  }>
} | null

interface GroceryListViewProps {
  mealPlan: MealPlan
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
}

export function GroceryListView({ mealPlan }: GroceryListViewProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<GroceryItem[]>(() => {
    if (!mealPlan || !mealPlan.meals) return []

    // Agréger les ingrédients par nom
    const aggregated = new Map<string, GroceryItem>()

    mealPlan.meals.forEach((meal) => {
      if (!meal.recipe) return

      meal.recipe.ingredients.forEach((ri) => {
        const key = ri.ingredient.id
        const existing = aggregated.get(key)

        if (existing) {
          // Même ingrédient, additionner les quantités
          existing.totalQuantity += ri.quantity
          if (ri.notes && !existing.notes.includes(ri.notes)) {
            existing.notes.push(ri.notes)
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
          })
        }
      })
    })

    // Trier par rayon puis par nom
    const sorted = Array.from(aggregated.values()).sort((a, b) => {
      if (a.aisle !== b.aisle) {
        return (a.aisle || "zzz").localeCompare(b.aisle || "zzz")
      }
      return a.name.localeCompare(b.name)
    })

    return sorted
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
          const notes = item.notes.length > 0 ? ` (${item.notes.join(", ")})` : ""
          text += `${check} ${qty} ${item.name}${notes}\n`
        })
      })

    return text
  }

  function handleCopy() {
    const text = generateListText()
    navigator.clipboard.writeText(text)
    toast({
      title: "Liste copiée dans le presse-papiers",
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
      <Card>
        <CardHeader>
          <CardTitle>Aucun ingrédient</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aucun repas planifié pour générer une liste de courses
          </p>
        </CardContent>
      </Card>
    )
  }

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
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copier
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Télécharger
        </Button>
      </div>

      <div className="space-y-6">
        {Array.from(byAisle.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([aisle, aisleItems]) => (
            <Card key={aisle}>
              <CardHeader>
                <CardTitle>{aisle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aisleItems.map((item) => (
                    <li
                      key={item.ingredientId}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
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
                        {item.notes.length > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({item.notes.join(", ")})
                          </span>
                        )}
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
