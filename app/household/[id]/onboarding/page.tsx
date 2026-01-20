import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getHousehold } from "@/lib/actions/household"
import { HouseholdOnboarding } from "@/components/household/household-onboarding"

interface OnboardingPageProps {
  params: {
    id: string
  }
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const household = await getHousehold(params.id)

  if (!household) {
    redirect("/app/week")
  }

  // Vérifier si l'utilisateur est le propriétaire
  const isOwner = household.members.some(
    (m) => m.userId === session.user.id && m.role === "owner"
  )

  if (!isOwner) {
    redirect(`/household/${params.id}/week`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <HouseholdOnboarding household={household} />
    </div>
  )
}
