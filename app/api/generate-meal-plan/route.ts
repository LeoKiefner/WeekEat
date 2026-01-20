import { NextRequest, NextResponse } from "next/server"
import { generateMealPlan } from "@/lib/actions/meal-plan"

export async function POST(req: NextRequest) {
  try {
    const { householdId } = await req.json()
    console.log("[API] /api/generate-meal-plan appelé avec householdId:", householdId)

    if (!householdId) {
      console.error("[API] householdId manquant")
      return NextResponse.json(
        { error: "householdId requis" },
        { status: 400 }
      )
    }

    console.log("[API] Appel de generateMealPlan...")
    const mealPlan = await generateMealPlan(householdId)
    console.log("[API] generateMealPlan terminé, mealPlan:", {
      id: mealPlan.id,
      mealsCount: mealPlan.meals?.length || 0
    })

    return NextResponse.json({ 
      success: true,
      mealPlanId: mealPlan.id,
      mealsCount: mealPlan.meals?.length || 0
    })
  } catch (error: any) {
    console.error("[API] Erreur génération:", error)
    console.error("[API] Stack:", error.stack)
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}
