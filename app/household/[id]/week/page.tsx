import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getMealPlan } from "@/lib/actions/meal-plan"
import { getHousehold } from "@/lib/actions/household"
import { WeekView } from "@/components/week/week-view"
import { GenerateWeekButton } from "@/components/week/generate-week-button"
import Link from "next/link"
import { Settings, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WeekPageProps {
  params: {
    id: string
  }
}

export default async function WeekPage({ params }: WeekPageProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-foreground">{household.name}</h1>
              <span className="text-2xl">🏠</span>
            </div>
            <p className="text-muted-foreground">Votre planification de la semaine</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/household/${params.id}/settings`}>
                <Users className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link href={`/household/${params.id}/settings`}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Bouton générer ou afficher semaine */}
        {!mealPlan || mealPlan.meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
            <div className="text-8xl animate-float">🍽️</div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                Prêt pour une nouvelle semaine ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-md">
                Laissez notre IA créer votre planification hebdomadaire
                personnalisée avec des recettes délicieuses et adaptées à vos goûts
              </p>
            </div>
            <GenerateWeekButton householdId={params.id} />
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <GenerateWeekButton householdId={params.id} variant="secondary" />
            </div>
            <WeekView mealPlan={mealPlan} householdId={params.id} />
          </>
        )}
      </div>
    </div>
  )
}
