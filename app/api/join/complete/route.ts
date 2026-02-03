import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, password } = body as { token: string; password: string }

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token ou mot de passe manquant" },
        { status: 400 }
      )
    }

    const invitation = await prisma.householdInvitation.findUnique({
      where: { token },
      include: {
        household: true,
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation invalide" },
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Cette invitation a expiré" },
        { status: 400 }
      )
    }

    const email = invitation.email.toLowerCase()

    // Voir si un utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { email },
    })

    const passwordHash = await bcrypt.hash(password, 10)

    if (!user) {
      // Créer l'utilisateur si nécessaire
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
        },
      })
    } else if (!user.passwordHash) {
      // Mettre à jour l'utilisateur existant pour lui ajouter un mot de passe
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
        },
      })
    }

    // Vérifier s'il est déjà membre du foyer
    const existingMember = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: user.id,
          householdId: invitation.householdId,
        },
      },
    })

    if (!existingMember) {
      await prisma.householdMember.create({
        data: {
          userId: user.id,
          householdId: invitation.householdId,
          role: "member",
        },
      })
    }

    await prisma.householdInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    })

    return NextResponse.json(
      {
        success: true,
        email,
        householdId: invitation.householdId,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[JOIN] Erreur complete invitation:", error)
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}

