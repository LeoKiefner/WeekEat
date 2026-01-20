"use client"

import { Loader2 } from "lucide-react"

interface LoadingOverlayProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingOverlay({ message, fullScreen = false }: LoadingOverlayProps) {
  const containerClass = fullScreen
    ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
    : "absolute inset-0 z-10 bg-background/60 backdrop-blur-sm rounded-lg"

  return (
    <div className={`${containerClass} flex items-center justify-center`}>
      <div className="text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}
