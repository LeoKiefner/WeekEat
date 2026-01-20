import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserHousehold } from "@/lib/actions/household"
import { getMealPlan } from "@/lib/actions/meal-plan"
import { GroceriesView } from "@/components/app/groceries-view"
import { PageContainer } from "@/components/layout/page-container"

export default async function GroceriesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const household = await getUserHousehold()

  if (!household) {
    redirect("/app/week")
  }

  const mealPlan = await getMealPlan(household.id)

  return (
    <PageContainer>
      <GroceriesView mealPlan={mealPlan} />
    </PageContainer>
  )
}
