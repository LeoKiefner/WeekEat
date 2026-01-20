import { NextRequest, NextResponse } from "next/server"
import { updatePreference, deletePreference } from "@/lib/actions/household"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { key, value } = await req.json()

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "key et value requis" },
        { status: 400 }
      )
    }

    const preference = await updatePreference(params.id, key, value)

    return NextResponse.json(preference)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json(
        { error: "key requis" },
        { status: 400 }
      )
    }

    await deletePreference(params.id, key)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}
