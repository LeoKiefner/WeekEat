/**
 * Prompts IA pour WeekEat
 * Version 1.1 - "appétissant + faisable + cosy"
 *
 * Objectifs du changement
 * - Stopper les plans "légumes tristes" et recettes reloues
 * - Forcer des plats désirables (comfort + simples + rapides)
 * - Limiter les légumes imposés (1 à 2 max par repas)
 * - Limiter le nombre d'ingrédients (<= 10) et la complexité (<= 4 étapes)
 * - Supermarché standard, pas d'ingrédients rares
 * - One-pan / one-pot réel, pas juste un tag
 */

import { getWeekStart } from "@/lib/utils"

export interface MealGenerationContext {
  householdId: string
  bannedIngredients: string[]
  recentMeals: string[]
  preferences: {
    diet?: string[]
    allergies?: string[]
    objectives?: string[]
    timeConstraints?: string[]
  }
  meatFrequency?: number
  mealsPerWeek?: number
  prioritizeSeasonal: boolean
  minDishware: boolean
  constraints?: Array<{
    date: string
    type: string
    description?: string
  }>
}

export interface GeneratedMeal {
  name: string
  description?: string
  mealType: 'breakfast' | 'lunch' | 'dinner'
  date: string
  prepTime: number
  cookTime: number
  servings: number
  tags: string[]
  instructions: string
  dishwareTips: string
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    notes?: string
  }>
}

export interface GeneratedWeek {
  meals: GeneratedMeal[]
  seasonalIngredients: string[]
  dishwareScore: number
}

export function generateWeekPrompt(context: MealGenerationContext, weekStart?: Date): string {
  const startDate = weekStart || getWeekStart()
  startDate.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const actualStartDate = startDate < today ? today : startDate

  const dates: Array<{ date: string; dayLabel: string }> = []
  const weekEnd = new Date(startDate)
  weekEnd.setDate(startDate.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const currentDate = new Date(actualStartDate)
  while (currentDate <= weekEnd) {
    dates.push({
      date: currentDate.toISOString().split("T")[0],
      dayLabel: ""
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const currentMonth = new Date().getMonth() + 1
  const seasonalIngredients = getSeasonalIngredientsAlsace(currentMonth)

  const daysToGenerate = dates.length
  const targetMeals = daysToGenerate * 2

  // Préférences condensées
  const diet = context.preferences?.diet?.join(", ") || "aucune"
  const allergies = context.preferences?.allergies?.join(", ") || "aucune"
  const objectives = context.preferences?.objectives?.join(", ") || "aucun"
  const timeConstraints = context.preferences?.timeConstraints?.join(", ") || "aucune"

  // Contraintes calendrier
  const constraints = (context.constraints || [])
    .map(c => `${c.date}: ${c.type}${c.description ? ` (${c.description})` : ""}`)
    .join(" | ") || "aucune"

  return `
Tu es un chef pragmatique + meal-planner. Ton but est de proposer des repas "envie de les faire", simples, rapides, et réalistes pour un supermarché classique.

TÂCHE
Génère ${targetMeals} repas pour les dates suivantes (2 par jour: lunch + dinner). Ne génère pas pour les jours passés.

DATES (ISO)
${dates.map(d => d.date).join(", ")}

PROFIL FOYER
- Portions: ${context.mealsPerWeek ? 2 : 2} (servings = nombre de personnes du foyer, ici laisse "2" par défaut si tu ne sais pas)
- Régime: ${diet}
- Allergies: ${allergies}
- Objectifs: ${objectives}
- Contraintes temps: ${timeConstraints}
- Contraintes calendrier: ${constraints}

CONTRAINTES DURES (OBLIGATOIRES)
1) Ingrédients bannis: ${context.bannedIngredients.join(", ") || "aucun"}
   - Interdiction absolue: aucun repas ne doit contenir ces ingrédients.
2) Variété: ne pas proposer un repas déjà mangé dans les 30 derniers jours.
   - Déjà mangés (à éviter strictement): ${context.recentMeals.slice(0, 25).join(" | ") || "aucun"}
3) 1 lunch + 1 dinner par date, pour chaque date listée.
4) Simplicité:
   - 4 étapes max
   - 10 ingrédients max (hors sel, poivre, huile)
   - 1 ustensile principal max (poêle OU casserole OU plaque four)
5) Supermarché standard:
   - pas d’ingrédients rares
   - pas de techniques avancées
6) "Vaisselle minimale" = vrai:
   - fais des recettes réellement one-pan / one-pot
   - pas de bol de marinade séparé, pas de 3 casseroles
${context.meatFrequency !== undefined && context.preferences.diet?.includes("omnivore")
  ? `7) Viande: exactement ${context.meatFrequency} repas avec viande sur ${targetMeals} repas.`
  : ""}

RÈGLES POUR ÉVITER LES "REPAS TRISTES"
- Priorité à des plats désirables (comfort food) mais équilibrés.
- Légumes:
  - max 2 types de légumes par repas
  - privilégie les légumes faciles et appréciés (carotte, courgette, tomate, haricot vert, salade, concombre, poivron)
  - évite les légumes clivants et pénibles sauf demande explicite (endive, céleri, navet, chou bouilli, etc.)
- Le "saisonnier" est un bonus, pas une punition:
  - utilise au maximum 1 ingrédient de saison principal par repas
  - liste saison Alsace (suggestions, pas obligation): ${seasonalIngredients.join(", ")}

STYLE DE RECETTES (TRÈS IMPORTANT)
- Repas "mignons" et simples, qu’un couple a envie de refaire.
- Exemples de vibe: pâtes crémeuses, rice bowl, wok simple, wraps bowl (sans wrap si tu veux), curry doux, chili doux, gratin simple, salade gourmande, omelette gourmande, poisson au four + légumes simples, poulet au four + pommes de terre, gnocchis poêlés, etc.
- Interdit: recettes longues, "healthy punitive", listes d’ingrédients interminables.

FORMAT DE SORTIE
Retourne uniquement du JSON valide, sans texte autour.

SCHÉMA JSON
{
  "meals": [
    {
      "name": "string",
      "description": "string (<= 15 mots)",
      "mealType": "lunch" | "dinner",
      "date": "YYYY-MM-DD",
      "prepTime": number,
      "cookTime": number,
      "servings": number,
      "tags": ["one-pan", "comfort", "quick", "budget", ...],
      "instructions": ["Étape 1", "Étape 2", "Étape 3", "Étape 4"],
      "dishwareTips": "string (1 phrase)",
      "ingredients": [
        { "name": "string", "quantity": number, "unit": "g|ml|pcs|tbsp|tsp" , "notes": "string optionnel" }
      ]
    }
  ],
  "seasonalIngredients": ["string"],
  "dishwareScore": number
}

RAPPELS
- ingredients <= 10 (hors sel/poivre/huile)
- steps <= 4
- Chaque date a 1 lunch + 1 dinner
- Aucun ingrédient banni
- Aucun repas similaire aux récents (évite aussi les variantes proches: "pâtes bolo" vs "spaghetti bolognaise")
`.trim()
}

export function replaceMealPrompt(
  context: MealGenerationContext,
  dateToReplace: string,
  mealType: "lunch" | "dinner",
  reason?: string
): string {
  const banned = context.bannedIngredients.join(", ") || "aucun"
  const recent = context.recentMeals.slice(0, 20).join(" | ") || "aucun"
  const currentMonth = new Date(dateToReplace).getMonth() + 1
  const seasonalIngredients = getSeasonalIngredientsAlsace(currentMonth)

  return `
Tu remplaces un seul repas. Objectif: proposer un plat appétissant, simple, rapide, supermarché standard, vaisselle minimale.

À REMPLACER
- date: ${dateToReplace}
- mealType: ${mealType}
${reason ? `- raison: ${reason}` : ""}

CONTRAINTES DURES
- Ingrédients bannis: ${banned}
- Repas récents à éviter strictement: ${recent}
- 10 ingrédients max (hors sel/poivre/huile)
- 4 étapes max
- 1 ustensile principal max (poêle OU casserole OU plaque four)
- Légumes max: 2 types
- Saisonnier (bonus, 0 à 1 ingrédient principal): ${seasonalIngredients.join(", ")}

SORTIE
Uniquement JSON valide selon ce schéma:

{
  "meals": [{
    "name": "string",
    "description": "string (<= 15 mots)",
    "mealType": "${mealType}",
    "date": "${dateToReplace}",
    "prepTime": number,
    "cookTime": number,
    "servings": 2,
    "tags": ["one-pan", "comfort", "quick"],
    "instructions": ["Étape 1", "Étape 2", "Étape 3", "Étape 4"],
    "dishwareTips": "string",
    "ingredients": [{"name":"string","quantity":number,"unit":"g|ml|pcs|tbsp|tsp"}]
  }],
  "seasonalIngredients": ["string"],
  "dishwareScore": number
}
`.trim()
}

export function alternativeWithoutIngredientPrompt(
  context: MealGenerationContext,
  originalMealName: string,
  ingredientToExclude: string,
  date: string,
  mealType: "lunch" | "dinner"
): string {
  const banned = [...context.bannedIngredients, ingredientToExclude].filter(Boolean)
  const recent = context.recentMeals.slice(0, 20).join(" | ") || "aucun"
  const currentMonth = new Date(date).getMonth() + 1
  const seasonalIngredients = getSeasonalIngredientsAlsace(currentMonth)

  return `
Tu proposes une alternative à "${originalMealName}" mais SANS "${ingredientToExclude}".

CONTRAINTES DURES
- Ingrédients interdits: ${banned.join(", ")}
- Repas récents à éviter strictement: ${recent}
- Date: ${date}
- mealType: ${mealType}
- 10 ingrédients max (hors sel/poivre/huile)
- 4 étapes max
- 1 ustensile principal max
- Légumes max: 2 types
- Saisonnier (bonus, 0 à 1 ingrédient principal): ${seasonalIngredients.join(", ")}

STYLE
- Reste dans une vibe proche (comfort, gourmand) sans être une variante déguisée.
- Supermarché standard.

SORTIE
Uniquement JSON valide:

{
  "meals": [{
    "name": "string",
    "description": "string (<= 15 mots)",
    "mealType": "${mealType}",
    "date": "${date}",
    "prepTime": number,
    "cookTime": number,
    "servings": 2,
    "tags": ["one-pan", "comfort", "quick"],
    "instructions": ["Étape 1", "Étape 2", "Étape 3", "Étape 4"],
    "dishwareTips": "string",
    "ingredients": [{"name":"string","quantity":number,"unit":"g|ml|pcs|tbsp|tsp"}]
  }],
  "seasonalIngredients": ["string"],
  "dishwareScore": number
}
`.trim()
}

export function extractIngredientsPrompt(recipeText: string): string {
  return `
Tu extrais une liste d’ingrédients NORMALISÉE avec quantités et unités.
Objectif: supermarché standard, unités cohérentes, pas de doublons.

RÈGLES
- Regrouper les synonymes (ex: "tomates" et "tomate" => "tomate")
- Unités: g, ml, pcs, tbsp, tsp
- Si quantité absente: mettre quantity: 1 et unit: "pcs" (ou estimer raisonnablement)
- Retourner uniquement du JSON valide

TEXTE RECETTE
${recipeText}

JSON
{
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "g|ml|pcs|tbsp|tsp", "notes": "string optionnel" }
  ]
}
`.trim()
}

/**
 * Fruits et légumes de saison en Alsace (MVP)
 * Remarque produit: ce tableau sert de "suggestion" et non d’obligation.
 */
function getSeasonalIngredientsAlsace(month: number): string[] {
  const seasonal: Record<number, string[]> = {
    1: ["carotte", "poireau", "pomme de terre", "courge", "pomme"],
    2: ["carotte", "poireau", "pomme de terre", "pomme"],
    3: ["épinard", "radis", "carotte", "poireau"],
    4: ["asperge", "laitue", "radis", "épinard"],
    5: ["asperge", "concombre", "fraises", "laitue", "petits pois"],
    6: ["courgette", "tomate", "concombre", "cerises", "haricot vert"],
    7: ["courgette", "tomate", "haricot vert", "abricot", "pêche"],
    8: ["courgette", "tomate", "haricot vert", "prune", "pêche"],
    9: ["tomate", "haricot vert", "pomme", "poire", "raisin"],
    10: ["courge", "carotte", "poireau", "pomme", "raisin"],
    11: ["carotte", "poireau", "pomme de terre", "pomme"],
    12: ["carotte", "poireau", "pomme de terre", "courge"],
  }
  return seasonal[month] || []
}
