"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GenerationScreen } from "./generation-screen"

interface GenerationClientProps {
  householdId: string
}

export function GenerationClient({ householdId }: GenerationClientProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function generate() {
      try {
        setIsGenerating(true)
        console.log("[GenerationClient] Début génération pour householdId:", householdId)
        
        // Appeler l'action serveur via API
        const response = await fetch(`/api/generate-meal-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ householdId }),
        })

        console.log("[GenerationClient] Réponse reçue, status:", response.status)

        if (!response.ok) {
          const data = await response.json()
          console.error("[GenerationClient] Erreur API:", data)
          throw new Error(data.error || "Erreur lors de la génération")
        }
        
        const result = await response.json()
        console.log("[GenerationClient] Génération réussie:", result)
        console.log(`[GenerationClient] ${result.mealsCount || 0} repas créés`)
        
        if (!result.success) {
          throw new Error("La génération n'a pas retourné de succès")
        }
        
        // Attendre un peu pour montrer le succès
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        console.log("[GenerationClient] Redirection vers /app/week")
        // Forcer le rechargement complet de la page pour voir les nouvelles données
        window.location.href = '/app/week'
      } catch (err: any) {
        console.error("[GenerationClient] Erreur génération:", err)
        setError(err.message || "Une erreur est survenue")
        setIsGenerating(false)
      }
    }

    if (householdId) {
      generate()
    } else {
      console.error("[GenerationClient] Pas de householdId fourni")
      setError("Aucun foyer trouvé")
      setIsGenerating(false)
    }
  }, [householdId, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">😢</div>
          <h2 className="text-2xl font-bold text-foreground">Oups !</h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push(`/app/week`)}
            className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return <GenerationScreen isGenerating={isGenerating} />
}
