#!/bin/bash

# Script pour réinitialiser la base de données SQLite
# Usage: ./scripts/reset-db.sh

echo "🗑️  Suppression de la base de données..."

# Supprimer le fichier de base de données
rm -f prisma/dev.db

echo "📦 Migration de la base de données..."

# Réinitialiser et migrer
npx prisma migrate reset --force
npx prisma generate

echo "✅ Base de données réinitialisée !"
