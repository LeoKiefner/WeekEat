import { Resend } from "resend"

let resend: Resend | null = null

// Initialiser Resend seulement si la clé API est disponible
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY)
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  if (!resend) {
    throw new Error("Resend n'est pas configuré. Définissez RESEND_API_KEY dans .env")
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || process.env.EMAIL_FROM || "noreply@weekeat.app",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error("Erreur Resend:", error)
      throw new Error(`Erreur envoi email: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error("Erreur envoi email:", error)
    throw error
  }
}

export async function sendHouseholdInvitation({
  to,
  inviterName,
  householdName,
  invitationLink,
}: {
  to: string
  inviterName: string
  householdName: string
  invitationLink: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation au foyer ${householdName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">WeekEat</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Invitation au foyer "${householdName}"</h2>
          
          <p>Bonjour,</p>
          
          <p><strong>${inviterName}</strong> vous invite à rejoindre le foyer <strong>"${householdName}"</strong> sur WeekEat.</p>
          
          <p>Avec WeekEat, vous pourrez :</p>
          <ul style="color: #4b5563;">
            <li>Planifier vos repas de la semaine avec l'IA</li>
            <li>Gérer vos préférences et bannissements d'ingrédients</li>
            <li>Générer automatiquement des listes de courses</li>
            <li>Partager vos planifications avec les membres du foyer</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Accepter l'invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
            <a href="${invitationLink}" style="color: #667eea; word-break: break-all;">${invitationLink}</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            Cet email a été envoyé depuis WeekEat. Si vous n'avez pas demandé cette invitation, vous pouvez l'ignorer.
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject: `${inviterName} vous invite à rejoindre "${householdName}" sur WeekEat`,
    html,
  })
}
