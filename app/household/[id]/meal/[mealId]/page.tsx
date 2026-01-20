import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MealDetailView } from "@/components/meal/meal-detail-view"
import { banIngredient } from "@/lib/actions/household"

interface MealPageProps {
  params: {
    id: string
    mealId: string
  }
}

export default async function MealPage({ params }: MealPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const meal = await prisma.meal.findUnique({
    where: { id: params.mealId },
    include: {
      recipe: {
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      },
      mealPlan: {
        include: {
          household: true,
        },
      },
      reactions: true,
    },
  })

  if (!meal || meal.mealPlan.householdId !== params.id) {
    redirect(`/household/${params.id}/week`)
  }

  return (
    <MealDetailView
      meal={meal}
      householdId={params.id}
      userId={session.user.id}
    />
  )
}
