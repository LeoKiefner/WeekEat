# Documentation complète - WeekEat

## Structure du projet

```
weekeat/
├── app/                      # Pages Next.js (App Router)
│   ├── api/                  # Routes API
│   ├── auth/                 # Pages authentification
│   ├── dashboard/            # Dashboard utilisateur
│   ├── household/            # Pages foyer
│   │   ├── [id]/
│   │   │   ├── week/         # Vue semaine
│   │   │   ├── groceries/    # Liste de courses
│   │   │   └── meal/         # Détail recette
│   │   └── new/              # Création foyer
│   └── page.tsx              # Page d'accueil
├── components/               # Composants React
│   ├── forms/                # Formulaires
│   ├── groceries/            # Composants liste de courses
│   ├── meal/                 # Composants recettes
│   ├── providers/            # Providers (Session)
│   ├── ui/                   # Composants shadcn/ui
│   └── week/                 # Composants vue semaine
├── lib/                      # Utilitaires et logique
│   ├── ai/                   # Intégration IA
│   │   ├── prompts.ts        # Prompts versionnés
│   │   └── client.ts         # Client OpenAI
│   ├── actions/              # Server Actions
│   │   ├── household.ts      # Actions foyer
│   │   └── meal-plan.ts      # Actions planification
│   ├── auth.ts               # Configuration NextAuth
│   ├── prisma.ts             # Client Prisma
│   └── utils.ts              # Utilitaires
├── prisma/
│   └── schema.prisma         # Schéma base de données
└── types/
    └── next-auth.d.ts        # Types NextAuth
```

## Architecture

### Backend
- **Next.js Server Actions**: Logique métier côté serveur
- **Prisma**: ORM pour PostgreSQL
- **NextAuth**: Authentification
- **OpenAI**: Génération IA

### Frontend
- **React Server Components**: Pages et composants serveur
- **Tailwind CSS**: Styles
- **shadcn/ui**: Composants UI
- **Client Components**: Interactivité (forms, actions)

## Fonctionnalités implémentées

### ✅ Authentification
- Magic link email
- Support Google OAuth (optionnel)
- Sessions sécurisées

### ✅ Gestion foyers
- Création foyer
- Liste foyers utilisateur
- Modèle multi-membres (prêt pour invitations)

### ✅ Génération repas
- Génération semaine complète avec IA
- Respect bannissements
- Respect variété (30 jours)
- Saisonnalité Alsace
- Optimisation vaisselle
- Estimation coût

### ✅ Visualisation
- Vue semaine (calendrier repas)
- Détail recette (instructions, ingrédients)
- Liste de courses (regroupée par rayons)

### ✅ Actions
- Bannir ingrédient depuis recette
- Export liste de courses (copier, TXT)

## Fonctionnalités à compléter

### 🔲 Réactions repas
- Like/dislike
- Stockage en DB
- Impact sur générations futures

### 🔲 Remplacement repas
- UI "Remplacer ce repas"
- Régénération avec IA
- Application automatique

### 🔲 Alternatives
- "Alternative sans cet ingrédient"
- Régénération ciblée

### 🔲 Paramètres foyer
- Page complète de paramètres
- Édition budget
- Édition préférences
- Gestion contraintes calendrier

### 🔲 Invitations
- Génération lien/token
- Envoi email (Resend)
- Page accepter invitation

## Configuration requise

### Variables d'environnement

Créer un fichier `.env`:

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/weekeat?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="générer-une-clé-secure"

# OpenAI
OPENAI_API_KEY="sk-..."

# Email (Resend ou SMTP)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@weekeat.app"
# OU configuration SMTP
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="user"
EMAIL_SERVER_PASSWORD="password"

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Installation

```bash
# Installer dépendances
npm install

# Configurer base de données
npx prisma generate
npx prisma db push

# Lancer développement
npm run dev
```

## Utilisation

### Parcours utilisateur type

1. **Connexion**: Aller sur `/auth/signin`, entrer email, recevoir magic link
2. **Créer foyer**: Dashboard → "Nouveau foyer" → Nommer
3. **Générer semaine**: Foyer → "Générer la semaine" → Attendre génération IA
4. **Consulter repas**: Clic sur repas → Détail recette
5. **Bannir ingrédient**: Détail recette → Clic banne sur ingrédient
6. **Liste de courses**: Menu "Liste de courses" → Copier ou télécharger

### Génération IA

La génération prend 5-15 secondes selon complexité. Contraintes appliquées:
- Aucun ingrédient banni
- Aucun repas dupliqué (30 jours)
- Priorité saisonnalité
- Optimisation vaisselle
- Respect budget

## Extensions possibles

### Court terme
- Notifications email hebdomadaires
- Export PDF liste de courses
- Historique repas précédents
- Statistiques (coût moyen, temps moyen)

### Moyen terme
- Import prix automatique
- Table saisonnalité complète
- Apprentissage basé sur réactions
- Meal-prep intelligent

### Long terme
- Application mobile (React Native)
- Partage recettes entre foyers
- Intégration supermarchés en ligne
- IA fine-tunée sur recettes françaises

## Support et contribution

### Bugs connus MVP
- Réactions (likes/dislikes) non persistées
- Remplacement repas non implémenté
- Invitations non fonctionnelles

### Améliorations prioritaires
1. Compléter réactions et stockage
2. Implémenter remplacement repas
3. Finaliser invitations email
4. Page paramètres complète

## Licence

Projet privé - WeekEat
