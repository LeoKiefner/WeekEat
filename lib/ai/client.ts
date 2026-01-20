import OpenAI from 'openai'
import { generateWeekPrompt, replaceMealPrompt, alternativeWithoutIngredientPrompt, extractIngredientsPrompt, type GeneratedWeek } from './prompts'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Schémas de validation JSON
const IngredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  notes: z.string().optional(),
})

const GeneratedMealSchema = z.object({
  name: z.string(),
  description: z.string().optional().default(""), // Rendre optionnel avec valeur par défaut
  // Accepter dessert mais le transformer en dinner (dessert = repas du soir avec dessert)
  mealType: z.preprocess((val) => {
    // Transformer dessert en dinner avant validation
    if (val === 'dessert') return 'dinner'
    return val
  }, z.enum(['breakfast', 'lunch', 'dinner'])),
  date: z.string(),
  prepTime: z.number(),
  cookTime: z.number(),
  servings: z.number(),
  tags: z.array(z.string()),
  // Accepter soit un tableau (préféré) soit une string (rétrocompatibilité)
  instructions: z.union([z.array(z.string()), z.string()]).transform((val) => {
    // Convertir le tableau en string formatée numérotée
    if (Array.isArray(val)) {
      return val.map((step, index) => `${index + 1}. ${step}`).join('\n')
    }
    return val
  }),
  dishwareTips: z.string(),
  ingredients: z.array(IngredientSchema),
})

const GeneratedWeekSchema = z.object({
  meals: z.array(GeneratedMealSchema),
  seasonalIngredients: z.array(z.string()),
  dishwareScore: z.number().min(1).max(10),
})

/**
 * Parse et valide la réponse JSON de l'IA
 */
async function parseAIResponse<T>(response: string, schema: z.ZodSchema<T>): Promise<T> {
  // Nettoyer la réponse (enlever markdown code blocks si présents)
  let cleaned = response.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/, '').replace(/```\n?$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/, '').replace(/```\n?$/, '')
  }
  
  // Vérifier si le JSON semble incomplet (pas de fermeture)
  const openBraces = (cleaned.match(/\{/g) || []).length
  const closeBraces = (cleaned.match(/\}/g) || []).length
  const openBrackets = (cleaned.match(/\[/g) || []).length
  const closeBrackets = (cleaned.match(/\]/g) || []).length
  
  if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
    console.error('⚠️ JSON semble incomplet (braces:', openBraces, 'vs', closeBraces, ', brackets:', openBrackets, 'vs', closeBrackets, ')')
    console.error('Réponse brute (premiers 500 chars):', cleaned.substring(0, 500))
    console.error('Réponse brute (derniers 500 chars):', cleaned.substring(Math.max(0, cleaned.length - 500)))
    throw new Error('Réponse IA incomplète (JSON tronqué). Veuillez réessayer.')
  }
  
  try {
    const parsed = JSON.parse(cleaned)
    return schema.parse(parsed)
  } catch (error) {
    console.error('Erreur parsing JSON:', error)
    console.error('Réponse brute (premiers 1000 chars):', cleaned.substring(0, 1000))
    console.error('Réponse brute (derniers 1000 chars):', cleaned.substring(Math.max(0, cleaned.length - 1000)))
    throw new Error('Réponse IA invalide: JSON mal formé ou schéma non respecté')
  }
}

/**
 * Génère une semaine complète de repas
 */
export async function generateWeekMeals(
  context: Parameters<typeof generateWeekPrompt>[0],
  weekStart?: Date
): Promise<GeneratedWeek> {
  const prompt = generateWeekPrompt(context, weekStart)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Utiliser mini pour MVP, peut être upgradé
    messages: [
      {
        role: 'system',
        content: 'Expert cuisine française. Réponds UNIQUEMENT en JSON valide, sans texte avant/après. Sois concis dans les descriptions et instructions.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
    max_tokens: 4000, // Augmenté pour éviter les troncatures
  })

  const response = completion.choices[0]?.message?.content
  const finishReason = completion.choices[0]?.finish_reason

  if (!response) {
    throw new Error('Aucune réponse de l\'IA')
  }

  // Vérifier si la réponse a été tronquée
  if (finishReason === 'length') {
    console.warn('⚠️ Réponse IA tronquée (max_tokens atteint). Tentative de récupération partielle...')
    // Essayer de récupérer ce qui peut être parsé
    try {
      // Chercher le dernier repas complet dans le JSON
      const lastMealEnd = response.lastIndexOf('}')
      if (lastMealEnd > 0) {
        // Essayer de fermer le JSON manuellement
        let fixedResponse = response.substring(0, lastMealEnd + 1)
        // Chercher où commence le tableau meals
        const mealsStart = fixedResponse.indexOf('"meals":[')
        if (mealsStart > 0) {
          // Fermer le tableau meals et l'objet principal
          fixedResponse = fixedResponse.substring(0, fixedResponse.lastIndexOf('}'))
          fixedResponse += '], "seasonalIngredients": [], "dishwareScore": 5}'
          console.warn('⚠️ Tentative de réparation du JSON tronqué')
          return parseAIResponse(fixedResponse, GeneratedWeekSchema) as unknown as GeneratedWeek
        }
      }
    } catch (e) {
      console.error('Impossible de réparer le JSON tronqué:', e)
    }
    throw new Error('Réponse IA tronquée. Veuillez réessayer ou réduire le nombre de repas.')
  }

  return parseAIResponse(response, GeneratedWeekSchema) as unknown as GeneratedWeek
}

/**
 * Remplace un seul repas
 */
export async function replaceMeal(
  context: Parameters<typeof generateWeekPrompt>[0],
  dateToReplace: string,
  mealType: "lunch" | "dinner",
  reason?: string
): Promise<GeneratedWeek> {
  const prompt = replaceMealPrompt(context, dateToReplace, mealType, reason)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Expert cuisine française. Réponds UNIQUEMENT en JSON valide.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  })

  const response = completion.choices[0]?.message?.content
  if (!response) {
    throw new Error('Aucune réponse de l\'IA')
  }

  return parseAIResponse(response, GeneratedWeekSchema) as unknown as GeneratedWeek
}

/**
 * Propose alternative sans ingrédient
 */
export async function getAlternativeWithoutIngredient(
  context: Parameters<typeof generateWeekPrompt>[0],
  originalMealName: string,
  ingredientToExclude: string,
  date: string,
  mealType: "lunch" | "dinner"
): Promise<GeneratedWeek> {
  const prompt = alternativeWithoutIngredientPrompt(
    context,
    originalMealName,
    ingredientToExclude,
    date,
    mealType
  )

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Expert cuisine française. Réponds UNIQUEMENT en JSON valide.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
    max_tokens: 1500,
  })

  const response = completion.choices[0]?.message?.content
  if (!response) {
    throw new Error('Aucune réponse de l\'IA')
  }

  return parseAIResponse(response, GeneratedWeekSchema) as unknown as GeneratedWeek
}

/**
 * Extrait et normalise les ingrédients d'une recette
 */
export async function extractIngredients(recipeText: string): Promise<{ ingredients: Array<{ name: string; quantity: number; unit: string; originalText?: string }> }> {
  const prompt = extractIngredientsPrompt(recipeText)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Tu es un assistant expert en extraction de données culinaires. Tu réponds UNIQUEMENT en JSON valide.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3, // Plus déterministe pour l'extraction
    response_format: { type: 'json_object' },
  })

  const response = completion.choices[0]?.message?.content
  if (!response) {
    throw new Error('Aucune réponse de l\'IA')
  }

  const schema = z.object({
    ingredients: z.array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string(),
        originalText: z.string().optional(),
      })
    ),
  })

  return parseAIResponse(response, schema)
}
