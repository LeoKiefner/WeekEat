"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendHouseholdInvitation } from "@/lib/email/resend"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"

export async function inviteToHousehold(householdId: string, email: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  // Vérifier que l'utilisateur est membre du foyer
  const household = await prisma.household.findFirst({
    where: {
      id: householdId,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  })

  if (!household) {
    throw new Error("Foyer non trouvé ou accès refusé")
  }

  // Vérifier si l'email est déjà membre
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    const isMember = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: existingUser.id,
          householdId,
        },
      },
    })

    if (isMember) {
      throw new Error("Cet utilisateur est déjà membre du foyer")
    }
  }

  // Générer un token unique
  const token = randomBytes(32).toString("base64url")

  // Créer ou mettre à jour l'invitation
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expire dans 7 jours

  const invitation = await prisma.householdInvitation.upsert({
    where: {
      householdId_email: {
        householdId,
        email,
      },
    },
    create: {
      householdId,
      email,
      token,
      invitedBy: session.user.id,
      expiresAt,
    },
    update: {
      token,
      invitedBy: session.user.id,
      expiresAt,
      acceptedAt: null, // Réinitialiser si réinvitation
    },
  })

  // Envoyer l'email via Resend
  const inviter = household.members.find((m) => m.userId === session.user.id)
  const inviterName = inviter?.user.name || session.user.name || "Un membre"

  const invitationLink = `${process.env.NEXTAUTH_URL}/invite/${invitation.token}`

  try {
    await sendHouseholdInvitation({
      to: email,
      inviterName,
      householdName: household.name,
      invitationLink,
    })
  } catch (error: any) {
    console.error("Erreur envoi invitation:", error)
    // Ne pas bloquer, l'invitation est créée en DB
    throw new Error(`Impossible d'envoyer l'email: ${error.message}`)
  }

  revalidatePath(`/household/${householdId}`)
  return invitation
}

export async function acceptInvitation(token: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  const invitation = await prisma.householdInvitation.findUnique({
    where: { token },
    include: {
      household: true,
    },
  })

  if (!invitation) {
    throw new Error("Invitation invalide")
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error("Cette invitation a expiré")
  }

  if (invitation.acceptedAt) {
    throw new Error("Cette invitation a déjà été acceptée")
  }

  if (invitation.email !== session.user.email) {
    throw new Error("Cette invitation n'est pas pour votre adresse email")
  }

  // Vérifier si l'utilisateur est déjà membre
  const existingMember = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        userId: session.user.id,
        householdId: invitation.householdId,
      },
    },
  })

  if (existingMember) {
    // Marquer l'invitation comme acceptée même si déjà membre
    await prisma.householdInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    })
    return { householdId: invitation.householdId, alreadyMember: true }
  }

  // Ajouter l'utilisateur au foyer
  await prisma.householdMember.create({
    data: {
      userId: session.user.id,
      householdId: invitation.householdId,
      role: "member",
    },
  })

  // Marquer l'invitation comme acceptée
  await prisma.householdInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  })

  revalidatePath("/app/week")
  revalidatePath("/app/household")

  return { householdId: invitation.householdId, alreadyMember: false }
}

export async function getHouseholdInvitations(householdId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  // Vérifier que l'utilisateur est membre du foyer
  const household = await prisma.household.findFirst({
    where: {
      id: householdId,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
  })

  if (!household) {
    throw new Error("Foyer non trouvé ou accès refusé")
  }

  const invitations = await prisma.householdInvitation.findMany({
    where: {
      householdId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return invitations
}
