import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserHousehold } from "@/lib/actions/household"
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

  return (
    <PageContainer>
      <HouseholdView householdId={household.id} household={household} />
    </PageContainer>
  )
}
