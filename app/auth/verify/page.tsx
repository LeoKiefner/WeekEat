"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function VerifyPageContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <Card className="w-full max-w-md border-2 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="text-6xl animate-float">📧</div>
          <CardTitle className="text-2xl">Vérifie ta boîte mail !</CardTitle>
          <CardDescription>
            On t'a envoyé un lien de connexion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-center text-muted-foreground">
              Un email a été envoyé à <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>📬 Clique sur le lien dans l'email pour te connecter</p>
            <p>✨ Ton foyer sera créé automatiquement après la connexion</p>
            <p className="text-xs pt-2">
              Si tu ne reçois pas l'email, vérifie tes spams ou réessaye dans quelques instants.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  )
}
