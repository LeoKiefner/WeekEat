import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SignInForm } from "@/components/forms/signin-form"
import Link from "next/link"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string }
}) {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/app/week")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-4">
          <div className="text-7xl animate-float">🍽️</div>
          <h1 className="text-4xl font-bold">WeekEat</h1>
          <p className="text-muted-foreground">
            On te simplifie la vie
          </p>
        </div>
        {searchParams?.error && (
          <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              ⚠️ Erreur de connexion : {searchParams.error}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Vérifiez que le lien que vous avez cliqué n'a pas expiré. 
              Si le problème persiste, demandez un nouveau lien de connexion.
            </p>
          </div>
        )}
        <SignInForm />
        <div className="text-center mt-6">
          <Link 
            href="/onboarding" 
            className="text-sm text-muted-foreground hover:text-primary underline transition-colors"
          >
            Pas encore de compte ? Créer un foyer
          </Link>
        </div>
      </div>
    </div>
  )
}
