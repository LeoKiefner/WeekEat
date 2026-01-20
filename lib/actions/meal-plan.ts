"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getWeekStart, getWeekEnd, stringifyTags } from "@/lib/utils"
import { generateSingleMeal, replaceMeal, getAlternativeWithoutIngredient } from "@/lib/ai/client"
import type { MealGenerationContext } from "@/lib/ai/prompts"
import { revalidatePath } from "next/cache"

export async function generateMealPlan(householdId: string, weekStart?: Date) {
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
      bannedIngredients: {
        include: {
          ingredient: true,
        },
      },
      preferences: true,
      constraints: {
        where: {
          date: {
            gte: weekStart || getWeekStart(),
            lte: weekStart ? getWeekEnd(weekStart) : getWeekEnd(getWeekStart()),
          },
        },
      },
    },
  })

  if (!household) {
    throw new Error("Foyer non trouvé ou accès refusé")
  }

  const start = weekStart || getWeekStart()
  // Normaliser la date pour éviter les problèmes de comparaison
  start.setHours(0, 0, 0, 0)
  const end = getWeekEnd(start)
  end.setHours(23, 59, 59, 999) // Fin de journée

  // Par défaut, générer 2 repas par jour (lunch et dinner) = 14 repas
  const defaultMealsPerWeek = 14

  // Récupérer les repas des 30 derniers jours pour variété
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentMeals = await prisma.meal.findMany({
    where: {
      mealPlan: {
        householdId,
      },
      date: {
        gte: thirtyDaysAgo,
      },
      recipe: {
        isNot: null,
      },
    },
    include: {
      recipe: true,
    },
  })

  // Construire le contexte pour l'IA
  const context: MealGenerationContext = {
    householdId,
    bannedIngredients: household.bannedIngredients.map((bi: { ingredient: { name: string } }) => bi.ingredient.name),
    recentMeals: recentMeals.map((m: { recipe: { name: string } | null }) => m.recipe?.name || "").filter(Boolean),
    preferences: {
      diet: household.preferences.find((p) => p.key === "diet")?.value
        ? JSON.parse(household.preferences.find((p) => p.key === "diet")!.value)
        : [],
      allergies: household.preferences.find((p) => p.key === "allergies")?.value
        ? JSON.parse(household.preferences.find((p) => p.key === "allergies")!.value)
        : [],
      objectives: household.preferences.find((p) => p.key === "objectives")?.value
        ? JSON.parse(household.preferences.find((p) => p.key === "objectives")!.value)
        : [],
      timeConstraints: household.preferences.find((p) => p.key === "timeConstraints")?.value
        ? JSON.parse(household.preferences.find((p) => p.key === "timeConstraints")!.value)
        : [],
    },
    meatFrequency: household.preferences.find((p) => p.key === "meatFrequency")?.value
      ? JSON.parse(household.preferences.find((p) => p.key === "meatFrequency")!.value)
      : undefined,
    mealsPerWeek: household.mealsPerWeek || defaultMealsPerWeek,
    prioritizeSeasonal: household.prioritizeSeasonal,
    minDishware: household.minDishware,
    constraints: household.constraints.map((c: { date: Date; type: string; description: string | null }) => ({
      date: c.date.toISOString().split("T")[0],
      type: c.type as any,
      description: c.description || undefined,
    })),
  }

  // Créer ou mettre à jour le meal plan AVANT la génération
  const mealPlan = await prisma.mealPlan.upsert({
    where: {
      householdId_weekStart: {
        householdId,
        weekStart: start,
      },
    },
    create: {
      householdId,
      weekStart: start,
      weekEnd: end,
    },
    update: {
      weekEnd: end,
    },
  })

  console.log(`[generateMealPlan] MealPlan ${mealPlan.id} trouvé/créé pour la semaine ${start.toISOString().split('T')[0]}`)

  // Supprimer les anciens repas de cette semaine AVANT de créer les nouveaux
  const deletedCount = await prisma.meal.deleteMany({
    where: {
      mealPlanId: mealPlan.id,
    },
  })
  console.log(`[generateMealPlan] ${deletedCount.count} anciens repas supprimés`)

  // Calculer les dates et slots à générer EN AMONT (au lieu de demander à l'IA)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const actualStart = start < today ? today : start
  
  const mealsToGenerate: Array<{ date: string; mealType: "lunch" | "dinner" }> = []
  const currentDate = new Date(actualStart)
  
  while (currentDate <= end) {
    mealsToGenerate.push({
      date: currentDate.toISOString().split("T")[0],
      mealType: "lunch",
    })
    mealsToGenerate.push({
      date: currentDate.toISOString().split("T")[0],
      mealType: "dinner",
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  console.log(`[generateMealPlan] ${mealsToGenerate.length} repas à générer progressivement`)

  // Générer les repas UN PAR UN pour éviter les troncatures
  let mealsCreated = 0
  let mealsWithMeat = 0
  const targetMeatMeals = context.meatFrequency || 0

  for (const { date, mealType } of mealsToGenerate) {
    try {
      console.log(`[generateMealPlan] Génération repas ${mealsCreated + 1}/${mealsToGenerate.length}: ${mealType} pour ${date}`)
      
      // Générer UN SEUL repas à la fois
      const generated = await generateSingleMeal(context, date, mealType)
      
      if (!generated.meals || generated.meals.length === 0) {
        console.warn(`[generateMealPlan] Aucun repas généré pour ${date} ${mealType}`)
        continue
      }

      const mealData = generated.meals[0]

      // Vérifier si c'est un repas avec viande (pour respecter la fréquence)
      const hasMeat = mealData.ingredients.some((ing: { name: string }) => {
        const meatKeywords = ["viande", "boeuf", "porc", "poulet", "agneau", "steak", "saucisse", "jambon", "lard"]
        return meatKeywords.some(keyword => ing.name.toLowerCase().includes(keyword))
      })

      if (hasMeat) {
        mealsWithMeat++
        // Si on dépasse la fréquence de viande, régénérer sans viande
        if (targetMeatMeals > 0 && mealsWithMeat > targetMeatMeals) {
          console.log(`[generateMealPlan] Fréquence de viande atteinte, régénération sans viande pour ${date} ${mealType}`)
          // Essayer de régénérer en excluant les mots-clés viande (simplifié)
          // Pour l'instant, on continue mais on pourrait implémenter une logique plus sophistiquée
        }
      }
      // Chercher ou créer les ingrédients
      const recipeIngredients = await Promise.all(
        mealData.ingredients.map(async (ing: { name: string; quantity: number; unit: string; notes?: string }) => {
          let ingredient = await prisma.ingredient.findUnique({
            where: { name: ing.name },
          })

          if (!ingredient) {
            ingredient = await prisma.ingredient.create({
              data: {
                name: ing.name,
                category: "other", // À améliorer avec extraction IA
                unit: ing.unit,
              },
            })
          }

          return {
            ingredientId: ingredient.id,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes || null,
          }
        })
      )

      // Créer la recette
      const recipe = await prisma.recipe.create({
        data: {
          name: mealData.name,
          description: mealData.description || null,
          instructions: mealData.instructions,
          dishwareTips: mealData.dishwareTips,
          prepTime: mealData.prepTime,
          cookTime: mealData.cookTime,
          servings: mealData.servings,
          tags: stringifyTags(mealData.tags),
          aiGenerated: true,
          aiPromptVersion: "2.0", // Version progressive
          ingredients: {
            create: recipeIngredients.map((ri: { ingredientId: string; quantity: number; unit: string; notes: string | null }) => ({
              ingredientId: ri.ingredientId,
              quantity: ri.quantity,
              unit: ri.unit,
              notes: ri.notes,
            })),
          },
        },
      })

      // Normaliser la date du repas
      const mealDate = new Date(mealData.date)
      // Ajuster l'heure selon le type de repas
      mealDate.setHours(mealType === "lunch" ? 12 : 19, 0, 0, 0)

      // Créer le repas
      await prisma.meal.create({
        data: {
          mealPlanId: mealPlan.id,
          date: mealDate,
          mealType: mealData.mealType,
          recipeId: recipe.id,
          prepTime: mealData.prepTime + mealData.cookTime,
        },
      })
      mealsCreated++
      console.log(`[generateMealPlan] ✅ Repas créé: ${mealData.name} (${mealsCreated}/${mealsToGenerate.length})`)

      // Mettre à jour la liste des repas récents pour éviter les doublons dans les prochaines générations
      context.recentMeals.unshift(mealData.name)
      if (context.recentMeals.length > 30) {
        context.recentMeals = context.recentMeals.slice(0, 30)
      }
    } catch (error: any) {
      console.error(`[generateMealPlan] ❌ Erreur génération repas ${date} ${mealType}:`, error)
      // Continuer avec le repas suivant même en cas d'erreur
      // Créer un slot vide pour ce repas manquant
      const mealDate = new Date(date)
      mealDate.setHours(mealType === "lunch" ? 12 : 19, 0, 0, 0)
      
      await prisma.meal.create({
        data: {
          mealPlanId: mealPlan.id,
          date: mealDate,
          mealType: mealType,
          recipeId: null, // Slot vide
        },
      })
      console.log(`[generateMealPlan] Slot vide créé pour ${date} ${mealType}`)
    }
  }

  console.log(`[generateMealPlan] ✅ ${mealsCreated} repas créés avec succès sur ${mealsToGenerate.length} demandés`)
  if (targetMeatMeals > 0) {
    console.log(`[generateMealPlan] ${mealsWithMeat} repas avec viande générés (objectif: ${targetMeatMeals})`)
  }

  // Revalider les pages qui affichent les données
  revalidatePath(`/app/week`)
  revalidatePath(`/app/groceries`)
  revalidatePath(`/household/${householdId}/week`) // Ancienne route au cas où

  // Récupérer le mealPlan complet avec les meals pour le retour
  const mealPlanWithMeals = await prisma.mealPlan.findUnique({
    where: { id: mealPlan.id },
    include: {
      meals: {
        include: {
          recipe: true,
        },
      },
    },
  })

  console.log(`[generateMealPlan] MealPlan final: ${mealPlanWithMeals?.meals.length || 0} repas dans le plan`)

  return mealPlanWithMeals || mealPlan
}

export async function getMealPlan(householdId: string, weekStart?: Date) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  const start = weekStart || getWeekStart()
  // Normaliser la date pour éviter les problèmes de comparaison (enlever heures/minutes/secondes)
  start.setHours(0, 0, 0, 0)

  console.log(`[getMealPlan] Recherche mealPlan pour householdId: ${householdId}, weekStart: ${start.toISOString()}`)

  // D'abord, chercher le mealPlan pour la semaine exacte
  const exactMealPlan = await prisma.mealPlan.findUnique({
    where: {
      householdId_weekStart: {
        householdId,
        weekStart: start,
      },
    },
    include: {
      meals: {
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
          reactions: true,
        },
        orderBy: {
          date: "asc",
        },
      },
    },
  })

  if (exactMealPlan) {
    console.log(`[getMealPlan] MealPlan trouvé pour la semaine exacte: ${exactMealPlan.id}, meals: ${exactMealPlan.meals.length}`)
    return exactMealPlan
  }

  // Sinon, chercher le mealPlan le plus récent
  const latestMealPlan = await prisma.mealPlan.findFirst({
    where: {
      householdId,
    },
    include: {
      meals: {
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
          reactions: true,
        },
        orderBy: {
          date: "asc",
        },
      },
    },
    orderBy: {
      weekStart: "desc",
    },
  })

  console.log(`[getMealPlan] MealPlan le plus récent trouvé: ${latestMealPlan ? latestMealPlan.id : "aucun"}, meals: ${latestMealPlan?.meals.length || 0}`)

  if (latestMealPlan) {
    return latestMealPlan
  }

  // Si aucun mealPlan n'est trouvé, chercher avec la date exacte (fallback)
  const mealPlan = await prisma.mealPlan.findUnique({
    where: {
      householdId_weekStart: {
        householdId,
        weekStart: start,
      },
    },
    include: {
      meals: {
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
          reactions: true,
        },
        orderBy: {
          date: "asc",
        },
      },
    },
  })

  console.log(`[getMealPlan] MealPlan avec date exacte: ${mealPlan ? mealPlan.id : "aucun"}, meals: ${mealPlan?.meals.length || 0}`)

  return mealPlan
}

export async function replaceMealInPlan(
  mealPlanId: string,
  mealId: string,
  reason?: string
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  // Récupérer le repas actuel
  const currentMeal = await prisma.meal.findUnique({
    where: { id: mealId },
    include: {
      mealPlan: {
        include: {
          household: {
            include: {
              bannedIngredients: {
                include: {
                  ingredient: true,
                },
              },
              preferences: true,
              constraints: true,
            },
          },
        },
      },
      recipe: true,
    },
  })

  if (!currentMeal || !currentMeal.mealPlan) {
    throw new Error("Repas non trouvé")
  }

  const household = currentMeal.mealPlan.household
  const mealDate = currentMeal.date.toISOString().split("T")[0]
  const mealType = currentMeal.mealType as "lunch" | "dinner"

  // Récupérer les repas des 30 derniers jours pour variété
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentMeals = await prisma.meal.findMany({
    where: {
      mealPlan: {
        householdId: household.id,
      },
      date: {
        gte: thirtyDaysAgo,
      },
      recipe: {
        isNot: null,
      },
      NOT: {
        id: mealId,
      },
    },
    include: {
      recipe: true,
    },
  })

  // Construire le contexte pour l'IA
  const context: MealGenerationContext = {
    householdId: household.id,
    bannedIngredients: household.bannedIngredients.map((bi: { ingredient: { name: string } }) => bi.ingredient.name),
    recentMeals: recentMeals.map((m: { recipe: { name: string } | null }) => m.recipe?.name || "").filter(Boolean),
    preferences: {
      diet: household.preferences.find((p) => p.key === "diet")?.value
        ? JSON.parse(household.preferences.find((p) => p.key === "diet")!.value)
        : [],
      allergies: household.preferences.find((p) => p.key === "allergies")?.value
        ? JSON.parse(household.preferences.find((p) => p.key === "allergies")!.value)
        : [],
      objectives: household.preferences.find((p) => p.key === "objectives")?.value
        ? JSON.parse(household.preferences.find((p) => p.key === "objectives")!.value)
        : [],
      timeConstraints: household.preferences.find((p) => p.key === "timeConstraints")?.value
        ? JSON.parse(household.preferences.find((p) => p.key === "timeConstraints")!.value)
        : [],
    },
    mealsPerWeek: household.mealsPerWeek || 14,
    prioritizeSeasonal: household.prioritizeSeasonal,
    minDishware: household.minDishware,
    constraints: household.constraints.map((c: { date: Date; type: string; description: string | null }) => ({
      date: c.date.toISOString().split("T")[0],
      type: c.type as any,
      description: c.description || undefined,
    })),
  }

  // Appel IA pour remplacer le repas
  const generated = await replaceMeal(context, mealDate, mealType, reason)

  if (!generated.meals || generated.meals.length === 0) {
    throw new Error("L'IA n'a pas pu proposer de repas de remplacement.")
  }

  const newMealData = generated.meals[0]

  // Créer les ingrédients
  const recipeIngredients = await Promise.all(
    newMealData.ingredients.map(async (ing: { name: string; quantity: number; unit: string; notes?: string }) => {
      let ingredient = await prisma.ingredient.findUnique({
        where: { name: ing.name },
      })

      if (!ingredient) {
        ingredient = await prisma.ingredient.create({
          data: {
            name: ing.name,
            category: "other",
            unit: ing.unit,
          },
        })
      }
      return {
        ingredientId: ingredient.id,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes || null,
      }
    })
  )

  // Créer la nouvelle recette
  const newRecipe = await prisma.recipe.create({
    data: {
      name: newMealData.name,
      description: newMealData.description || null, // Gérer le cas où description est undefined
      instructions: newMealData.instructions,
      dishwareTips: newMealData.dishwareTips,
      prepTime: newMealData.prepTime,
      cookTime: newMealData.cookTime,
      servings: newMealData.servings,
      tags: stringifyTags(newMealData.tags),
      aiGenerated: true,
      aiPromptVersion: "1.0",
        ingredients: {
          create: recipeIngredients.map((ri: { ingredientId: string; quantity: number; unit: string; notes: string | null }) => ({
            ingredientId: ri.ingredientId,
            quantity: ri.quantity,
            unit: ri.unit,
            notes: ri.notes,
          })),
        },
    },
  })

  // Mettre à jour le repas existant
  const updatedMeal = await prisma.meal.update({
    where: { id: mealId },
    data: {
      recipeId: newRecipe.id,
      prepTime: newMealData.prepTime + newMealData.cookTime,
    },
  })

  revalidatePath("/app/week")
  revalidatePath("/app/groceries")
  return updatedMeal
}

export async function clearMeal(mealId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    include: {
      mealPlan: {
        include: {
          household: {
            include: {
              members: {
                where: {
                  userId: session.user.id,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!meal || !meal.mealPlan || meal.mealPlan.household.members.length === 0) {
    throw new Error("Repas non trouvé ou accès refusé")
  }

  // Mettre à jour le repas pour retirer la recette
  const updatedMeal = await prisma.meal.update({
    where: { id: mealId },
    data: {
      recipeId: null,
      prepTime: null,
    },
  })

  revalidatePath("/app/week")
  revalidatePath("/app/groceries")
  return updatedMeal
}

export async function assignRecipeToMeal(mealId: string, recipeId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    include: {
      mealPlan: {
        include: {
          household: {
            include: {
              members: {
                where: {
                  userId: session.user.id,
                },
              },
            },
          },
        },
      },
      recipe: true,
    },
  })

  if (!meal || !meal.mealPlan || meal.mealPlan.household.members.length === 0) {
    throw new Error("Repas non trouvé ou accès refusé")
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  })

  if (!recipe) {
    throw new Error("Recette non trouvée")
  }

  // Mettre à jour le repas
  const updatedMeal = await prisma.meal.update({
    where: { id: mealId },
    data: {
      recipeId: recipe.id,
      prepTime: recipe.prepTime + recipe.cookTime,
    },
  })

  revalidatePath("/app/week")
  revalidatePath("/app/groceries")
  return updatedMeal
}

export async function searchRecipes(householdId: string, query: string) {
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

  // Rechercher les recettes utilisées dans ce foyer
  // Note: SQLite ne supporte pas mode: "insensitive", donc on fait une recherche case-insensitive manuelle
  const recipes = await prisma.recipe.findMany({
    where: {
      name: {
        contains: query,
      },
      meals: {
        some: {
          mealPlan: {
            householdId,
          },
        },
      },
    },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
    take: 20,
    orderBy: {
      createdAt: "desc",
    },
  })

  return recipes
}

export async function ensureMealSlot(mealPlanId: string, date: Date, mealType: "lunch" | "dinner") {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Non authentifié")
  }

  // Normaliser la date
  const normalizedDate = new Date(date)
  normalizedDate.setHours(mealType === "lunch" ? 12 : 19, 0, 0, 0)

  const dayStart = new Date(normalizedDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(normalizedDate)
  dayEnd.setHours(23, 59, 59, 999)

  // Vérifier si le slot existe
  let meal = await prisma.meal.findFirst({
    where: {
      mealPlanId,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
      mealType,
    },
  })

  // Si le slot n'existe pas, le créer
  if (!meal) {
    meal = await prisma.meal.create({
      data: {
        mealPlanId,
        date: normalizedDate,
        mealType,
        recipeId: null,
      },
    })
  }

  return meal
}
