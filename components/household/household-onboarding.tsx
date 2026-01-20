"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { inviteToHousehold } from "@/lib/actions/invitations"
import { UserPlus, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface Household {
  id: string
  name: string
  members: Array<{
    user: {
      name: string | null
      email: string
    }
  }>
}

interface HouseholdOnboardingProps {
  household: Household
}

export function HouseholdOnboarding({ household }: HouseholdOnboardingProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitedEmails, setInvitedEmails] = useState<string[]>([])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      await inviteToHousehold(household.id, email.trim())
      setInvitedEmails([...invitedEmails, email.trim()])
      setEmail("")
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'invitation")
    } finally {
      setIsLoading(false)
    }
  }

  function handleContinue() {
    router.push(`/household/${household.id}/week`)
  }

  function handleSkip() {
    router.push(`/household/${household.id}/week`)
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Progress */}
        <div className="flex justify-center space-x-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step
                  ? "w-12 bg-primary"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Bienvenue */}
        {step === 1 && (
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="text-6xl animate-float mx-auto">🎉</div>
              <CardTitle className="text-3xl">
                Bienvenue dans {household.name} !
              </CardTitle>
              <CardDescription className="text-lg">
                Configurons votre foyer pour commencer à planifier vos repas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-cosy">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm font-medium">Invitez votre famille</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-cosy">
                  <div className="text-3xl mb-2">🍽️</div>
                  <p className="text-sm font-medium">Générez vos repas</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-cosy">
                  <div className="text-3xl mb-2">📝</div>
                  <p className="text-sm font-medium">Faites vos courses</p>
                </div>
              </div>
              <Button
                onClick={() => setStep(2)}
                size="lg"
                className="w-full mt-6 text-lg py-6 rounded-xl"
              >
                C'est parti !
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Inviter des membres */}
        {step === 2 && (
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center space-y-2 pb-6">
              <div className="text-5xl">👨‍👩‍👧‍👦</div>
              <CardTitle className="text-2xl">
                Invitez les membres de votre foyer
              </CardTitle>
              <CardDescription>
                Partagez WeekEat avec ceux avec qui vous partagez vos repas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email de la personne à inviter</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading || !email.trim()}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Inviter
                    </Button>
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
              </form>

              {invitedEmails.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Invitations envoyées :
                  </p>
                  <div className="space-y-2">
                    {invitedEmails.map((em) => (
                      <div
                        key={em}
                        className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200"
                      >
                        <span className="text-sm">{em}</span>
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Précédent
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Prêt */}
        {step === 3 && (
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="text-6xl animate-float mx-auto">✨</div>
              <CardTitle className="text-3xl">
                Tout est prêt !
              </CardTitle>
              <CardDescription className="text-lg">
                Votre foyer est configuré. Vous pouvez maintenant générer votre première
                semaine de repas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-xl bg-gradient-cosy text-center">
                <p className="text-muted-foreground">
                  🏠 <strong>{household.name}</strong>
                </p>
                {household.members.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {household.members.length} membre{household.members.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <Button
                onClick={handleContinue}
                size="lg"
                className="w-full text-lg py-6 rounded-xl"
              >
                Générer ma première semaine
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full"
              >
                Plus tard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
