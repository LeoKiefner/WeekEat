import { NextRequest, NextResponse } from "next/server"
import { leaveHousehold } from "@/lib/actions/household"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const householdId = params.id
    await leaveHousehold(householdId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sortie du foyer" },
      { status: 400 }
    )
  }
}
