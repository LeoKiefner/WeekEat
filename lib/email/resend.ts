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
  const html = getHouseholdInvitationTemplate(inviterName, householdName, invitationLink)

  return sendEmail({
    to,
    subject: `🎁 ${inviterName} t'invite à rejoindre "${householdName}" sur WeekEat`,
    html,
  })
}
