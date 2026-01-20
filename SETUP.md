# Guide de démarrage rapide - WeekEat

## Étape 1: Variables d'environnement

Créez un fichier `.env` à la racine du projet en copiant `env.example` :

```bash
# Windows PowerShell
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

Puis éditez `.env` et remplissez les valeurs :

### Variables OBLIGATOIRES

1. **DATABASE_URL** - URL de votre base de données PostgreSQL

   **Option A: Base PostgreSQL locale**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/weekeat?schema=public"
   ```

   **Option B: SQLite (pour test rapide sans installer PostgreSQL)**
   
   Modifiez d'abord `prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   
   Puis dans `.env` :
   ```env
   DATABASE_URL="file:./dev.db"
   ```

   **Option C: Service cloud (Supabase, Vercel Postgres, etc.)**
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
   ```

2. **NEXTAUTH_SECRET** - Clé secrète pour NextAuth

   Générer une clé :
   ```bash
   # Windows PowerShell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   
   # Linux/Mac
   openssl rand -base64 32
   ```

   Puis dans `.env` :
   ```env
   NEXTAUTH_SECRET="votre-clé-générée"
   ```

3. **NEXTAUTH_URL** - URL de votre application
   ```env
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **OPENAI_API_KEY** - Clé API OpenAI (obligatoire pour génération repas)

   Obtenir une clé : https://platform.openai.com/api-keys
   ```env
   OPENAI_API_KEY="sk-votre-clé"
   ```

### Variables OPTIONNELLES (pour emails)

**Avec Resend (recommandé) :**
1. Créer un compte sur https://resend.com
2. Obtenir la clé API
3. Configurer un domaine (ou utiliser domaine de test)
4. Dans `.env` :
   ```env
   RESEND_API_KEY="re_votre-clé"
   EMAIL_FROM="noreply@votredomaine.com"
   ```

**Ou avec SMTP classique :**
```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="votre-email@gmail.com"
EMAIL_SERVER_PASSWORD="mot-de-passe-app"
EMAIL_FROM="votre-email@gmail.com"
```

> ⚠️ **Note**: Sans configuration email, l'authentification par magic link ne fonctionnera pas. Vous pouvez utiliser Google OAuth à la place (voir ci-dessous).

**Google OAuth (alternative à magic link) :**
1. Créer un projet sur https://console.cloud.google.com
2. Activer Google+ API
3. Créer credentials OAuth 2.0
4. Dans `.env` :
   ```env
   GOOGLE_CLIENT_ID="votre-client-id"
   GOOGLE_CLIENT_SECRET="votre-secret"
   ```

## Étape 2: Installer les dépendances

```bash
npm install
```

## Étape 3: Initialiser la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Créer/appliquer le schéma
npx prisma db push

# (Optionnel) Ouvrir Prisma Studio pour voir la DB
npx prisma studio
```

## Étape 4: Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## Problèmes courants

### Erreur: "Environment variable not found: DATABASE_URL"
➡️ Vérifiez que le fichier `.env` existe et contient `DATABASE_URL`

### Erreur: "Can't reach database server"
➡️ Vérifiez que PostgreSQL est démarré (si base locale) ou que l'URL de connexion est correcte

### Erreur: "Invalid API key" (OpenAI)
➡️ Vérifiez votre clé API OpenAI et que vous avez des crédits

### Authentification ne fonctionne pas
➡️ Vérifiez `NEXTAUTH_SECRET` et `NEXTAUTH_URL` dans `.env`

## Test rapide sans PostgreSQL

Pour tester rapidement sans installer PostgreSQL, utilisez SQLite :

1. Modifiez `prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Dans `.env` :
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. Relancez :
   ```bash
   npx prisma generate
   npx prisma db push
   ```

> ⚠️ SQLite est limité pour la production, mais parfait pour tester.
