import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email/resend"
import { getEmailTemplate } from "@/lib/email/templates"

interface Member {
  email: string
  firstName: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      householdName,
      creatorEmail,
      creatorFirstName,
      dietType,
      meatFrequency,
      allergies,
      members,
      minDishware,
      prioritizeSeasonal,
      thursdayRestaurant,
      batchCooking,
      password,
    } = body as {
      householdName: string
      creatorEmail: string
      creatorFirstName: string
      dietType?: string | null
      meatFrequency?: number
      allergies?: string
      members?: Member[]
      minDishware?: boolean
      prioritizeSeasonal?: boolean
      thursdayRestaurant?: boolean
      batchCooking?: boolean
      password: string
    }

    if (!householdName || !creatorEmail || !creatorFirstName || !password) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      )
    }

    const email = creatorEmail.toLowerCase().trim()

    // Vérifier si un utilisateur existe déjà avec cet email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email. Utilise la connexion." },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Construire les préférences du foyer
    const preferences: Array<{ key: string; value: string }> = []

    if (dietType) {
      preferences.push({
        key: "diet",
        value: JSON.stringify([dietType]),
      })
    }

    if (dietType === "omnivore" && typeof meatFrequency === "number") {
      preferences.push({
        key: "meatFrequency",
        value: JSON.stringify(meatFrequency),
      })
    }

    const allergiesArray =
      allergies
        ?.split(",")
        .map((a: string) => a.trim())
        .filter(Boolean) || []

    if (allergiesArray.length > 0) {
      preferences.push({
        key: "allergies",
        value: JSON.stringify(allergiesArray),
      })
    }

    // Créer utilisateur + foyer dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: creatorFirstName.trim(),
          passwordHash,
        },
      })

      const household = await tx.household.create({
        data: {
          name: householdName,
          minDishware: minDishware ?? true,
          prioritizeSeasonal: prioritizeSeasonal ?? true,
          members: {
            create: {
              userId: user.id,
              role: "owner",
            },
          },
          preferences: {
            create: preferences,
          },
        },
      })

      // TODO: utiliser thursdayRestaurant / batchCooking pour créer des contraintes si besoin

      const invitedMembers = (members || []).filter(
        (m) => m.email.toLowerCase() !== email
      )

      if (invitedMembers.length > 0) {
        // Créer les invitations en base
        const invitations = await Promise.all(
          invitedMembers.map((member) =>
            tx.householdInvitation.create({
              data: {
                householdId: household.id,
                email: member.email.toLowerCase(),
                token: crypto.randomUUID(),
                invitedBy: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            })
          )
        )

        // Envoyer les emails d'invitation (hors transaction)
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

        Promise.all(
          invitations.map((invitation, index) => {
            const member = invitedMembers[index]
            const invitationLink = `${baseUrl}/join/${invitation.token}`
            return import("@/lib/email/resend").then(({ sendHouseholdInvitation }) =>
              sendHouseholdInvitation({
                to: invitation.email,
                inviterName: creatorFirstName.trim() || "Un membre",
                householdName: household.name,
                invitationLink,
              }).catch((err) => {
                console.error(
                  "[ONBOARDING] Erreur d'envoi d'invitation à",
                  invitation.email,
                  err
                )
              })
            )
          })
        ).catch((err) => {
          console.error("[ONBOARDING] Erreur globale d'envoi des invitations:", err)
        })
      }

      return { user, household }
    })

    // Envoyer un email de bienvenue (optionnel, sans validation)
    try {
      const html = getEmailTemplate({
        title: "Bienvenue sur WeekEat 🎉",
        preheader: "Ton compte a bien été créé, on s'occupe des repas 🍽️",
        content: `
          <h2>Bienvenue ${creatorFirstName.trim()} ! 👋</h2>
          <p>Ton compte <strong>WeekEat</strong> est prêt, ainsi que ton foyer <strong>"${householdName}"</strong>.</p>
          <p>Tu peux dès maintenant planifier ta semaine, ajuster tes préférences et inviter les personnes avec qui tu partages tes repas.</p>
        `,
      })

      await sendEmail({
        to: email,
        subject: "Bienvenue sur WeekEat ✨",
        html,
      })
    } catch (e) {
      console.error("[ONBOARDING] Erreur lors de l'envoi de l'email de bienvenue:", e)
    }

    return NextResponse.json(
      {
        success: true,
        userId: result.user.id,
        householdId: result.household.id,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[ONBOARDING] Erreur register:", error)
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}

