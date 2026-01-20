import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RecipeView } from "@/components/app/recipe-view"

interface RecipePageProps {
  params: {
    id: string
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Chercher par mealId (on passe l'ID du meal depuis la semaine)
  const meal = await prisma.meal.findFirst({
    where: {
      OR: [
        { id: params.id },
        { recipeId: params.id },
      ],
    },
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
    },
  })

  if (!meal || !meal.recipe) {
    redirect("/app/week")
  }

  return <RecipeView meal={meal} userId={session.user.id} />
}
