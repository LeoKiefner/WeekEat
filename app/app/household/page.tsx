import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserHousehold } from "@/lib/actions/household"
import { getHouseholdInvitations } from "@/lib/actions/invitations"
import { HouseholdView } from "@/components/app/household-view"
import { PageContainer } from "@/components/layout/page-container"

export default async function HouseholdPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const household = await getUserHousehold()

  if (!household) {
    redirect("/app/week")
  }

  const householdData = household as any // Type assertion to include userRole
  const userId = session.user.id
  const userRole = householdData.userRole || "member"

  // Charger les invitations
  const invitations = await getHouseholdInvitations(household.id)

  return (
    <PageContainer>
      <HouseholdView 
        householdId={household.id} 
        household={household}
        userId={userId}
        userRole={userRole}
        invitations={invitations}
      />
    </PageContainer>
  )
}
