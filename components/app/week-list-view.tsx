"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency, parseTags } from "@/lib/utils"
import { Clock } from "lucide-react"

interface WeekListViewProps {
  mealPlan: {
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
  householdId: string
}

export function WeekListView({ mealPlan, householdId }: WeekListViewProps) {
  // Trier les repas par date et type
  const sortedMeals = [...mealPlan.meals].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    if (dateA !== dateB) return dateA - dateB
    
    // Si même jour, ordre: breakfast < lunch < dinner
    const order = { breakfast: 0, lunch: 1, dinner: 2 }
    return (order[a.mealType as keyof typeof order] || 1) - (order[b.mealType as keyof typeof order] || 1)
  })

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case "breakfast":
        return "🍳 Petit-déjeuner"
      case "lunch":
        return "🍽️ Déjeuner"
      case "dinner":
        return "🌙 Dîner"
      default:
        return type
    }
  }

  return (
    <div className="space-y-3">
      {sortedMeals.map((meal) => {
        const date = new Date(meal.date)
        const isToday = date.toDateString() === new Date().toDateString()
        const dateStr = formatDate(date)
        const tags = meal.recipe ? parseTags(meal.recipe.tags) : []

        return (
          <Link key={meal.id} href={`/app/recipe/${meal.id}`}>
            <Card className="hover:bg-gradient-cosy transition-colors border border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-muted-foreground">
                        {dateStr.split(",")[0]} {/* Jour */}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} {/* Date courte */}
                      </span>
                      {isToday && (
                        <Badge variant="secondary" className="text-xs">
                          Aujourd'hui
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {getMealTypeLabel(meal.mealType)}
                      </span>
                      <h3 className="font-semibold text-lg">
                        {meal.recipe?.name || "Repas"}
                      </h3>
                    </div>
                    {meal.recipe?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {meal.recipe.description}
                      </p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs rounded-full bg-primary/10 text-primary border-0"
                          >
                            {tag === "one-pan" ? "🥘" : tag === "quick" ? "⚡" : tag === "batch-cook" ? "📦" : ""} {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm">
                    {meal.prepTime && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{meal.prepTime} min</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
