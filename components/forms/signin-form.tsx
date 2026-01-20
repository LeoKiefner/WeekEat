"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("email", {
        email,
        callbackUrl: "/app/week",
        redirect: false,
      })
      
      if (result?.error) {
        setError("Erreur lors de l'envoi de l'email. Vérifiez votre configuration email.")
        console.error("Sign in error:", result.error)
      } else {
        setEmailSent(true)
      }
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl: "/app/week" })
  }

  if (emailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email envoyé</CardTitle>
          <CardDescription>
            Vérifiez votre boîte mail et cliquez sur le lien de connexion.
            {!process.env.NEXT_PUBLIC_EMAIL_CONFIGURED && (
              <span className="block mt-2 text-orange-600 text-xs">
                ⚠️ Email non configuré. Vérifiez votre configuration dans .env
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Entrez votre email pour recevoir un lien de connexion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
              <div className="mt-2 text-xs text-muted-foreground">
                Pour configurer l'email, voir TEST_AUTH.md
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Envoi..." : "Recevoir le lien de connexion"}
          </Button>

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                Se connecter avec Google
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
