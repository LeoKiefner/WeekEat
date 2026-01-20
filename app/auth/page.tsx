"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createHouseholdAfterAuth } from "@/lib/actions/household"

const STORAGE_KEY = "weekeat_onboarding_data"

interface OnboardingData {
  householdName: string
  creatorEmail: string
  creatorFirstName: string
  dietType: string | null
  meatFrequency?: number
  allergies: string
  members: Array<{ email: string; firstName: string }>
  minDishware: boolean
  prioritizeSeasonal: boolean
  thursdayRestaurant: boolean
  batchCooking: boolean
}

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)

  useEffect(() => {
    // Charger les données d'onboarding depuis localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data: OnboardingData = JSON.parse(saved)
        setOnboardingData(data)
        setEmail(searchParams.get("email") || data.creatorEmail || "")
      } catch (e) {
        console.error("Erreur chargement localStorage:", e)
        // Si pas de données, rediriger vers onboarding
        router.push("/onboarding")
      }
    } else {
      // Si pas de données, rediriger vers onboarding
      router.push("/onboarding")
    }
  }, [searchParams, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !onboardingData) return

    setIsLoading(true)
    try {
      // Vérifier que l'email correspond à celui de l'onboarding
      if (email.trim().toLowerCase() !== onboardingData.creatorEmail.toLowerCase()) {
        toast({
          title: "Email incorrect",
          description: "L'email doit correspondre à celui renseigné dans l'onboarding",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Envoyer l'email de connexion (NextAuth créera le compte automatiquement si nécessaire)
      const result = await signIn("email", {
        email: email.trim(),
        redirect: false,
        callbackUrl: "/app/week?onboarding=complete",
      })

      if (result?.error) {
        toast({
          title: "Erreur",
          description: result.error === "EmailSignin" 
            ? "Impossible d'envoyer l'email. Vérifie ton adresse."
            : "Une erreur est survenue",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Si succès, rediriger vers la page de vérification
      router.push(`/auth/verify?email=${encodeURIComponent(email.trim())}`)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'envoi de l'email",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (!onboardingData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <Card className="w-full max-w-md border-2 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="text-6xl animate-float">📧</div>
          <CardTitle className="text-2xl">Presque terminé !</CardTitle>
          <CardDescription>
            On va t'envoyer un email pour te connecter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Ton email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Un lien de connexion sera envoyé à cette adresse
              </p>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <p className="text-sm font-medium">Récapitulatif :</p>
              <p className="text-xs text-muted-foreground">
                Foyer : <span className="font-medium">{onboardingData.householdName}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Membres : <span className="font-medium">{onboardingData.members.length + 1}</span> (toi inclus)
              </p>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? "Envoi en cours..." : "Recevoir mon lien de connexion"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
