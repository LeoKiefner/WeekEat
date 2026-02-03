import { prisma } from "@/lib/prisma"
import { JoinInviteForm } from "@/components/app/join-invite-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface JoinPageProps {
  params: {
    token: string
  }
}

export default async function JoinPage({ params }: JoinPageProps) {
  try {
    const invitation = await prisma.householdInvitation.findUnique({
      where: { token: params.token },
      include: {
        household: true,
      },
    })

    if (!invitation) {
      throw new Error("Invitation invalide ou expirée")
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error("Cette invitation a expiré")
    }

    return (
      <JoinInviteForm
        token={params.token}
        email={invitation.email}
        householdName={invitation.household.name}
      />
    )
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
