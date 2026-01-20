# Démarrage rapide - WeekEat

## ⚡ Configuration en 3 étapes

### 1. Créer le fichier `.env`

Créez un fichier `.env` à la racine du projet avec ce contenu :

```env
# Base de données (SQLite pour test rapide)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="générer-une-clé-sécure"

# OpenAI (obligatoire)
OPENAI_API_KEY="sk-votre-clé-openai"
```

**Pour générer NEXTAUTH_SECRET :**
```bash
# Windows PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Linux/Mac
openssl rand -base64 32
```

### 2. Installer et initialiser

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Créer la base de données
npx prisma db push
```

### 3. Lancer l'application

```bash
npm run dev
```

Ouvrez http://localhost:3000 dans votre navigateur.

## 📝 Obtenir une clé OpenAI

1. Allez sur https://platform.openai.com/api-keys
2. Créez un compte ou connectez-vous
3. Créez une nouvelle clé API
4. Copiez-la dans votre `.env` comme `OPENAI_API_KEY`

> ⚠️ **Note**: La génération de repas nécessite une clé OpenAI valide. Sans elle, l'application fonctionnera mais la génération échouera.

## 🎯 Première utilisation

1. Allez sur http://localhost:3000
2. Cliquez sur "Se connecter"
3. Entrez votre email (⚠️ le magic link ne fonctionnera pas sans config email - utilisez Google OAuth si configuré)
4. Créez un foyer
5. Générez votre première semaine de repas !

## 🔧 Passer à PostgreSQL (optionnel)

Si vous préférez utiliser PostgreSQL au lieu de SQLite :

1. Modifiez `prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Dans `.env` :
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/weekeat?schema=public"
   ```

3. Relancez :
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## ❓ Problèmes ?

- **"Environment variable not found"** → Vérifiez que `.env` existe et contient toutes les variables
- **"Can't reach database"** → Vérifiez `DATABASE_URL` dans `.env`
- **"Invalid API key"** → Vérifiez votre clé OpenAI
- **Erreur Prisma** → Relancez `npx prisma generate` puis `npx prisma db push`

Pour plus de détails, voir [SETUP.md](./SETUP.md).
