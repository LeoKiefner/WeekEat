# Plan d'implémentation - WeekEat

## Étape 1: Setup initial ✅

- [x] Projet Next.js 14 avec TypeScript
- [x] Configuration Tailwind + shadcn/ui
- [x] Prisma avec schéma complet
- [x] NextAuth configuré (magic link)
- [x] Variables d'environnement documentées

## Étape 2: Base de données ✅

- [x] Schéma Prisma complet
- [x] Relations définies
- [x] Migrations préparées

**Commandes:**
```bash
npx prisma generate
npx prisma db push
# ou pour migrations
npx prisma migrate dev --name init
```

## Étape 3: Authentification ✅

- [x] Configuration NextAuth
- [x] Adaptateur Prisma
- [x] Provider email (magic link)
- [x] Provider Google (optionnel)
- [x] Pages de connexion

**Configuration email:**
Pour MVP, utiliser Resend ou un service SMTP classique.

## Étape 4: IA et prompts ✅

- [x] Client OpenAI configuré
- [x] Prompts versionnés (V1.0)
- [x] Validation JSON avec Zod
- [x] Gestion erreurs

## Étape 5: Server Actions ✅

- [x] Actions foyer (création, récupération, bannissements)
- [x] Actions planification (génération, récupération)
- [x] API REST pour bannissements

## Étape 6: Pages et composants ✅

- [x] Page d'accueil
- [x] Dashboard (liste foyers)
- [x] Création foyer
- [x] Vue semaine (calendrier repas)
- [x] Vue recette détaillée
- [x] Liste de courses

## Étape 7: Fonctionnalités manquantes (à compléter)

### 7.1 Réactions aux repas
- [ ] Server action pour like/dislike
- [ ] API endpoint pour réactions
- [ ] UI pour réactions dans MealDetailView
- [ ] Stockage des réactions en DB

### 7.2 Remplacement de repas
- [ ] Fonction `replaceMeal` complète
- [ ] UI "Remplacer ce repas"
- [ ] Régénération avec IA

### 7.3 Alternative sans ingrédient
- [ ] Fonction `getAlternativeWithoutIngredient` complète
- [ ] UI "Alternative sans cet ingrédient"
- [ ] Application automatique

### 7.4 Préférences foyer
- [ ] Page paramètres complète
- [ ] Édition budget
- [ ] Édition préférences (diète, allergies, objectifs)
- [ ] Gestion contraintes calendrier

### 7.5 Invitations
- [ ] Génération token invitation
- [ ] Envoi email via Resend
- [ ] Page accepter invitation
- [ ] UI liste invitations

## Étape 8: Tests et validation

### Tests unitaires
- [ ] Tests prompts IA (validation schémas)
- [ ] Tests server actions
- [ ] Tests utilitaires

### Tests d'intégration
- [ ] Génération complète semaine
- [ ] Respect bannissements
- [ ] Respect variété
- [ ] Liste de courses agrégée

### Tests E2E (optionnel)
- [ ] Parcours complet utilisateur
- [ ] Création foyer → génération → liste

## Étape 9: Déploiement

### Préparation
- [ ] Variables d'environnement Vercel
- [ ] Base PostgreSQL (Vercel Postgres ou Supabase)
- [ ] Configuration Resend
- [ ] Configuration OpenAI

### Déploiement
- [ ] Push sur repo Git
- [ ] Connexion Vercel
- [ ] Build et déploiement
- [ ] Tests en production

## Étape 10: Améliorations post-MVP

### V2 - Prix
- [ ] Import prix tickets
- [ ] API prix partenaires
- [ ] Mise à jour automatique

### V2 - Saisonnalité
- [ ] Table saisonnalité complète
- [ ] Mise à jour dynamique

### V2 - Apprentissage
- [ ] Scoring avancé
- [ ] Recommandations personnalisées
- [ ] ML léger (optionnel)

### V2 - Notifications
- [ ] Email hebdomadaire (jeudi 17h)
- [ ] Notifications push (optionnel)

## Checklist déploiement

### Base de données
- [ ] PostgreSQL créée (Vercel/Supabase)
- [ ] DATABASE_URL configurée
- [ ] Migrations appliquées

### Services externes
- [ ] Compte OpenAI avec API key
- [ ] Compte Resend avec API key
- [ ] Domaine email configuré (Resend)

### Variables d'environnement Vercel
```
DATABASE_URL=...
NEXTAUTH_URL=https://weekeat.vercel.app
NEXTAUTH_SECRET=...
OPENAI_API_KEY=...
RESEND_API_KEY=...
EMAIL_FROM=noreply@votredomaine.com
GOOGLE_CLIENT_ID=... (optionnel)
GOOGLE_CLIENT_SECRET=... (optionnel)
```

### Build
- [ ] `npm run build` réussit
- [ ] Pas d'erreurs TypeScript
- [ ] Tests passent (si présents)

## Commandes utiles

```bash
# Développement
npm run dev

# Base de données
npx prisma studio          # Interface DB
npx prisma db push         # Appliquer schéma
npx prisma generate        # Régénérer client

# Build
npm run build
npm start

# Linting
npm run lint
```
