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
    // Vérifier si mealPlan a la propriété meals
    const mealsCount = ('meals' in mealPlan && Array.isArray((mealPlan as any).meals)) 
      ? (mealPlan as any).meals.length 
      : 0
    console.log("[API] generateMealPlan terminé, mealPlan:", {
      id: mealPlan.id,
      mealsCount: mealsCount
    })

    return NextResponse.json({ 
      success: true,
      mealPlanId: mealPlan.id,
      mealsCount: mealsCount
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
