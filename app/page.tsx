import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/app/week")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-6">
          <div className="text-8xl animate-float">🍽️</div>
          <h1 className="text-6xl font-bold text-foreground">WeekEat</h1>
          <p className="text-2xl text-muted-foreground">
            Vos repas de la semaine, créés avec ❤️ par l'IA
          </p>
        </div>

        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <CardTitle className="text-3xl">✨ Bienvenue !</CardTitle>
            <CardDescription className="text-lg">
              Créez votre foyer et découvrez la planification de repas simplifiée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 rounded-xl bg-gradient-cosy">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span>✨</span> Fonctionnalités
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span>🤖</span>
                    <span>Génération automatique avec IA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🚫</span>
                    <span>Respect des préférences et bannissements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🔄</span>
                    <span>Variété garantie (pas de doublon sur 30 jours)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🌿</span>
                    <span>Saisonnalité Alsace</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🧹</span>
                    <span>Optimisation vaisselle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>💰</span>
                    <span>Estimation de coût</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-gradient-cosy">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span>👨‍👩‍👧‍👦</span> Pour foyers
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span>👥</span>
                    <span>Plusieurs membres par foyer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>💝</span>
                    <span>Préférences partagées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>📧</span>
                    <span>Invitations par email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🧠</span>
                    <span>Apprentissage progressif</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-xl">
                <Link href="/onboarding">Commencer l'aventure 🚀</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
