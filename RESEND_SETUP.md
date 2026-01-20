# Configuration Resend - WeekEat

Resend est maintenant configuré dans toute l'application pour l'envoi d'emails.

## Configuration automatique

L'application détecte automatiquement si `RESEND_API_KEY` est présent dans `.env` et utilise Resend pour :
- ✅ Authentification NextAuth (magic links)
- ✅ Invitations de foyer
- ✅ Tous les futurs emails de l'application

## Configuration requise

Dans votre fichier `.env`, ajoutez :

```env
RESEND_API_KEY="re_votre-clé-resend"
EMAIL_FROM="noreply@votredomaine.com"
```

### Obtenir votre clé Resend

1. Créez un compte sur https://resend.com
2. Allez dans "API Keys"
3. Créez une nouvelle clé
4. Copiez la clé (commence par `re_`)

### Configurer le domaine d'envoi

#### Option 1: Domaine vérifié (recommandé pour production)

1. Allez dans "Domains" sur Resend
2. Ajoutez votre domaine
3. Configurez les enregistrements DNS (SPF, DKIM, DMARC)
4. Utilisez votre domaine dans `EMAIL_FROM` : `noreply@votredomaine.com`

#### Option 2: Domaine de test Resend (pour développement)

Pour tester rapidement, vous pouvez utiliser le domaine de test Resend :
```env
EMAIL_FROM="onboarding@resend.dev"
```

⚠️ **Note**: Les emails depuis `resend.dev` peuvent aller en spam. Pour production, utilisez votre propre domaine.

## Utilisation dans le code

### NextAuth (Magic Links)

La configuration est automatique dans `lib/auth.ts`. Si `RESEND_API_KEY` est défini, NextAuth utilise Resend SMTP.

### Envoyer des emails personnalisés

```typescript
import { sendEmail } from "@/lib/email/resend"

await sendEmail({
  to: "user@example.com",
  subject: "Sujet de l'email",
  html: "<h1>Contenu HTML</h1>",
})
```

### Invitations de foyer

```typescript
import { sendHouseholdInvitation } from "@/lib/email/resend"

await sendHouseholdInvitation({
  to: "user@example.com",
  inviterName: "John",
  householdName: "Maison principale",
  invitationLink: "https://weekeat.app/invite/token",
})
```

## Test

1. Assurez-vous que `RESEND_API_KEY` est dans `.env`
2. Redémarrez le serveur : `npm run dev`
3. Essayez de vous connecter avec magic link
4. Vérifiez les logs de Resend dans votre dashboard : https://resend.com/emails

## Dépannage

### Les emails ne partent pas

- Vérifiez que `RESEND_API_KEY` est bien défini
- Vérifiez les logs dans la console
- Consultez le dashboard Resend pour voir les erreurs
- Vérifiez que votre domaine est vérifié (si vous utilisez votre propre domaine)

### Les emails vont en spam

- Vérifiez que votre domaine est bien vérifié
- Configurez correctement SPF, DKIM, DMARC
- Évitez d'utiliser `resend.dev` en production

### Erreur "Resend n'est pas configuré"

- Vérifiez que `RESEND_API_KEY` est présent dans `.env`
- Redémarrez le serveur après avoir ajouté la variable
