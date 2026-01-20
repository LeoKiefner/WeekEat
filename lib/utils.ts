import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0) // Réinitialiser l'heure pour éviter les problèmes de comparaison
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Ajuster pour lundi (1 = lundi)
  const weekStart = new Date(d)
  weekStart.setDate(diff)
  return weekStart
}

export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  return end
}

export function parseTags(tags: string | string[]): string[] {
  if (Array.isArray(tags)) return tags
  try {
    return JSON.parse(tags || "[]")
  } catch {
    return []
  }
}

export function stringifyTags(tags: string[]): string {
  return JSON.stringify(tags)
}
