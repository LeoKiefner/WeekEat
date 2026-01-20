import { NextRequest, NextResponse } from "next/server"
import { unbanIngredient } from "@/lib/actions/household"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { ingredientId } = await req.json()

    if (!ingredientId) {
      return NextResponse.json(
        { error: "ingredientId requis" },
        { status: 400 }
      )
    }

    await unbanIngredient(params.id, ingredientId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}
