# Prompts IA - WeekEat

## Version 1.0 (MVP)

Tous les prompts sont dans `lib/ai/prompts.ts` et utilisent OpenAI GPT-4o-mini avec `response_format: { type: 'json_object' }`.

## 1. Générer une semaine complète

### Fonction
`generateWeekPrompt(context: MealGenerationContext)`

### Usage
Générer 7 repas (ou nombre configuré) pour une semaine, en respectant toutes les contraintes.

### Contraintes incluses
- **Bannissements absolus**: Liste complète dans prompt, instruction stricte "JAMAIS"
- **Variété 30 jours**: Liste des repas déjà mangés, instruction "NE PAS reproduire"
- **Saisonnalité Alsace**: Mois actuel + liste ingrédients de saison
- **Optimisation vaisselle**: Instructions explicites (one-pan, one-pot, réutilisation)
- **Budget**: Budget hebdomadaire cible, estimation par repas
- **Contraintes calendrier**: Dates avec contraintes (resto, pas de repas, meal-prep)
- **Préférences**: Diète, allergies, objectifs, contraintes temps
- **Disponibilité**: Ingrédients supermarché classique uniquement

### Format sortie JSON

```json
{
  "meals": [
    {
      "name": "Nom du repas",
      "description": "Description courte",
      "mealType": "lunch" | "dinner" | "breakfast",
      "date": "YYYY-MM-DD",
      "prepTime": 15,
      "cookTime": 30,
      "servings": 2,
      "tags": ["one-pan", "vegetarian", "quick"],
      "estimatedCost": 8.50,
      "instructions": "Étapes détaillées numérotées",
      "dishwareTips": "Astuces vaisselle minimale",
      "ingredients": [
        {
          "name": "Nom ingrédient exact",
          "quantity": 500,
          "unit": "g",
          "notes": "Optionnel"
        }
      ]
    }
  ],
  "totalCost": 59.50,
  "seasonalIngredients": ["chou", "carotte"],
  "dishwareScore": 9
}
```

### Validation
- Schéma Zod `GeneratedWeekSchema`
- Nombre exact de repas = `mealsPerWeek`
- Aucun ingrédient banni
- Prix réalistes
- Instructions complètes

## 2. Remplacer un seul repas

### Fonction
`replaceMealPrompt(context, dateToReplace, mealType, reason?)`

### Usage
Remplacer un repas spécifique d'une semaine déjà générée.

### Contraintes
Mêmes que génération semaine, mais pour un seul repas.

### Format sortie
Même structure que génération semaine, mais un seul repas dans `meals[]`.

### Validation
- Un seul repas
- Respecte toutes les contraintes
- Date correspond à `dateToReplace`
- Type correspond à `mealType`

## 3. Alternative sans ingrédient

### Fonction
`alternativeWithoutIngredientPrompt(context, originalMealName, ingredientToExclude, date, mealType)`

### Usage
Proposer un repas alternatif similaire au repas original, mais sans un ingrédient spécifique.

### Logique
- Profil nutritionnel et gustatif similaire
- Sans l'ingrédient exclu
- Respecte TOUTES les autres contraintes (bannissements, variété, saisonnalité)
- Minimise vaisselle
- Rester dans budget

### Format sortie
Même structure, un seul repas.

## 4. Extraire ingrédients normalisés

### Fonction
`extractIngredientsPrompt(recipeText)`

### Usage
Normaliser une liste d'ingrédients depuis un texte de recette (import externe, recette manuelle).

### Normalisation
- Nom standardisé (sans pluriel inutile)
- Quantité en nombre (convertir toutes unités)
- Unité standard (g, kg, ml, cl, unité, cuillère, etc.)
- Notes si ambiguïté

### Format sortie

```json
{
  "ingredients": [
    {
      "name": "Nom standardisé",
      "quantity": 500,
      "unit": "g",
      "originalText": "500g de..."
    }
  ]
}
```

## Paramètres techniques

### Modèle
- **OpenAI GPT-4o-mini** (MVP)
- Temperature: **0.7** (génération) / **0.3** (extraction)
- `response_format: { type: 'json_object' }` pour forcer JSON

### Tokens estimés
- Input: ~500-800 tokens (selon contexte)
- Output: ~1500-2500 tokens (selon nombre repas)
- Coût: ~0.002$ par génération

### Temps de réponse
- Génération semaine: 5-15 secondes
- Remplacement repas: 3-8 secondes
- Extraction ingrédients: 2-5 secondes

## Versioning

### Format
Chaque recette générée stocke `aiPromptVersion: "1.0"` dans la DB.

### Évolution prévue
- **V1.0**: MVP avec contraintes de base
- **V1.1**: Ajout historique réactions dans contexte
- **V2.0**: Optimisations vaisselle avancées
- **V2.1**: Meal-prep intelligent
- **V3.0**: Apprentissage ML léger

### Migration
Lorsqu'un nouveau prompt est déployé:
1. Mettre à jour `lib/ai/prompts.ts`
2. Incrémenter version
3. Nouvelles générations utilisent nouvelle version
4. Anciennes recettes gardent leur version (traçabilité)

## Tests et validation

### Tests unitaires suggérés
```typescript
describe('Prompts IA', () => {
  test('generateWeekPrompt inclut tous les bannissements', () => {
    const context = { bannedIngredients: ['tomate', 'oignon'] }
    const prompt = generateWeekPrompt(context)
    expect(prompt).toContain('tomate')
    expect(prompt).toContain('oignon')
  })

  test('GeneratedWeekSchema valide réponse correcte', () => {
    const response = { meals: [...], totalCost: 50, ... }
    expect(() => GeneratedWeekSchema.parse(response)).not.toThrow()
  })
})
```

### Validation en production
- Logs des erreurs de parsing
- Métriques temps de génération
- Taux de succès/échec
- Violations de contraintes détectées

## Améliorations futures

### Court terme
- Ajouter exemples dans prompts (few-shot learning)
- Améliorer instructions vaisselle avec exemples concrets
- Ajuster temperature selon type de génération

### Moyen terme
- Fine-tuning sur recettes françaises
- Prompts spécialisés par type de repas
- Génération batch optimisée

### Long terme
- Modèle spécialisé propriétaire
- Génération locale (privacy)
- Intégration bases de recettes externes
