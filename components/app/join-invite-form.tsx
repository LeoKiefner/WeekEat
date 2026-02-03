"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"

interface JoinInviteFormProps {
  token: string
  email: string
  householdName: string
}

export function JoinInviteForm({ token, email, householdName }: JoinInviteFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!password || password.length < 6) {
      setError("Mot de passe trop court (6 caractères minimum)")
      return
    }

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    setIsLoading(true)

    try {
      // Compléter l'invitation (création / mise à jour utilisateur + ajout au foyer)
      const res = await fetch("/api/join/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'acceptation de l'invitation")
      }

      // Se connecter immédiatement avec email + mot de passe
      const result = await signIn("credentials", {
        email: data.email || email,
        password,
        callbackUrl: "/app/week",
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Invitation acceptée, mais connexion impossible. Essaie depuis l'écran de connexion.")
      }

      if (result?.url) {
        router.push(result.url)
      } else {
        router.push("/app/week")
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <Card className="w-full max-w-md border-2 border-primary/20">
        <CardHeader className="text-center space-y-3">
          <div className="text-6xl animate-float">🎉</div>
          <CardTitle className="text-2xl">Rejoindre un foyer</CardTitle>
          <CardDescription>
            Tu as été invité à rejoindre <span className="font-semibold">"{householdName}"</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled />
              <p className="text-xs text-muted-foreground">
                Cet email a reçu l'invitation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Choisis un mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirme ton mot de passe</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Validation en cours..." : "Rejoindre le foyer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

