"use client"

import { OnboardingModal } from "@/components/app/onboarding-modal"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"

export default function OnboardingPage() {
  const [isOpen, setIsOpen] = useState(true)
  const [linkTop, setLinkTop] = useState('calc(50% + 400px)')
  const [mounted, setMounted] = useState(false)
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Observer les changements de hauteur de la modal pour ajuster la position du lien
    const updateLinkPosition = () => {
      const modal = document.querySelector('[role="dialog"]')
      if (modal) {
        const rect = modal.getBoundingClientRect()
        const newTop = rect.bottom + 40 // 40px de marge sous la modal
        setLinkTop(`${newTop}px`)
      }
    }

    const interval = setInterval(updateLinkPosition, 100)
    updateLinkPosition()

    // Désactiver complètement l'overlay pour permettre les clics
    const disableOverlay = () => {
      const overlay = document.querySelector('[data-radix-dialog-overlay]') as HTMLElement
      if (overlay) {
        overlay.style.pointerEvents = 'none'
      }
    }

    // Désactiver l'overlay toutes les 50ms
    const overlayInterval = setInterval(disableOverlay, 50)

    return () => {
      clearInterval(interval)
      clearInterval(overlayInterval)
    }
  }, [mounted])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Forcer la navigation en désactivant complètement l'overlay
    const overlay = document.querySelector('[data-radix-dialog-overlay]') as HTMLElement
    if (overlay) {
      overlay.style.pointerEvents = 'none'
      overlay.style.display = 'none'
    }
    // Le navigateur gérera la navigation via href
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex flex-col items-center justify-center p-8 relative">
        <OnboardingModal 
          open={isOpen} 
          onClose={() => setIsOpen(false)} 
        />
      </div>
      {mounted && createPortal(
        <a
          ref={linkRef}
          href="/login"
          className="fixed left-1/2 -translate-x-1/2 text-center text-sm text-muted-foreground hover:text-primary underline transition-colors cursor-pointer bg-transparent"
          style={{ 
            top: linkTop,
            zIndex: 99999,
            pointerEvents: 'auto',
            position: 'fixed'
          }}
          onClick={handleClick}
          onMouseEnter={() => {
            // Désactiver l'overlay au survol
            const overlay = document.querySelector('[data-radix-dialog-overlay]') as HTMLElement
            if (overlay) {
              overlay.style.pointerEvents = 'none'
            }
          }}
        >
          Déjà un compte ? Se connecter
        </a>,
        document.body
      )}
    </>
  )
}
