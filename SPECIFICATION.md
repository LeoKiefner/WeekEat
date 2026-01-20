# Spécification fonctionnelle MVP - WeekEat

## Vue d'ensemble

WeekEat est une application web de planification de repas avec IA pour foyers. Elle génère automatiquement des repas de la semaine, respecte les contraintes strictes (bannissements, variété, saisonnalité), optimise la vaisselle, estime les coûts et produit des listes de courses.

## Parcours utilisateur

### 1. Onboarding
- Inscription/Connexion via magic link email (NextAuth)
- Création d'un foyer
- Invitation de membres (lien ou email)

### 2. Configuration initiale (optionnelle)
- Définir budget hebdomadaire
- Bannir des ingrédients (allergies, goûts)
- Définir préférences (végétarien, objectifs santé, contraintes de temps)
- Configurer nombre de repas par semaine

### 3. Génération de planification
- Cliquer sur "Générer la semaine"
- L'IA génère 7 repas (ou nombre configuré) en respectant:
  - Bannissements absolus
  - Variété (pas de doublon sur 30 jours)
  - Saisonnalité Alsace
  - Optimisation vaisselle
  - Budget
  - Contraintes calendrier (ex: jeudi resto)

### 4. Visualisation de la semaine
- Calendrier avec repas par jour
- Coût estimé par repas et total
- Tags (one-pan, végétarien, etc.)
- Temps de préparation

### 5. Consultation d'une recette
- Détails complets (ingrédients, instructions)
- Astuce vaisselle minimale
- Actions: "J'aime", "Je n'aime pas", "Bannir ingrédient", "Remplacer"

### 6. Liste de courses
- Ingrédients agrégés par semaine
- Regroupés par rayons de supermarché
- Quantités totales
- Export (copier, télécharger TXT)

## Règles métier

### Bannissements
- Un ingrédient banni ne doit JAMAIS apparaître dans un repas proposé
- Bannissement possible depuis une recette
- Bannissement au niveau du foyer (tous les membres)

### Variété
- Aucun repas ne doit être dupliqué dans les 30 derniers jours
- Si impossible (contraintes trop fortes), proposer la meilleure alternative et expliquer

### Saisonnalité
- Privilégier fruits et légumes de saison en Alsace
- Mois de saisonnalité définis par ingrédient dans la base

### Optimisation vaisselle
- Privilégier one-pan, one-pot
- Instructions orientées nettoyage minimal
- Score vaisselle (1-10) calculé par l'IA

### Contraintes calendrier
- "Jeudi soir resto" → mercredi soir meal-prep du déjeuner vendredi
- Support: "pas de repas", "restaurant", "meal-prep", "batch-cook"

### Budget
- Budget hebdomadaire configurable
- Estimation par repas basée sur prix moyens des ingrédients
- MVP: prix éditable manuellement, V2: import tickets/API

## Écrans

### Dashboard
- Liste des foyers de l'utilisateur
- Bouton "Nouveau foyer"

### Semaine
- Vue calendrier avec repas
- Résumé (nombre repas, coût total, temps moyen)
- Bouton "Générer la semaine"
- Clic sur repas → détail recette

### Recette
- Nom, description
- Instructions numérotées
- Astuce vaisselle
- Ingrédients avec quantités
- Actions (likes, bannir, remplacer)
- Informations (temps, coût, tags)

### Liste de courses
- Regroupement par rayons
- Cases à cocher
- Export (copier, TXT)

### Préférences foyer
- Ingrédients bannis
- Budget
- Préférences (diète, allergies, objectifs)
- Paramètres (saisonnalité, vaisselle)

## Modèle de données

Voir `prisma/schema.prisma` pour le schéma complet.

### Tables principales
- User: utilisateurs
- Household: foyers
- HouseholdMember: relation many-to-many users/foyers
- MealPlan: planification hebdomadaire
- Meal: repas individuel
- Recipe: recette
- Ingredient: ingrédient de référence
- RecipeIngredient: relation recette-ingrédient avec quantités
- BannedIngredient: ingrédients bannis par foyer
- HouseholdPreference: préférences du foyer (JSON)
- MealConstraint: contraintes calendrier
- MealReaction: likes/dislikes pour apprentissage
- HouseholdInvitation: invitations

## Routes API / Server Actions

### Authentification
- `/api/auth/[...nextauth]` - NextAuth handler

### Foyer
- `createHousehold(name)` - Créer un foyer
- `getHousehold(id)` - Récupérer un foyer
- `getUserHouseholds()` - Foyers de l'utilisateur
- `updateHouseholdSettings(id, data)` - Mettre à jour paramètres
- `banIngredient(householdId, ingredientId, reason)` - Bannir ingrédient

### Planification
- `generateMealPlan(householdId, weekStart?)` - Générer semaine
- `getMealPlan(householdId, weekStart?)` - Récupérer planification
- `replaceMealInPlan(mealPlanId, mealId, reason?)` - Remplacer un repas

### API REST
- `POST /api/household/[id]/ban-ingredient` - Bannir ingrédient

## Système de génération IA

### Prompts versionnés
- Version 1.0 dans `lib/ai/prompts.ts`

### Validation JSON
- Schémas Zod pour valider les réponses IA
- Parse et validation dans `lib/ai/client.ts`

### Garde-fous
- Validation stricte JSON avec Zod
- Logs des erreurs de parsing
- Versioning des prompts
- Contrôles de contraintes avant génération (bannissements, variété)

### Stratégie d'apprentissage (MVP simplifié)
- Scoring basé sur reactions (likes/dislikes)
- Pénalités pour ingrédients/profils non aimés
- Dans les prompts futurs, inclure historique des réactions

## Hypothèses MVP

1. **Saisonnalité Alsace**: Mois de saisonnalité hardcodés dans prompts. V2: table de référence complète.

2. **Prix ingrédients**: MVP utilise prix moyens par défaut éditable. V2: import tickets, API prix.

3. **Rayons supermarché**: Champ `aisle` dans Ingredient. MVP: quelques valeurs par défaut. V2: mapping complet.

4. **Meal-prep**: Support de base dans modèle, génération IA à affiner selon retours utilisateurs.

5. **Invitations**: Modèle créé, implémentation email (Resend) à compléter selon besoins.

## Plan d'implémentation

### Phase 1: MVP (actuel)
- ✅ Structure projet Next.js + TypeScript
- ✅ Modèle Prisma
- ✅ Authentification NextAuth (magic link)
- ✅ Prompts IA + client OpenAI
- ✅ Server actions foyer/planification
- ✅ Pages dashboard, semaine, recette
- ✅ Liste de courses basique
- ✅ Composants UI shadcn

### Phase 2: Améliorations MVP
- [ ] Implémentation complète réactions (likes/dislikes)
- [ ] Remplacement de repas avec IA
- [ ] Alternative sans ingrédient avec IA
- [ ] Page préférences foyer complète
- [ ] Invitations par email (Resend)

### Phase 3: V2
- [ ] Import prix via tickets/API
- [ ] Table saisonnalité complète
- [ ] Mapping rayons supermarché
- [ ] Export PDF liste de courses
- [ ] Apprentissage progressif (scoring avancé)
- [ ] Notifications (email jeudi 17h avec liste)

### Phase 4: Optimisations
- [ ] Cache générations IA
- [ ] Batch cooking intelligent
- [ ] Suggestions basées sur historiques
- [ ] Intégration Drive/partenaires
