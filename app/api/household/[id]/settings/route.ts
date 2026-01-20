import { NextRequest, NextResponse } from "next/server"
import { updateHouseholdSettings } from "@/lib/actions/household"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json()

    const updated = await updateHouseholdSettings(params.id, data)

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}
