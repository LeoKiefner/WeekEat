/**
 * Templates d'emails cosy et accueillants pour WeekEat
 */

export interface EmailTemplateProps {
  title: string
  preheader?: string
  content: string
  buttonText?: string
  buttonLink?: string
  footerText?: string
}

/**
 * Template de base cosy pour tous les emails
 */
export function getEmailTemplate({
  title,
  preheader,
  content,
  buttonText,
  buttonLink,
  footerText,
}: EmailTemplateProps): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  ${preheader ? `<meta name="preheader" content="${preheader}">` : ''}
  <style>
    /* Reset styles pour compatibilité email */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #fef3c7;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    /* Styles cosy */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    }
    .email-header {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fed7aa 100%);
      padding: 40px 30px;
      text-align: center;
      border-radius: 24px 24px 0 0;
    }
    .email-header-icon {
      font-size: 64px;
      margin-bottom: 16px;
      display: inline-block;
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    .email-header h1 {
      color: #92400e;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .email-body {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    .email-content {
      color: #1f2937;
      font-size: 16px;
      line-height: 1.7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .email-content h2 {
      color: #92400e;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 600;
    }
    .email-content p {
      margin: 0 0 16px 0;
    }
    .email-button {
      display: inline-block;
      margin: 30px 0;
      padding: 16px 32px;
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .email-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
    }
    .email-button-container {
      text-align: center;
      margin: 30px 0;
    }
    .email-footer {
      padding: 30px;
      background-color: #fef3c7;
      text-align: center;
      border-radius: 0 0 24px 24px;
      border-top: 2px solid #fde68a;
    }
    .email-footer-text {
      color: #78350f;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .email-link {
      color: #ea580c;
      text-decoration: underline;
      word-break: break-all;
    }
    .email-divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #fde68a, transparent);
      margin: 30px 0;
      border: none;
    }
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        border-radius: 0 !important;
      }
      .email-header {
        border-radius: 0 !important;
        padding: 30px 20px !important;
      }
      .email-body {
        padding: 30px 20px !important;
      }
      .email-footer {
        border-radius: 0 !important;
        padding: 20px !important;
      }
      .email-header h1 {
        font-size: 28px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fef3c7;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef3c7; padding: 20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container">
          <!-- Header -->
          <tr>
            <td class="email-header">
              <div class="email-header-icon">🍽️</div>
              <h1>WeekEat</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td class="email-body">
              <div class="email-content">
                ${content}
              </div>
              
              ${buttonText && buttonLink ? `
              <div class="email-button-container">
                <a href="${buttonLink}" class="email-button">${buttonText}</a>
              </div>
              ` : ''}
              
              ${buttonLink && !buttonText ? `
              <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-radius: 12px; text-align: center;">
                <p style="color: #78350f; font-size: 14px; margin: 0 0 10px 0;">
                  Si le bouton ne fonctionne pas, copie ce lien :
                </p>
                <a href="${buttonLink}" class="email-link" style="color: #ea580c; word-break: break-all; font-size: 12px;">${buttonLink}</a>
              </div>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="email-footer">
              <p class="email-footer-text">
                ${footerText || 'Avec ❤️ par l\'équipe WeekEat<br>On te simplifie la vie, un repas à la fois ✨'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Template pour l'email de connexion (magic link)
 */
export function getSignInEmailTemplate(url: string, email: string): string {
  return getEmailTemplate({
    title: 'Bienvenue sur WeekEat ! 🎉',
    preheader: 'Clique sur ce lien pour te connecter à WeekEat',
    content: `
      <h2>Bienvenue ! 👋</h2>
      <p>Salut ! On est super content de te voir ici !</p>
      <p>Pour te connecter à <strong>WeekEat</strong> et commencer à planifier tes repas avec nous, clique simplement sur le bouton ci-dessous :</p>
    `,
    buttonText: '✨ Me connecter à WeekEat',
    buttonLink: url,
    footerText: 'Si tu n\'as pas demandé ce lien, tu peux ignorer cet email en toute sécurité. 💛',
  })
}

/**
 * Template pour l'invitation à un foyer
 */
export function getHouseholdInvitationTemplate(
  inviterName: string,
  householdName: string,
  invitationLink: string
): string {
  return getEmailTemplate({
    title: `Tu as été invité(e) à rejoindre "${householdName}" 🏠`,
    preheader: `${inviterName} t'invite à rejoindre son foyer sur WeekEat`,
    content: `
      <h2>Tu as une invitation ! 🎁</h2>
      <p>Salut ! 👋</p>
      <p><strong>${inviterName}</strong> t'invite à rejoindre le foyer <strong>"${householdName}"</strong> sur WeekEat !</p>
      <p>Avec WeekEat, tu pourras :</p>
      <ul style="margin: 16px 0; padding-left: 24px; color: #4b5563;">
        <li style="margin-bottom: 8px;">🍽️ Planifier vos repas de la semaine avec l'IA</li>
        <li style="margin-bottom: 8px;">🌿 Gérer vos préférences et bannissements d'ingrédients</li>
        <li style="margin-bottom: 8px;">🛒 Générer automatiquement des listes de courses</li>
        <li style="margin-bottom: 8px;">👥 Partager vos planifications avec les membres du foyer</li>
      </ul>
      <p>Rejoins-nous et simplifie-toi la vie ! ✨</p>
    `,
    buttonText: '🎉 Accepter l\'invitation',
    buttonLink: invitationLink,
    footerText: 'Si tu ne reconnais pas cette invitation, tu peux l\'ignorer en toute sécurité. 💛',
  })
}