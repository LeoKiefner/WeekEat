"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createHousehold(data: {
  name: string
  dietType?: string | null
  allergies?: string[]
  minDishware?: boolean
  prioritizeSeasonal?: boolean
  memberEmails?: Array<{ email: string; firstName: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error("Non authentifié")
  }

  // Vérifier si l'utilisateur a déjà un foyer
  const existing = await prisma.household.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
  })

  if (existing) {
    throw new Error("Tu as déjà un foyer. Un seul foyer par utilisateur.")
  }

  // Créer les préférences
  const preferences: Array<{ key: string; value: string }> = []
  
  if (data.dietType) {
    preferences.push({
      key: "diet",
      value: JSON.stringify([data.dietType]),
    })
  }
  
  if (data.allergies && data.allergies.length > 0) {
    preferences.push({
      key: "allergies",
      value: JSON.stringify(data.allergies),
    })
  }

  const household = await prisma.household.create({
    data: {
      name: data.name,
      minDishware: data.minDishware ?? true,
      prioritizeSeasonal: data.prioritizeSeasonal ?? true,
      members: {
        create: {
          userId: session.user.id,
          role: "owner",
        },
      },
      preferences: {
        create: preferences,
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      preferences: true,
    },
  })

  revalidatePath("/app/week")
  revalidatePath("/app/household")
  return household
}

export async function createHouseholdAfterAuth(onboardingData: {
  householdName: string
  creatorEmail: string
  creatorFirstName?: string
  dietType?: string | null
  meatFrequency?: number
  allergies?: string[]
  minDishware?: boolean
  prioritizeSeasonal?: boolean
  memberEmails?: Array<{ email: string; firstName: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error("Non authentifié")
  }

  // Vérifier que l'email correspond
  if (session.user.email.toLowerCase() !== onboardingData.creatorEmail.toLowerCase()) {
    throw new Error("L'email ne correspond pas à votre compte")
  }

  // Vérifier si l'utilisateur a déjà un foyer
  const existing = await prisma.household.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
  })

  if (existing) {
    throw new Error("Tu as déjà un foyer. Un seul foyer par utilisateur.")
  }

  // Créer les préférences
  const preferences: Array<{ key: string; value: string }> = []
  
  if (onboardingData.dietType) {
    preferences.push({
      key: "diet",
      value: JSON.stringify([onboardingData.dietType]),
    })
  }
  
  // Si omnivore, ajouter la fréquence de consommation de viande
  if (onboardingData.dietType === "omnivore" && onboardingData.meatFrequency !== undefined) {
    preferences.push({
      key: "meatFrequency",
      value: JSON.stringify(onboardingData.meatFrequency),
    })
  }
  
  if (onboardingData.allergies && onboardingData.allergies.length > 0) {
    preferences.push({
      key: "allergies",
      value: JSON.stringify(onboardingData.allergies),
    })
  }

  // Mettre à jour le nom de l'utilisateur si fourni
  if (onboardingData.creatorFirstName) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: onboardingData.creatorFirstName },
    })
  }

  const household = await prisma.household.create({
    data: {
      name: onboardingData.householdName,
      minDishware: onboardingData.minDishware ?? true,
      prioritizeSeasonal: onboardingData.prioritizeSeasonal ?? true,
      members: {
        create: {
          userId: session.user.id,
          role: "owner",
        },
      },
      preferences: {
        create: preferences,
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      preferences: true,
    },
  })

  // Inviter les autres membres
  if (onboardingData.memberEmails && onboardingData.memberEmails.length > 0) {
    const { inviteToHousehold } = await import("./invitations")
    
    // Filtrer les membres à inviter (exclure le créateur)
    const membersToInvite = onboardingData.memberEmails.filter(
      m => m.email.toLowerCase() !== session.user.email?.toLowerCase()
    )

    // Inviter chaque membre
    for (const member of membersToInvite) {
      try {
        await inviteToHousehold(household.id, member.email)
      } catch (err) {
        console.error(`Erreur invitation ${member.email}:`, err)
        // Ne pas bloquer si une invitation échoue
      }
    }
  }

  revalidatePath("/app/week")
  revalidatePath("/app/household")
  return household
}

export async function getHousehold(householdId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

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
      bannedIngredients: {
        include: {
          ingredient: true,
        },
        orderBy: {
          bannedAt: "desc",
        },
      },
      preferences: true,
    },
  })

  return household
}

export async function getUserHouseholds() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  // Un seul foyer par utilisateur
  const household = await prisma.household.findFirst({
    where: {
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
      _count: {
        select: {
          members: true,
        },
      },
    },
  })

  return household ? [household] : []
}

export async function getUserHousehold() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  // Retourne le foyer unique de l'utilisateur ou null
  const household = await prisma.household.findFirst({
    where: {
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
      bannedIngredients: {
        include: {
          ingredient: true,
        },
        orderBy: {
          bannedAt: "desc",
        },
      },
      preferences: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  })

  return household
}

export async function banIngredient(householdId: string, ingredientId: string, reason?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  // Vérifier que l'utilisateur est membre du foyer
  const household = await getHousehold(householdId)
  if (!household) {
    throw new Error("Foyer non trouvé ou accès refusé")
  }

  const banned = await prisma.bannedIngredient.upsert({
    where: {
      householdId_ingredientId: {
        householdId,
        ingredientId,
      },
    },
    create: {
      householdId,
      ingredientId,
      reason,
      bannedBy: session.user.id,
    },
    update: {
      reason,
      bannedBy: session.user.id,
    },
  })

  revalidatePath("/app/week")
  revalidatePath("/app/household")
  return banned
}

export async function unbanIngredient(householdId: string, ingredientId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  // Vérifier que l'utilisateur est membre du foyer
  const household = await getHousehold(householdId)
  if (!household) {
    throw new Error("Foyer non trouvé ou accès refusé")
  }

  await prisma.bannedIngredient.delete({
    where: {
      householdId_ingredientId: {
        householdId,
        ingredientId,
      },
    },
  })

  revalidatePath("/app/week")
  revalidatePath("/app/household")
}

export async function updateHouseholdSettings(
  householdId: string,
  data: {
    name?: string
    mealsPerWeek?: number
    prioritizeSeasonal?: boolean
    minDishware?: boolean
  }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  const household = await getHousehold(householdId)
  if (!household) {
    throw new Error("Foyer non trouvé ou accès refusé")
  }

  const updated = await prisma.household.update({
    where: { id: householdId },
    data,
  })

  revalidatePath("/app/household")
  revalidatePath("/app/week")
  return updated
}

export async function updatePreference(
  householdId: string,
  key: string,
  value: string
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  const household = await getHousehold(householdId)
  if (!household) {
    throw new Error("Foyer non trouvé ou accès refusé")
  }

  const preference = await prisma.householdPreference.upsert({
    where: {
      householdId_key: {
        householdId,
        key,
      },
    },
    create: {
      householdId,
      key,
      value,
    },
    update: {
      value,
    },
  })

  revalidatePath("/app/household")
  revalidatePath("/app/week")
  return preference
}

export async function deletePreference(householdId: string, key: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  const household = await getHousehold(householdId)
  if (!household) {
    throw new Error("Foyer non trouvé ou accès refusé")
  }

  await prisma.householdPreference.delete({
    where: {
      householdId_key: {
        householdId,
        key,
      },
    },
  })

  revalidatePath("/app/household")
  revalidatePath("/app/week")
}
