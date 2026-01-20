# Débogage de l'authentification - WeekEat

## Problème : Le lien magique ne fonctionne pas

Si le lien reçu par email ne fonctionne pas, voici comment diagnostiquer le problème.

## 1. Vérifier les variables d'environnement

Assurez-vous que votre fichier `.env` contient :

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-clé-secrète"
```

**Important** : 
- `NEXTAUTH_URL` doit correspondre exactement à l'URL de votre application
- Si vous testez en local, utilisez `http://localhost:3000`
- Si vous testez en production, utilisez votre URL de production (ex: `https://votredomaine.com`)

Pour générer `NEXTAUTH_SECRET` :
```bash
openssl rand -base64 32
```

## 2. Vérifier la base de données

Les tables NextAuth doivent exister. Vérifiez avec Prisma Studio :

```bash
npx prisma studio
```

Vérifiez que ces tables existent :
- `users`
- `accounts`
- `sessions`
- `verification_tokens`

Si elles n'existent pas, exécutez :
```bash
npx prisma db push
```

## 3. Vérifier l'URL du lien dans l'email

Le lien dans l'email devrait ressembler à :
```
http://localhost:3000/api/auth/callback/email?token=...
```

**Points à vérifier** :
- L'URL commence bien par votre `NEXTAUTH_URL`
- Le domaine correspond (localhost:3000 en dev, votre domaine en prod)
- Le token est présent dans l'URL

## 4. Vérifier les logs du serveur

Lancez votre serveur en mode développement et regardez les logs quand vous cliquez sur le lien :

```bash
npm run dev
```

Vous devriez voir :
- Des logs NextAuth avec `debug: true` activé
- Des erreurs éventuelles lors de la vérification du token
- Des redirections

## 5. Vérifier la configuration email

Assurez-vous que l'email est bien envoyé. Vérifiez :
- Votre boîte mail (et les spams)
- Les logs du serveur pour les erreurs d'envoi
- La configuration SMTP (Resend ou Gmail)

## 6. Erreurs communes

### "Configuration" ou "Invalid token"
- Vérifiez `NEXTAUTH_SECRET` est bien défini
- Vérifiez `NEXTAUTH_URL` correspond à l'URL actuelle
- Régénérez un nouveau lien (le token peut avoir expiré)

### "User not found" ou erreur de base de données
- Vérifiez que Prisma est à jour : `npx prisma db push`
- Vérifiez les tables dans Prisma Studio
- Vérifiez la connexion à la base de données

### Le lien redirige vers /login avec une erreur
- Regardez l'URL dans la barre d'adresse : `?error=...`
- Consultez les logs du serveur
- Le token peut avoir expiré (les tokens expirent après 24h par défaut)

## 7. Tester manuellement

1. Demandez un nouveau lien de connexion
2. Copiez l'URL complète du lien depuis l'email
3. Vérifiez que l'URL commence par votre `NEXTAUTH_URL`
4. Ouvrez le lien dans un navigateur en navigation privée
5. Regardez les logs du serveur pour voir ce qui se passe

## 8. Solution temporaire : Tester avec Google OAuth

Si l'email ne fonctionne toujours pas, configurez Google OAuth pour tester :

1. Allez sur https://console.cloud.google.com
2. Créez un projet
3. Activez Google+ API
4. Créez des credentials OAuth 2.0
5. Ajoutez l'URL de redirection : `http://localhost:3000/api/auth/callback/google`
6. Ajoutez dans `.env` :
```env
GOOGLE_CLIENT_ID="votre-client-id"
GOOGLE_CLIENT_SECRET="votre-client-secret"
```

## 9. Vérifier les logs NextAuth

Dans `lib/auth.ts`, `debug: true` est activé en développement. Vous devriez voir des logs détaillés dans la console du serveur.

## 10. Contacter le support

Si rien ne fonctionne, vérifiez :
- La version de NextAuth (doit être compatible avec Next.js 14+)
- Les logs complets du serveur
- La configuration complète de votre `.env`
