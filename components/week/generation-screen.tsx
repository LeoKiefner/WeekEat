"use client"

import { useEffect, useState } from "react"
import { Sparkles, UtensilsCrossed, Leaf, ChefHat } from "lucide-react"

interface GenerationScreenProps {
  isGenerating: boolean
}

export function GenerationScreen({ isGenerating }: GenerationScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: Sparkles,
      text: "Analyse de vos préférences...",
      color: "text-amber-500",
    },
    {
      icon: Leaf,
      text: "Sélection des ingrédients de saison...",
      color: "text-green-500",
    },
    {
      icon: UtensilsCrossed,
      text: "Création de recettes savoureuses...",
      color: "text-orange-500",
    },
    {
      icon: ChefHat,
      text: "Optimisation de la vaisselle...",
      color: "text-pink-500",
    },
  ]

  useEffect(() => {
    if (!isGenerating) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [isGenerating, steps.length])

  if (!isGenerating) return null

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <div className="text-center space-y-8 px-6 max-w-md">
        {/* Animation principale */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 animate-float">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-300 via-amber-300 to-pink-300 opacity-30 blur-2xl"></div>
          </div>
          <div className="relative w-full h-full flex items-center justify-center">
            <CurrentIcon
              className={`w-16 h-16 ${steps[currentStep].color} animate-pulse-slow`}
            />
          </div>
        </div>

        {/* Texte */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">
            Création de votre semaine
          </h2>
          <p className="text-lg text-muted-foreground">
            {steps[currentStep].text}
          </p>
        </div>

        {/* Indicateur de progression */}
        <div className="flex justify-center space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === currentStep
                  ? "w-8 bg-primary"
                  : index < currentStep
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Message mignon */}
        <p className="text-sm text-muted-foreground pt-4">
          💫 L'IA prépare quelque chose de délicieux pour vous...
        </p>
      </div>
    </div>
  )
}
