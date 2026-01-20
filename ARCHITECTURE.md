# Architecture WeekEat - Cosy & Rituels

## Structure des routes

### Zone publique
- `/` - Page d'accueil marketing
- `/login` - Connexion (magic link)
- `/join/[token]` - Accepter invitation

### Zone app (navigation bottom)
- `/app/week` - Semaine (HOME)
- `/app/recipe/[id]` - Détail recette
- `/app/groceries` - Liste de courses
- `/app/household` - Foyer (paramètres)
- `/app/history` - Historique 30 jours
- `/app/onboarding` - Onboarding (3 écrans)

### Routes techniques
- `/app/week/generate` - Génération avec écran dédié
- `/api/generate-meal-plan` - API génération
- `/api/household/[id]/ban-ingredient` - API bannissement

## Navigation bottom

4 onglets maximum, toujours visibles :
1. **Semaine** - Page principale
2. **Courses** - Liste de courses
3. **Foyer** - Paramètres et gestion
4. **Historique** - 30 derniers jours

Pas de "Réglages" séparé → tout dans "Foyer"

## Pages principales

### `/app/week` - La page HOME
- **État vide** : Illustration + bouton "Générer ma semaine"
- **Bandeau résumé** : X repas, coût, temps moyen, saison, vaisselle
- **Grille semaine** : Par jour, max 3 infos visibles (nom, temps, coût)
- **Actions** : Générer, Optimiser liste

### `/app/recipe/[id]` - Dopamine douce
- Photo/illustration
- 3 sections : Ingrédients (cliquables), Étapes, Vaisselle minimale
- Barre actions bottom : Remplacer, J'aime, Bannir (via ingrédient)

### `/app/groceries` - Deux modes
- **Mode magasin** : Par rayons, cases à cocher
- **Mode cuisine** : Par recettes (batch cooking)
- Export simple : Copier / Télécharger

### `/app/household` - Paramètres chaleureux
- Section Membres (inviter)
- Section Préférences (diète, allergies, budget)
- Section Interdits (ingrédients bannis, recherche)
- Section Contraintes (cartes éditables : jeudi resto, meal-prep)

### `/app/history` - Éviter répétitions
- Calendrier 30 jours avec repas déjà mangés
- Top repas du foyer (basé sur likes)
- Bouton "Refaire" (si autorisé par règle du mois)

## Onboarding - 3 écrans max

1. **Nom + nombre de personnes**
2. **Alimentation + allergies majeures**
3. **Contraintes avec presets** (vaisselle, saison, jeudi resto, batch)

Puis → `/app/week` avec état vide

## Rituels & Cosy

### Moment WeekEat du jeudi 17h
- Carte sur la home si plan prêt
- Détail saison : "Cette semaine, on est sur: poireaux, carottes"

### Micro-texte doux
- "On te simplifie la vie."
- "Une casserole, c'est suffisant."
- Jamais culpabilisant

### Identité visuelle
- Beaucoup d'espace blanc
- Cartes arrondies (radius 1rem)
- Ombres légères
- Illustrations minimalistes (emojis pour MVP)
- Palette cosy (orange/amber/pink)

## États vides beaux

Chaque page a un état vide cosy :
- Illustration (emoji animé)
- Message doux
- Action claire

## Design system

### Couleurs
- Primary: Orange doux (16 96% 64%)
- Background: Gradient amber/orange/pink
- Cards: Blanc avec bordure primary/20
- Accent: Gradients doux

### Typographie
- Titres: Bold, grandes tailles
- Corps: Lisible, espacement généreux
- Micro-texte: Petit, jamais agressif

### Espacements
- Container: max-width avec padding
- Cards: Espacement généreux (p-6)
- Gap: Minimum 4 (gap-4, gap-6)

### Animations
- Float: Pour emojis/illustrations
- Pulse: Pour loading
- Hover: Transitions douces
