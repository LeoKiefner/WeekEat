"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface HistoryViewProps {
  householdId: string
}

export function HistoryView({ householdId }: HistoryViewProps) {
  // TODO: Récupérer les repas des 30 derniers jours depuis la DB

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Historique</h1>
        <p className="text-muted-foreground">
          Les repas des 30 derniers jours pour éviter les répétitions
        </p>
      </div>

      {/* Calendrier 30 jours */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📅</span> Derniers 30 jours
          </CardTitle>
          <CardDescription>
            Les repas que tu as déjà mangés (pour respecter la variété)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Historique (à implémenter avec calendrier des repas des 30 derniers jours)
          </div>
        </CardContent>
      </Card>

      {/* Top repas du foyer */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⭐</span> Top repas du foyer
          </CardTitle>
          <CardDescription>
            Les repas les plus appréciés, que tu peux refaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Top repas (basé sur les likes - à implémenter)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
