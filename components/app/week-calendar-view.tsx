"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MealSlot } from "@/components/week/meal-slot"

interface WeekCalendarViewProps {
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

export function WeekCalendarView({ mealPlan, householdId }: WeekCalendarViewProps) {
  const weekStart = new Date(mealPlan.weekStart)
  const days = []

  // Générer les 7 jours de la semaine
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    days.push(date)
  }

  const getMealForSlot = (date: Date, mealType: "lunch" | "dinner") => {
    return mealPlan.meals.find((meal) => {
      const mealDate = new Date(meal.date)
      return (
        mealDate.getDate() === date.getDate() &&
        mealDate.getMonth() === date.getMonth() &&
        mealDate.getFullYear() === date.getFullYear() &&
        meal.mealType === mealType
      )
    })
  }

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  const today = new Date()

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {days.map((day, index) => {
        const isToday =
          day.getDate() === today.getDate() &&
          day.getMonth() === today.getMonth() &&
          day.getFullYear() === today.getFullYear()

        const lunchMeal = getMealForSlot(day, "lunch")
        const dinnerMeal = getMealForSlot(day, "dinner")

        // Créer des objets meal par défaut si les slots n'existent pas
        const lunchSlot = lunchMeal || {
          id: `lunch-${day.toISOString()}`,
          date: day,
          mealType: "lunch",
          estimatedCost: null,
          prepTime: null,
          recipe: null,
        }

        const dinnerSlot = dinnerMeal || {
          id: `dinner-${day.toISOString()}`,
          date: day,
          mealType: "dinner",
          estimatedCost: null,
          prepTime: null,
          recipe: null,
        }

        return (
          <Card
            key={index}
            className={`border-2 ${isToday ? "border-primary shadow-md" : "border-primary/10"}`}
          >
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="text-center pb-2 border-b border-primary/10">
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    {dayNames[index]}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  <MealSlot meal={lunchSlot} mealPlanId={mealPlan.id} householdId={householdId} />
                  <MealSlot meal={dinnerSlot} mealPlanId={mealPlan.id} householdId={householdId} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
