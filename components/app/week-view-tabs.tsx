"use client"

import { useState } from "react"
import { Calendar, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WeekCalendarView } from "./week-calendar-view"
import { WeekListView } from "./week-list-view"

type ViewMode = "calendar" | "list"

interface WeekViewTabsProps {
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

export function WeekViewTabs({ mealPlan, householdId }: WeekViewTabsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  return (
    <div className="space-y-4">
      {/* Sélecteur de vue */}
      <div className="flex gap-2 justify-end">
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
          className="flex items-center gap-2"
        >
          <List className="h-4 w-4" />
          Liste
        </Button>
        <Button
          variant={viewMode === "calendar" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("calendar")}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Calendrier
        </Button>
      </div>

      {/* Contenu selon la vue */}
      {viewMode === "list" ? (
        <WeekListView mealPlan={mealPlan} householdId={householdId} />
      ) : (
        <WeekCalendarView mealPlan={mealPlan} householdId={householdId} />
      )}
    </div>
  )
}
