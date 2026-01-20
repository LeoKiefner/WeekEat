import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"

// Configuration Resend pour NextAuth (via SMTP)
const getEmailServer = () => {
  // Si RESEND_API_KEY est défini, utiliser Resend SMTP
  if (process.env.RESEND_API_KEY) {
    return {
      host: "smtp.resend.com",
      port: 465,
      secure: true, // true pour port 465
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
    }
  }
  
  // Sinon, utiliser configuration SMTP classique
  return {
    host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: getEmailServer(),
      from: process.env.EMAIL_FROM || "noreply@weekeat.app",
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/auth/verify",
    error: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async signIn({ user, account, profile }) {
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
