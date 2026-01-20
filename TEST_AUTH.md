# Tester l'authentification sans email

## Option 1: Configurer Resend (recommandé pour production)

1. Créer un compte sur https://resend.com
2. Vérifier un domaine ou utiliser le domaine de test
3. Obtenir votre clé API
4. Ajouter dans `.env` :
```env
RESEND_API_KEY="re_votre-clé-resend"
EMAIL_FROM="noreply@votredomaine.com"
# ou pour test avec domaine Resend
EMAIL_FROM="onboarding@resend.dev"
```

## Option 2: Configurer Gmail SMTP (pour test rapide)

1. Activer l'authentification à 2 facteurs sur votre compte Gmail
2. Générer un "Mot de passe d'application" :
   - https://myaccount.google.com/apppasswords
   - Sélectionner "Mail" et votre appareil
   - Copier le mot de passe généré (16 caractères)

3. Ajouter dans `.env` :
```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="votre-email@gmail.com"
EMAIL_SERVER_PASSWORD="votre-mot-de-passe-app-16-caracteres"
EMAIL_FROM="votre-email@gmail.com"
```

## Option 3: Utiliser Google OAuth (pas besoin d'email)

1. Créer un projet sur https://console.cloud.google.com
2. Activer Google+ API
3. Créer des credentials OAuth 2.0
4. Ajouter l'URL de redirection : `http://localhost:3000/api/auth/callback/google`
5. Dans `.env` :
```env
GOOGLE_CLIENT_ID="votre-client-id"
GOOGLE_CLIENT_SECRET="votre-client-secret"
```

Puis modifier `components/forms/signin-form.tsx` pour ajouter le bouton Google.

## Option 4: Créer un utilisateur manuellement (test local)

Pour tester rapidement sans configurer l'email, vous pouvez créer un utilisateur directement en base :

```bash
# Ouvrir Prisma Studio
npx prisma studio
```

Puis dans Prisma Studio, table `users` :
- Créer un nouvel utilisateur avec votre email
- L'ID sera généré automatiquement
- Créer aussi une session manuelle dans la table `sessions`

**OU** via script Node.js :

Créez `scripts/create-test-user.js` :
```javascript
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: new Date(),
    },
  })
  console.log('User created:', user)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Puis exécuter :
```bash
node scripts/create-test-user.js
```

## Option 5: Désactiver temporairement la vérification email

Pour le développement, vous pouvez modifier `lib/auth.ts` pour auto-vérifier les emails.

Mais la meilleure solution pour tester rapidement est **Option 2 (Gmail SMTP)** ou **Option 3 (Google OAuth)**.
