# Design système génération repas - WeekEat

## Architecture

### Flow de génération

1. **Collecte contexte**
   - Bannissements du foyer
   - Repas des 30 derniers jours (variété)
   - Préférences (diète, allergies, objectifs)
   - Contraintes calendrier de la semaine
   - Budget hebdomadaire
   - Paramètres (saisonnalité, vaisselle)

2. **Construction prompt**
   - Prompt principal: `generateWeekPrompt(context)`
   - Inclut toutes les contraintes strictes
   - Instructions JSON strictes

3. **Appel IA**
   - OpenAI GPT-4o-mini (MVP)
   - Temperature: 0.7 (créativité modérée)
   - `response_format: { type: 'json_object' }` pour forcer JSON

4. **Validation**
   - Parse JSON
   - Validation Zod (`GeneratedWeekSchema`)
   - Vérification contraintes (nombre repas, pas d'ingrédients bannis)

5. **Persistance**
   - Création/update MealPlan
   - Création Recipes
   - Création Meals liés
   - Création Ingredients si inexistants

## Respect des contraintes

### Bannissements
- Liste complète dans le prompt
- Instruction stricte: "STRICTEMENT INTERDITS, JAMAIS"
- Validation post-génération: vérifier que aucun ingrédient banni n'apparaît
- Si violation détectée: régénérer ou filtrer

### Variété (30 jours)
- Liste des noms de repas des 30 derniers jours
- Instruction: "NE PAS les reproduire"
- Validation: comparer noms générés avec historique
- Si doublon: régénérer ce repas ou proposer alternative

### Saisonnalité
- Mois actuel dans le prompt
- Liste d'ingrédients de saison en Alsace
- Instruction: "Priorité aux fruits et légumes de saison"
- Calculé dans `getSeasonalIngredientsAlsace(month)`

### Optimisation vaisselle
- Instruction explicite: "minimiser la vaisselle"
- Techniques suggérées: one-pan, one-pot, réutilisation
- Score vaisselle retourné par IA (1-10)
- Validation: vérifier présence tags "one-pan", "one-pot"

### Budget
- Budget hebdomadaire dans le prompt
- Estimation par repas calculée par IA
- Validation: total proche du budget (tolérance 20%)

## Prompts

### 1. Générer une semaine

Voir `lib/ai/prompts.ts:generateWeekPrompt()`

**Input**: MealGenerationContext
**Output**: GeneratedWeek (JSON strict)

**Contraintes incluses**:
- Bannissements absolus
- Variété (30 jours)
- Saisonnalité Alsace
- Optimisation vaisselle
- Budget
- Contraintes calendrier
- Préférences

### 2. Remplacer un repas

Voir `lib/ai/prompts.ts:replaceMealPrompt()`

**Input**: Context + date/type/raison
**Output**: GeneratedWeek (un seul repas)

**Logique**: Même contraintes que génération semaine, mais pour un seul repas.

### 3. Alternative sans ingrédient

Voir `lib/ai/prompts.ts:alternativeWithoutIngredientPrompt()`

**Input**: Context + repas original + ingrédient à exclure
**Output**: GeneratedWeek (un seul repas)

**Logique**: 
- Profil similaire au repas original
- Sans l'ingrédient exclu
- Respecte toutes les autres contraintes

### 4. Extraire ingrédients

Voir `lib/ai/prompts.ts:extractIngredientsPrompt()`

**Input**: Texte de recette
**Output**: Liste normalisée d'ingrédients

**Usage**: Normaliser des recettes externes ou manuelles.

## Validation et garde-fous

### Validation JSON
```typescript
// Schéma Zod strict
const GeneratedWeekSchema = z.object({
  meals: z.array(GeneratedMealSchema),
  totalCost: z.number(),
  seasonalIngredients: z.array(z.string()),
  dishwareScore: z.number().min(1).max(10),
})
```

### Contrôles post-génération
1. Nombre de repas = mealsPerWeek
2. Aucun ingrédient banni dans les recettes
3. Aucun repas dupliqué dans les 30 jours (comparaison noms)
4. Budget total proche du budget configuré (±20%)
5. Chaque repas a des instructions et ingrédients

### Gestion erreurs
- Parse JSON échoué → log erreur, message utilisateur, retry possible
- Validation Zod échouée → log détails, régénération
- Contrainte violée → log, régénération ciblée

### Logs
- Version du prompt utilisée
- Temps de génération
- Erreurs de parsing/validation
- Violations de contraintes détectées

## Stratégie d'apprentissage (MVP simplifié)

### Scoring basé sur réactions
- **Likes**: +1 point pour le profil de recette (tags, ingrédients)
- **Dislikes**: -1 point
- **Bannissements**: pénalité forte (-5) pour l'ingrédient

### Utilisation dans prompts futurs
```
Context: "Historique des préférences du foyer:
- Repas aimés: [profils similaires]
- Repas non aimés: [profils similaires]
- Ingrédients fréquemment bannis: [...]"
```

### Exploration contrôlée
- 80% recommandations basées sur scoring
- 20% nouvelles propositions (exploration)
- Ajustement dynamique selon satisfaction

### V2: ML léger
- Features: tags, ingrédients, temps, coût
- Modèle simple (régression logistique)
- Entraînement incrémental sur réactions

## Versioning prompts

### Format
- Fichier: `lib/ai/prompts.ts`
- Version dans prompt: `aiPromptVersion: "1.0"`
- Stockage: `Recipe.aiPromptVersion`

### Évolution
- V1.0: MVP avec contraintes de base
- V1.1: Ajout historique réactions
- V2.0: Optimisations avancées vaisselle
- V3.0: Meal-prep intelligent

### Tests
- Test unitaire: validation schémas
- Test d'intégration: génération complète
- Test A/B: comparer versions prompts

## Cache et performance

### MVP
- Pas de cache (génération à la demande)
- Coût estimé: ~0.01€ par semaine (GPT-4o-mini)

### V2
- Cache par contexte (hash du contexte)
- TTL: 24h
- Invalidation: changement préférences/bannissements

## Coûts estimés

- GPT-4o-mini: ~500 tokens input, ~2000 tokens output
- Coût: ~0.002$ par génération
- Avec cache: <0.01$ par utilisateur/semaine
