# WeekEat

Application de planification de repas avec IA pour foyers.

## 📋 Documentation complète

- **[SPECIFICATION.md](./SPECIFICATION.md)** - Spécification fonctionnelle MVP
- **[DESIGN_IA.md](./DESIGN_IA.md)** - Design du système de génération IA
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Plan d'implémentation
- **[PROMPTS_IA.md](./PROMPTS_IA.md)** - Documentation des prompts IA
- **[HYPOTHESES.md](./HYPOTHESES.md)** - Hypothèses et décisions
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Guide d'utilisation

## 🚀 Installation

```bash
npm install

# Configurer les variables d'environnement
# Créer .env avec les variables nécessaires (voir DOCUMENTATION.md)

# Initialiser la base de données
npx prisma generate
npx prisma db push

# Lancer le développement
npm run dev
```

## ✨ Fonctionnalités MVP

- ✅ Création de foyers et gestion multi-membres
- ✅ Génération automatique de planification hebdomadaire avec IA
- ✅ Respect strict des ingrédients bannis
- ✅ Variété garantie (pas de doublon sur 30 jours)
- ✅ Saisonnalité Alsace
- ✅ Optimisation vaisselle
- ✅ Estimation de coût par repas
- ✅ Liste de courses exportable (TXT)
- 🔲 Réactions aux repas (likes/dislikes) - à compléter
- 🔲 Remplacement de repas - à compléter
- 🔲 Invitations par email - à compléter

## 🛠 Stack technique

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Base de données**: PostgreSQL + Prisma
- **Authentification**: NextAuth (magic link email)
- **IA**: OpenAI gpt-5-mini
- **UI**: Tailwind CSS + shadcn/ui
- **Emails**: Resend (à configurer)

## 📦 Structure

```
app/              # Pages Next.js
components/       # Composants React
lib/
  ├── ai/        # Prompts et client IA
  ├── actions/   # Server Actions
  └── ...        # Utilitaires
prisma/          # Schéma base de données
```

## 🎯 Prochaines étapes

Voir [IMPLEMENTATION.md](./IMPLEMENTATION.md) pour la liste complète des fonctionnalités à compléter.
