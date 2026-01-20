/**
 * Prompts IA pour la génération de repas
 * Version 1.0 - MVP
 */

import { getWeekStart } from "@/lib/utils"

export interface MealGenerationContext {
  householdId: string
  bannedIngredients: string[]
  recentMeals: string[] // Noms des repas des 30 derniers jours
  preferences: {
    diet?: string[]
    allergies?: string[]
    objectives?: string[]
    timeConstraints?: string[]
  }
  meatFrequency?: number // Nombre de repas avec viande par semaine (0-14, seulement si omnivore)
  mealsPerWeek: number
  prioritizeSeasonal: boolean
  minDishware: boolean
  constraints?: Array<{
    date: string
    type: 'no_meal' | 'meal_prep' | 'restaurant' | 'batch_cook'
    description?: string
  }>
}

export interface GeneratedMeal {
  name: string
  description?: string // Optionnel (valeur par défaut: "")
  mealType: 'breakfast' | 'lunch' | 'dinner'
  date: string // ISO date
  prepTime: number // minutes
  cookTime: number // minutes
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
  dishwareScore: number // 1-10, 10 = minimum vaisselle
}

/**
 * Prompt principal : générer une semaine complète de repas
 */
export function generateWeekPrompt(context: MealGenerationContext, weekStart?: Date): string {
  // Utiliser la date de début de semaine fournie ou calculer à partir d'aujourd'hui
  const startDate = weekStart || getWeekStart()
  startDate.setHours(0, 0, 0, 0)
  
  // Ne générer que les dates à partir d'aujourd'hui (pas les jours passés)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const actualStartDate = startDate < today ? today : startDate
  
  // Générer les dates pour les 7 jours de la semaine, mais seulement à partir d'aujourd'hui
  const dates: Array<{ date: string; dayLabel: string }> = []
  const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  const weekEnd = new Date(startDate)
  weekEnd.setDate(startDate.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  
  // Générer les dates uniquement à partir d'aujourd'hui jusqu'à la fin de la semaine
  const currentDate = new Date(actualStartDate)
  let dayIndex = Math.floor((actualStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  while (currentDate <= weekEnd) {
    dates.push({
      date: currentDate.toISOString().split("T")[0],
      dayLabel: dayNames[dayIndex % 7] || `J+${dayIndex}`
    })
    currentDate.setDate(currentDate.getDate() + 1)
    dayIndex++
  }

  const currentMonth = new Date().getMonth() + 1
  const seasonalIngredients = getSeasonalIngredientsAlsace(currentMonth)

  // Calculer le nombre de repas à générer : 2 par jour (lunch et dinner) pour les jours restants
  const daysToGenerate = dates.length
  const targetMeals = daysToGenerate * 2 // 2 repas par jour (lunch et dinner)

  return `Génère ${targetMeals} repas pour les ${daysToGenerate} prochains jours (2 par jour: lunch et dinner). Ne génère PAS pour les jours passés.

DATES: ${dates.map(d => `${d.date}`).join(', ')}

CONTRAINTES:
- Bannis: ${context.bannedIngredients.join(', ') || 'aucun'}
- Déjà mangés: ${context.recentMeals.slice(0, 8).join(', ') || 'aucun'}
- Saison: ${seasonalIngredients.slice(0, 6).join(', ')}
- Vaisselle minimale: one-pan prioritaire${context.meatFrequency !== undefined && context.preferences.diet?.includes('omnivore') ? `\n- Viande: ${context.meatFrequency} repas avec viande par semaine (sur ${targetMeals} repas total)` : ''}

RÈGLES IMPORTANTES:
- mealType: uniquement "lunch" ou "dinner" (pas de breakfast)
- Répartition: 1 lunch et 1 dinner par jour pour chaque date
- Dates: ${dates[0].date} (lundi) → ${dates[dates.length - 1].date} (dimanche)
- Instructions: max 4 étapes courtes, format tableau
- Description: max 15 mots
- Sois CONCIS pour économiser les tokens

JSON:
{
  "meals": [
    {
      "name": "Nom",
      "description": "Courte description",
      "mealType": "lunch",
      "date": "${dates[0].date}",
      "prepTime": 15,
      "cookTime": 30,
      "servings": 2,
      "tags": ["one-pan"],
      "instructions": ["Étape 1", "Étape 2"],
      "dishwareTips": "Astuce courte",
      "ingredients": [{"name": "Ingrédient", "quantity": 500, "unit": "g"}]
    }
  ],
  "seasonalIngredients": ["chou"],
  "dishwareScore": 9
}`
}

/**
 * Prompt pour remplacer un seul repas
 */
export function replaceMealPrompt(
  context: MealGenerationContext,
  dateToReplace: string,
  mealType: string,
  reason?: string
): string {
  return `Remplace le repas ${mealType} du ${dateToReplace}${reason ? ` (${reason})` : ''}.

CONTRAINTES:
- Bannis: ${context.bannedIngredients.slice(0, 5).join(', ') || 'aucun'}
- Déjà mangés: ${context.recentMeals.slice(0, 5).join(', ') || 'aucun'}
- Vaisselle minimale

RÈGLES:
- description: REQUIS, 15 mots max
- instructions: 4 étapes max, format tableau
- Sois CONCIS

JSON (un seul repas):
{
  "meals": [{
    "name": "...",
    "description": "Courte description (15 mots max)",
    "mealType": "${mealType}",
    "date": "${dateToReplace}",
    "prepTime": 15,
    "cookTime": 30,
    "servings": 2,
    "tags": ["one-pan"],
    "instructions": ["Étape 1", "Étape 2"],
    "dishwareTips": "...",
    "ingredients": [{"name": "...", "quantity": 500, "unit": "g"}]
  }],
  "seasonalIngredients": [],
  "dishwareScore": 8
}`
}

/**
 * Prompt pour proposer alternative sans ingrédient X
 */
export function alternativeWithoutIngredientPrompt(
  context: MealGenerationContext,
  originalMealName: string,
  ingredientToExclude: string,
  date: string,
  mealType: string
): string {
  return `Alternative à "${originalMealName}" SANS "${ingredientToExclude}" (${mealType}, ${date}).

CONTRAINTES:
- Bannis: ${context.bannedIngredients.slice(0, 5).join(', ') || 'aucun'}
- Déjà mangés: ${context.recentMeals.slice(0, 3).join(', ') || 'aucun'}
- Style similaire si possible
- Vaisselle minimale

JSON (un seul repas):
{
  "meals": [{
    "name": "...",
    "mealType": "${mealType}",
    "date": "${date}",
    "prepTime": 15,
    "cookTime": 30,
    "servings": 2,
    "tags": ["one-pan"],
    "instructions": ["Étape 1", "Étape 2"],
    "dishwareTips": "...",
    "ingredients": [{"name": "...", "quantity": 500, "unit": "g"}]
  }],
  "seasonalIngredients": [],
  "dishwareScore": 8
}`
}

/**
 * Prompt pour extraire/standardiser liste d'ingrédients
 */
export function extractIngredientsPrompt(recipeText: string): string {
  return `Extrais ingrédients + quantités:

${recipeText}

JSON:
{
  "ingredients": [{"name": "...", "quantity": 500, "unit": "g"}]
}`
}

/**
 * Fruits et légumes de saison en Alsace (simplifié pour MVP)
 */
function getSeasonalIngredientsAlsace(month: number): string[] {
  const seasonal: Record<number, string[]> = {
    1: ['chou', 'carotte', 'céleri', 'endive', 'poireau', 'pomme de terre', 'potiron'],
    2: ['chou', 'carotte', 'céleri', 'endive', 'poireau', 'pomme de terre'],
    3: ['asperge', 'carotte', 'céleri', 'épinard', 'poireau', 'radis'],
    4: ['asperge', 'carotte', 'épinard', 'laitue', 'radis', 'petits pois'],
    5: ['asperge', 'concombre', 'épinard', 'laitue', 'radis', 'fraises', 'petits pois'],
    6: ['concombre', 'courgette', 'laitue', 'tomate', 'fraises', 'cerises', 'petits pois'],
    7: ['courgette', 'aubergine', 'tomate', 'haricot vert', 'cerises', 'pêches', 'abricots'],
    8: ['courgette', 'aubergine', 'tomate', 'haricot vert', 'pêches', 'abricots', 'prunes'],
    9: ['courgette', 'aubergine', 'tomate', 'haricot vert', 'pomme', 'poire', 'raisin'],
    10: ['chou', 'carotte', 'courge', 'poireau', 'pomme', 'poire', 'raisin'],
    11: ['chou', 'carotte', 'courge', 'endive', 'poireau', 'pomme', 'pomme de terre'],
    12: ['chou', 'carotte', 'céleri', 'endive', 'poireau', 'pomme de terre', 'potiron'],
  }
  return seasonal[month] || []
}
