import { Resend } from "resend"
import { getHouseholdInvitationTemplate } from "./templates"

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
    const errorMsg = "Resend n'est pas configuré. Définissez RESEND_API_KEY dans .env"
    console.error("[EMAIL] ❌", errorMsg)
    throw new Error(errorMsg)
  }

  const fromEmail = from || process.env.EMAIL_FROM || "noreply@weekeat.app"
  const toEmails = Array.isArray(to) ? to : [to]

  console.log(`[EMAIL] Envoi d'email à: ${toEmails.join(", ")}`)
  console.log(`[EMAIL] Depuis: ${fromEmail}`)
  console.log(`[EMAIL] Sujet: ${subject}`)
  console.log(`[EMAIL] RESEND_API_KEY configuré: ${!!process.env.RESEND_API_KEY}`)
  console.log(`[EMAIL] EMAIL_FROM configuré: ${!!process.env.EMAIL_FROM}`)

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmails,
      subject,
      html,
    })

    if (error) {
      console.error("[EMAIL] ❌ Erreur Resend:", error)
      console.error("[EMAIL] Détails:", JSON.stringify(error, null, 2))
      throw new Error(`Erreur envoi email: ${error.message || "Erreur inconnue"}`)
    }

    console.log(`[EMAIL] ✅ Email envoyé avec succès. ID: ${data?.id || "N/A"}`)
    return data
  } catch (error: any) {
    console.error("[EMAIL] ❌ Erreur lors de l'envoi d'email:", error)
    console.error("[EMAIL] Type d'erreur:", error?.constructor?.name)
    console.error("[EMAIL] Message:", error?.message)
    if (error?.response) {
      console.error("[EMAIL] Réponse Resend:", JSON.stringify(error.response, null, 2))
    }
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
  const html = getHouseholdInvitationTemplate(inviterName, householdName, invitationLink)

  return sendEmail({
    to,
    subject: `🎁 ${inviterName} t'invite à rejoindre "${householdName}" sur WeekEat`,
    html,
  })
}
