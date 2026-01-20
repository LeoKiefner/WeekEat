# Script PowerShell pour réinitialiser la base de données SQLite
# Usage: .\scripts\reset-db.ps1

Write-Host "🗑️  Suppression de la base de données..." -ForegroundColor Yellow

# Supprimer le fichier de base de données
if (Test-Path "prisma\dev.db") {
    Remove-Item "prisma\dev.db" -Force
    Write-Host "✅ Fichier dev.db supprimé" -ForegroundColor Green
}

if (Test-Path "prisma\dev.db-journal") {
    Remove-Item "prisma\dev.db-journal" -Force
    Write-Host "✅ Fichier dev.db-journal supprimé" -ForegroundColor Green
}

Write-Host "📦 Migration de la base de données..." -ForegroundColor Yellow

# Réinitialiser et migrer
npx prisma migrate reset --force
npx prisma generate

Write-Host "✅ Base de données réinitialisée !" -ForegroundColor Green
