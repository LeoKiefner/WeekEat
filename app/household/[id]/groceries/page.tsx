import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getMealPlan } from "@/lib/actions/meal-plan"
import { getHousehold } from "@/lib/actions/household"
import { GroceryListView } from "@/components/groceries/grocery-list-view"

interface GroceriesPageProps {
  params: {
    id: string
  }
}

export default async function GroceriesPage({ params }: GroceriesPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const household = await getHousehold(params.id)

  if (!household) {
    redirect("/app/week")
  }

  const mealPlan = await getMealPlan(params.id)

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Liste de courses</h1>
          <p className="text-muted-foreground">{household.name}</p>
        </div>
      </div>

      <GroceryListView mealPlan={mealPlan} />
    </div>
  )
}
