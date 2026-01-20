"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, parseTags } from "@/lib/utils"
import Link from "next/link"
import { Calendar, Clock, UtensilsCrossed } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
      dishwareTips: string | null
    } | null
  }>
}

interface WeekViewProps {
  mealPlan: MealPlan | null
  householdId: string
}

export function WeekView({ mealPlan, householdId }: WeekViewProps) {
  if (!mealPlan || mealPlan.meals.length === 0) {
    return null // Géré par la page parente
  }

  // Grouper les repas par jour
  const mealsByDay = mealPlan.meals.reduce((acc, meal) => {
    const dayKey = new Date(meal.date).toISOString().split("T")[0]
    if (!acc[dayKey]) {
      acc[dayKey] = []
    }
    acc[dayKey].push(meal)
    return acc
  }, {} as Record<string, typeof mealPlan.meals>)

  const days = Object.keys(mealsByDay).sort()

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">📊 Résumé de la semaine</CardTitle>
          <CardDescription className="text-base">
            Du {formatDate(mealPlan.weekStart).split(" ")[0]} au {formatDate(mealPlan.weekEnd).split(" ")[0]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-cosy">
              <div className="p-2 rounded-full bg-primary/20">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Repas planifiés</p>
                <p className="text-2xl font-bold">{mealPlan.meals.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-cosy">
              <div className="p-2 rounded-full bg-primary/20">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temps moyen</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    mealPlan.meals.reduce((acc, m) => acc + (m.prepTime || 0), 0) /
                      mealPlan.meals.length
                  )}{" "}
                  min
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map((day) => {
          const meals = mealsByDay[day]
          const date = new Date(day)
          const dayName = formatDate(date).split(" ")[0]
          const dayNumber = date.getDate()

          return (
            <Card key={day} className="border-2 border-primary/10 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>{dayName}</span>
                  <span className="text-2xl">
                    {dayNumber === new Date().getDate() ? "✨" : ""}
                  </span>
                </CardTitle>
                <CardDescription className="text-base">
                  {dayNumber} {formatDate(date).split(" ").slice(1, 3).join(" ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {meals.map((meal) => (
                  <Link
                    key={meal.id}
                    href={`/household/${householdId}/meal/${meal.id}`}
                    className="block group"
                  >
                    <Card className="hover:bg-gradient-cosy transition-all hover:scale-[1.02] border border-primary/10">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                              {meal.recipe?.name || "Repas non défini"}
                            </h4>
                            <p className="text-xs text-muted-foreground capitalize mt-1">
                              {meal.mealType === "lunch" ? "🍽️ Déjeuner" : meal.mealType === "dinner" ? "🌙 Dîner" : "🌅 Petit-déj"}
                            </p>
                          </div>
                        </div>
                        {meal.recipe && (
                          <>
                            {meal.recipe.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {meal.recipe.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {parseTags(meal.recipe.tags).map((tag) => (
                                <Badge 
                                  key={tag} 
                                  variant="secondary" 
                                  className="text-xs rounded-full bg-primary/10 text-primary border-0"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {meal.prepTime && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{meal.prepTime} min</span>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
