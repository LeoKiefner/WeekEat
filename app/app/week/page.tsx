import { redirect } from "next/navigation"
import { getUserHouseholds } from "@/lib/actions/household"
import { getMealPlan } from "@/lib/actions/meal-plan"
import { WeekHomeView } from "@/components/app/week-home-view"
import { CompleteOnboarding } from "@/components/app/complete-onboarding"
import { PageContainer } from "@/components/layout/page-container"

export default async function WeekPage({
  searchParams,
}: {
  searchParams: { onboarding?: string }
}) {
  const households = await getUserHouseholds()
  const hasHousehold = households.length > 0

  // Si pas de foyer mais qu'on vient de finir l'onboarding, compléter la création
  if (!hasHousehold && searchParams?.onboarding === "complete") {
    return (
      <PageContainer>
        <CompleteOnboarding />
      </PageContainer>
    )
  }

  // Si pas de foyer, rediriger vers l'onboarding
  if (!hasHousehold) {
    redirect("/onboarding")
  }

  // Un seul foyer par utilisateur
  const household = households[0]
  const mealPlan = await getMealPlan(household.id)

  console.log(`[WeekPage] MealPlan récupéré: ${mealPlan ? mealPlan.id : "null"}, meals: ${mealPlan?.meals?.length || 0}`)

  return (
    <PageContainer>
      <WeekHomeView 
        household={household} 
        mealPlan={mealPlan} 
        householdId={household.id}
        showOnboarding={false}
      />
    </PageContainer>
  )
}
