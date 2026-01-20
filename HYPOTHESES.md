# Hypothèses et décisions - WeekEat

## Hypothèses MVP

### 1. Saisonnalité Alsace
**Hypothèse**: Mois de saisonnalité hardcodés dans `lib/ai/prompts.ts`, fonction `getSeasonalIngredientsAlsace()`.

**Justification**: MVP rapide, pas besoin de table complexe au démarrage.

**Évolution V2**: Créer table `Seasonality` avec mois par ingrédient et région, rendue configurable.

### 2. Prix ingrédients
**Hypothèse**: Prix moyens par défaut dans table `Ingredient.avgPricePerUnit`, éditable manuellement.

**Justification**: MVP n'a pas besoin d'intégration API complexe, l'utilisateur peut ajuster.

**Évolution V2**: 
- Import automatique via tickets (OCR)
- API prix partenaires
- Mise à jour hebdomadaire automatique

### 3. Rayons supermarché
**Hypothèse**: Champ `Ingredient.aisle` avec quelques valeurs par défaut ("Fruits & Légumes", "Épicerie", etc.).

**Justification**: Pour liste de courses, regroupement basique suffit.

**Évolution V2**: Mapping complet par chaîne de supermarché, catégories standardisées.

### 4. Meal-prep et contraintes calendrier
**Hypothèse**: Modèle de données supporte meal-prep, mais génération IA basique. Contraintes "jeudi resto" supportées dans prompt.

**Justification**: Fonctionnalité avancée, à affiner selon retours utilisateurs.

**Évolution V2**: 
- Génération IA spécialisée meal-prep
- Suggestions intelligentes batch-cooking
- Planning multi-jours

### 5. Invitations foyer
**Hypothèse**: Modèle de données créé, mais envoi email (Resend) à implémenter selon besoins.

**Justification**: MVP peut fonctionner sans invitations (un utilisateur peut créer plusieurs foyers pour tester).

**Évolution V2**: 
- Intégration Resend complète
- Lien d'invitation direct
- Notifications

### 6. Apprentissage et recommandations
**Hypothèse**: Système de scoring basique basé sur réactions (likes/dislikes), pas de ML lourd.

**Justification**: MVP se concentre sur génération, apprentissage est bonus.

**Évolution V2**: 
- Modèle ML léger (régression logistique)
- Recommandations personnalisées
- Features avancées (profils utilisateurs)

### 7. Modèle IA
**Hypothèse**: GPT-4o-mini pour MVP (coût/bénéfice optimal).

**Justification**: Suffisant pour qualité MVP, upgrade possible si besoin.

**Évolution V2**: 
- GPT-4o si qualité insuffisante
- Fine-tuning sur recettes françaises
- Modèle spécialisé

### 8. Validation contraintes
**Hypothèse**: Validation post-génération dans `generateMealPlan`, régénération si violation détectée.

**Justification**: Plus simple que pré-validation complexe, acceptable pour MVP.

**Évolution V2**: 
- Pré-validation plus stricte
- Contrôles en temps réel
- Suggestions alternatives automatiques

### 9. Export liste de courses
**Hypothèse**: Export TXT (copier + télécharger), pas PDF dans MVP.

**Justification**: Plus simple, suffisant pour usage.

**Évolution V2**: 
- Export PDF formaté
- Intégration Drive/Dropbox
- Partage collaboratif

### 10. Gestion erreurs IA
**Hypothèse**: Try/catch avec logs console, message utilisateur générique.

**Justification**: MVP, amélioration selon retours.

**Évolution V2**: 
- Retry automatique
- Fallback sur recettes pré-générées
- Monitoring et alertes

## Décisions techniques

### Framework: Next.js 14 App Router
**Raison**: Server Components, Server Actions, performances, déploiement Vercel facile.

### Base de données: PostgreSQL + Prisma
**Raison**: Relations complexes (foyers, membres), Prisma excellent DX, migrations automatiques.

### Auth: NextAuth
**Raison**: Standard, support magic link, adaptateur Prisma inclus.

### UI: Tailwind + shadcn/ui
**Raison**: Rapidité développement, composants accessibles, design moderne.

### IA: OpenAI GPT-4o-mini
**Raison**: Meilleur rapport qualité/coût pour MVP, JSON mode, rapide.

## Configurabilité

Points rendus configurables dès MVP:
- Budget hebdomadaire
- Nombre de repas par semaine
- Bannissements ingrédients
- Préférences (diète, allergies, objectifs)
- Saisonnalité (activable/désactivable)
- Optimisation vaisselle (activable/désactivable)

Points hardcodés (V2):
- Saisonnalité exacte par mois (table complète)
- Prix ingrédients (import auto)
- Rayons supermarché (mapping complet)
