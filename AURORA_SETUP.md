# Configuration Amazon Aurora PostgreSQL

Ce guide explique comment connecter WeekEat à une base de données Amazon Aurora PostgreSQL.

## Prérequis

1. Une instance Amazon Aurora PostgreSQL configurée
2. Les variables d'environnement PostgreSQL dans `.env.local` :
   - `PGHOST` - Host de la base de données
   - `PGPORT` - Port (généralement 5432)
   - `PGDATABASE` - Nom de la base de données
   - `PGUSER` - Nom d'utilisateur
   - `PGPASSWORD` - Mot de passe (⚠️ **requis**)
   - `PGSSLMODE` - Mode SSL (généralement "require")

## Étapes de configuration

### 1. Ajouter PGPASSWORD dans .env.local

Si vous n'avez pas encore `PGPASSWORD`, ajoutez-le :

```env
PGPASSWORD="votre-mot-de-passe"
```

### 2. Générer DATABASE_URL

#### Option A : Automatique (recommandé)

Exécutez le script qui construit automatiquement `DATABASE_URL` :

```bash
node scripts/build-database-url.js --save
```

Ce script :
- Lit les variables `PG*` de votre `.env.local`
- Construit l'URL de connexion PostgreSQL
- L'ajoute automatiquement dans `.env.local`

#### Option B : Manuel

Construisez manuellement l'URL et ajoutez-la dans `.env.local` :

```env
DATABASE_URL="postgresql://PGUSER:PGPASSWORD@PGHOST:PGPORT/PGDATABASE?sslmode=PGSSLMODE&schema=public"
```

**Exemple** :
```env
DATABASE_URL="postgresql://myuser:mypassword@aurora-cluster.cluster-xxxxx.us-east-1.rds.amazonaws.com:5432/weekeat?sslmode=require&schema=public"
```

### 3. Mettre à jour Prisma

Le schéma Prisma a déjà été mis à jour pour utiliser PostgreSQL. Vérifiez que `prisma/schema.prisma` contient :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Générer le client Prisma

```bash
npx prisma generate
```

### 5. Créer les tables dans la base de données

#### Option A : Push du schéma (rapide pour développement)

```bash
npx prisma db push
```

⚠️ **Note** : `db push` est pratique pour le développement mais ne crée pas d'historique de migrations. Pour la production, utilisez les migrations.

#### Option B : Migrations (recommandé pour production)

```bash
# Créer une migration initiale
npx prisma migrate dev --name init

# Pour la production
npx prisma migrate deploy
```

### 6. Vérifier la connexion

Testez la connexion avec Prisma Studio :

```bash
npx prisma studio
```

Ou créez un script de test :

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => { console.log('✅ Connexion réussie!'); prisma.$disconnect(); }).catch((e) => { console.error('❌ Erreur:', e); process.exit(1); });"
```

## Variables d'environnement requises

Votre `.env.local` doit contenir :

```env
# Variables PostgreSQL Aurora
PGHOST="votre-host-aurora"
PGPORT="5432"
PGDATABASE="votre-base-de-donnees"
PGUSER="votre-utilisateur"
PGPASSWORD="votre-mot-de-passe"  # ⚠️ REQUIS
PGSSLMODE="require"

# DATABASE_URL construite automatiquement ou manuellement
DATABASE_URL="postgresql://..."
```

## Sécurité

⚠️ **Important** :

1. Ne commitez **JAMAIS** `.env.local` dans Git
2. Vérifiez que `.env.local` est dans `.gitignore`
3. Pour la production (Vercel, etc.), ajoutez les variables dans les paramètres du projet
4. Utilisez IAM Database Authentication si possible pour éviter les mots de passe

## Dépannage

### Erreur "password authentication failed"
- Vérifiez que `PGPASSWORD` est correct
- Vérifiez que l'utilisateur a les bonnes permissions

### Erreur "SSL connection required"
- Assurez-vous que `PGSSLMODE=require` dans `.env.local`
- Vérifiez que votre instance Aurora accepte les connexions SSL

### Erreur "could not translate host name"
- Vérifiez que `PGHOST` est correct
- Vérifiez que le security group AWS autorise votre IP

### Erreur "database does not exist"
- Créez la base de données dans Aurora
- Vérifiez que `PGDATABASE` correspond au nom exact de la base

## Migration depuis SQLite

Si vous migrez depuis SQLite :

1. **Sauvegardez vos données** (si vous avez des données importantes)
2. **Suivez les étapes ci-dessus** pour configurer PostgreSQL
3. **Exécutez** `npx prisma db push` ou `npx prisma migrate dev`
4. Les données SQLite ne seront **pas** migrées automatiquement (nécessite un script de migration de données)