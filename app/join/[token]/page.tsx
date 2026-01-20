import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { acceptInvitation } from "@/lib/actions/invitations"
import { AcceptInvitationForm } from "@/components/app/accept-invitation-form"

interface JoinPageProps {
  params: {
    token: string
  }
}

export default async function JoinPage({ params }: JoinPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/login?callbackUrl=/join/${params.token}`)
  }

  try {
    const result = await acceptInvitation(params.token)
    redirect(`/app/week`)
  } catch (error: any) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
        <Card className="w-full max-w-md border-2 border-destructive/20">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">😢</div>
            <CardTitle>Invitation invalide</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/app/week">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
}
