import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createHousehold } from "@/lib/actions/household"
import { CreateHouseholdForm } from "@/components/forms/create-household-form"

export default async function NewHouseholdPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  async function handleCreate(formData: FormData) {
    "use server"
    const name = formData.get("name") as string
    if (!name) return

    const household = await createHousehold(name)
    redirect(`/household/${household.id}/onboarding`)
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Créer un foyer</h1>
      <CreateHouseholdForm onSubmit={handleCreate} />
    </div>
  )
}
