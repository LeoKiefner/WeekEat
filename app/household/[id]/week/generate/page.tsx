"use server"

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateMealPlan } from "@/lib/actions/meal-plan"
import { GenerationClient } from "@/components/week/generation-client"

interface GeneratePageProps {
  params: {
    id: string
  }
  searchParams: {
    generating?: string
  }
}

export default async function GeneratePage({ params, searchParams }: GeneratePageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Si on est en train de générer
  if (searchParams.generating === "true") {
    return <GenerationClient householdId={params.id} />
  }

  // Sinon, démarrer la génération
  redirect(`/household/${params.id}/week/generate?generating=true`)
}
