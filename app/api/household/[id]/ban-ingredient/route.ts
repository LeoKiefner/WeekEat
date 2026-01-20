import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { banIngredient } from "@/lib/actions/household"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  try {
    const { ingredientId, reason } = await req.json()

    if (!ingredientId) {
      return NextResponse.json(
        { error: "ingredientId requis" },
        { status: 400 }
      )
    }

    const banned = await banIngredient(params.id, ingredientId, reason)

    return NextResponse.json(banned)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}
