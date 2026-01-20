# 🔄 Réinitialiser la base de données

Pour supprimer toutes les données et repartir à zéro, utilisez l'une des méthodes suivantes :

## Windows (PowerShell)

```powershell
.\scripts\reset-db.ps1
```

## Linux/Mac (Bash)

```bash
chmod +x scripts/reset-db.sh
./scripts/reset-db.sh
```

## Manuellement

1. Supprimer le fichier de base de données :
   ```bash
   # Windows
   del prisma\dev.db
   del prisma\dev.db-journal
   
   # Linux/Mac
   rm prisma/dev.db
   rm prisma/dev.db-journal
   ```

2. Réinitialiser Prisma :
   ```bash
   npx prisma migrate reset --force
   npx prisma generate
   ```

3. Redémarrer le serveur de développement :
   ```bash
   npm run dev
   ```

## Après la réinitialisation

- Vous devrez vous reconnecter
- L'onboarding s'affichera automatiquement sur `/app/week`
- Vous pourrez créer un nouveau foyer
