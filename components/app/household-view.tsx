"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Ban, X, Edit2, Save, X as XIcon, LogOut, DoorOpen, Mail, RefreshCw, Loader2 } from "lucide-react"
import { inviteToHousehold } from "@/lib/actions/invitations"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type DietType = "vegetarian" | "vegan" | "omnivore" | "pescatarian"

interface HouseholdViewProps {
  householdId: string
  household: {
    id: string
    name: string
    mealsPerWeek: number
    prioritizeSeasonal: boolean
    minDishware: boolean
    members: Array<{
      id: string
      user: {
        id: string
        name: string | null
        email: string
      }
    }>
    bannedIngredients: Array<{
      id: string
      ingredient: {
        id: string
        name: string
      }
      reason: string | null
      bannedAt: Date
    }>
    preferences: Array<{
      id: string
      key: string
      value: string
    }>
  } | null
  userId: string
  userRole: string
  invitations?: Array<{
    id: string
    email: string
    token: string
    expiresAt: Date
    acceptedAt: Date | null
    createdAt: Date
  }>
}

export function HouseholdView({ householdId, household, userId, userRole, invitations = [] }: HouseholdViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [editingPreference, setEditingPreference] = useState<string | null>(null)
  const [preferenceValues, setPreferenceValues] = useState<Record<string, string>>({})
  const [householdSettings, setHouseholdSettings] = useState({
    name: household?.name || "",
    mealsPerWeek: household?.mealsPerWeek || 7,
    prioritizeSeasonal: household?.prioritizeSeasonal || false,
    minDishware: household?.minDishware || false,
  })
  const [unbanDialog, setUnbanDialog] = useState<{ open: boolean; ingredientId: string | null; ingredientName: string }>({
    open: false,
    ingredientId: null,
    ingredientName: "",
  })
  const [deletePreferenceDialog, setDeletePreferenceDialog] = useState<{ open: boolean; key: string | null }>({
    open: false,
    key: null,
  })
  const [addPreferenceDialog, setAddPreferenceDialog] = useState<{ open: boolean; key: string }>({
    open: false,
    key: "",
  })
  const [leaveHouseholdDialog, setLeaveHouseholdDialog] = useState(false)
  const [logoutDialog, setLogoutDialog] = useState(false)
  const [resendingInvitation, setResendingInvitation] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingPreference, setSavingPreference] = useState<string | null>(null)

  useEffect(() => {
    // Initialiser les valeurs des préférences
    if (!household) return
    const prefs: Record<string, string> = {}
    household.preferences.forEach((pref) => {
      prefs[pref.key] = pref.value
    })
    setPreferenceValues(prefs)
  }, [household?.preferences])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      await inviteToHousehold(householdId, email.trim())
      setEmail("")
      toast({
        title: "Invitation envoyée ! ✉️",
        variant: "success",
      })
      router.refresh()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function openUnbanDialog(ingredientId: string, ingredientName: string) {
    setUnbanDialog({ open: true, ingredientId, ingredientName })
  }

  async function handleUnban() {
    if (!unbanDialog.ingredientId) return

    try {
      const res = await fetch(`/api/household/${householdId}/unban-ingredient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientId: unbanDialog.ingredientId }),
      })

      if (res.ok) {
        toast({
          title: "Ingrédient autorisé",
          description: `${unbanDialog.ingredientName} peut maintenant être utilisé.`,
          variant: "success",
        })
        setUnbanDialog({ open: false, ingredientId: null, ingredientName: "" })
        router.refresh()
      } else {
        const data = await res.json()
        toast({
          title: "Erreur",
          description: data.error || "Une erreur est survenue",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Erreur lors du débannissement",
        variant: "destructive",
      })
    }
  }

  async function handleSavePreference(key: string, customValue?: string) {
    setSavingPreference(key)
    try {
      const value = customValue || preferenceValues[key] || ""
      const res = await fetch(`/api/household/${householdId}/preference`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      })

      if (res.ok) {
        setEditingPreference(null)
        toast({
          title: "Préférence sauvegardée",
          variant: "success",
        })
        router.refresh()
      } else {
        const data = await res.json()
        toast({
          title: "Erreur",
          description: data.error || "Une erreur est survenue",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde",
        variant: "destructive",
      })
    } finally {
      setSavingPreference(null)
    }
  }

  function openDeletePreferenceDialog(key: string) {
    setDeletePreferenceDialog({ open: true, key })
  }

  async function handleDeletePreference() {
    if (!deletePreferenceDialog.key) return

    try {
      const res = await fetch(`/api/household/${householdId}/preference?key=${deletePreferenceDialog.key}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "Préférence supprimée",
          variant: "success",
        })
        setDeletePreferenceDialog({ open: false, key: null })
        router.refresh()
      } else {
        const data = await res.json()
        toast({
          title: "Erreur",
          description: data.error || "Une erreur est survenue",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      })
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/household/${householdId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(householdSettings),
      })

      if (res.ok) {
        toast({
          title: "Paramètres sauvegardés",
          variant: "success",
        })
        router.refresh()
      } else {
        const data = await res.json()
        toast({
          title: "Erreur",
          description: data.error || "Une erreur est survenue",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde",
        variant: "destructive",
      })
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleLeaveHousehold() {
    try {
      const res = await fetch(`/api/household/${householdId}/leave`, {
        method: "POST",
      })

      if (res.ok) {
        toast({
          title: "Tu as quitté le foyer",
          variant: "success",
        })
        router.push("/onboarding")
      } else {
        const data = await res.json()
        toast({
          title: "Erreur",
          description: data.error || "Une erreur est survenue",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sortie du foyer",
        variant: "destructive",
      })
    }
  }

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" })
  }

  async function handleResendInvitation(invitationEmail: string) {
    setResendingInvitation(invitationEmail)
    try {
      await inviteToHousehold(householdId, invitationEmail)
      toast({
        title: "Invitation renvoyée ! ✉️",
        description: `Un nouvel email a été envoyé à ${invitationEmail}`,
        variant: "success",
      })
      router.refresh()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue lors du renvoi de l'invitation",
        variant: "destructive",
      })
    } finally {
      setResendingInvitation(null)
    }
  }

  const getPreferenceLabel = (key: string) => {
    const labels: Record<string, string> = {
      diet: "Type d'alimentation",
      meatFrequency: "Repas avec viande par semaine",
      allergies: "Allergies",
      objectives: "Objectifs",
      timeConstraints: "Contraintes de temps",
    }
    return labels[key] || key
  }

  if (!household) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mon foyer</h1>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mon foyer</h1>
      </div>

      {/* Section Membres */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>👥</span> Membres
          </CardTitle>
          <CardDescription>
            Invite les personnes avec qui tu partages tes repas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {household.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg bg-primary/5"
              >
                <div>
                  <p className="font-medium">{member.user.name || member.user.email}</p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
            ))}
            {/* Affichage des invitations en attente */}
            {invitations
              .filter((inv) => !inv.acceptedAt && new Date(inv.expiresAt) > new Date())
              .map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-amber-600" />
                      <p className="font-medium text-sm">{invitation.email}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Invitation envoyée le {new Date(invitation.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResendInvitation(invitation.email)}
                    disabled={resendingInvitation === invitation.email}
                  >
                    {resendingInvitation === invitation.email ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renvoyer
                      </>
                    )}
                  </Button>
                </div>
              ))}
          </div>
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Section Paramètres */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚙️</span> Paramètres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du foyer</Label>
              <Input
                id="name"
                value={householdSettings.name}
                onChange={(e) =>
                  setHouseholdSettings({ ...householdSettings, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mealsPerWeek">Nombre de repas par semaine</Label>
              <Input
                id="mealsPerWeek"
                type="number"
                min="1"
                max="21"
                value={householdSettings.mealsPerWeek}
                onChange={(e) =>
                  setHouseholdSettings({
                    ...householdSettings,
                    mealsPerWeek: parseInt(e.target.value) || 7,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-primary/10">
              <div>
                <Label htmlFor="seasonal">Saisonnalité Alsace</Label>
                <p className="text-xs text-muted-foreground">
                  Priorité aux produits de saison
                </p>
              </div>
              <input
                id="seasonal"
                type="checkbox"
                checked={householdSettings.prioritizeSeasonal}
                onChange={(e) =>
                  setHouseholdSettings({
                    ...householdSettings,
                    prioritizeSeasonal: e.target.checked,
                  })
                }
                className="w-5 h-5"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-primary/10">
              <div>
                <Label htmlFor="dishware">Vaisselle minimale</Label>
                <p className="text-xs text-muted-foreground">
                  Optimiser pour réduire la vaisselle
                </p>
              </div>
              <input
                id="dishware"
                type="checkbox"
                checked={householdSettings.minDishware}
                onChange={(e) =>
                  setHouseholdSettings({
                    ...householdSettings,
                    minDishware: e.target.checked,
                  })
                }
                className="w-5 h-5"
              />
            </div>
            <Button onClick={handleSaveSettings} className="w-full" disabled={savingSettings}>
              {savingSettings ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les paramètres
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section Préférences */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🌿</span> Préférences
          </CardTitle>
          <CardDescription>
            Type d'alimentation, allergies, objectifs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {household.preferences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune préférence définie
            </p>
          ) : (
            household.preferences.map((pref) => (
              <div
                key={pref.id}
                className="p-3 rounded-lg border border-primary/10 bg-primary/5"
              >
                {pref.key === "diet" ? (
                  <div className="space-y-3">
                    <Label>{getPreferenceLabel(pref.key)}</Label>
                    {editingPreference === pref.key ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: "vegetarian" as DietType, emoji: "🥗", label: "Végétarien" },
                            { value: "vegan" as DietType, emoji: "🌱", label: "Végétalien" },
                            { value: "omnivore" as DietType, emoji: "🥩", label: "Tout" },
                            { value: "pescatarian" as DietType, emoji: "🐟", label: "Pescétarien" },
                          ].map((option) => {
                            const currentDiet = JSON.parse(preferenceValues[pref.key] || "[]")[0] || ""
                            return (
                              <Button
                                key={option.value}
                                type="button"
                                variant={currentDiet === option.value ? "default" : "outline"}
                                className={cn(
                                  "h-auto py-4 transition-all",
                                  currentDiet === option.value && "ring-2 ring-primary ring-offset-2"
                                )}
                                onClick={() => {
                                  setPreferenceValues({
                                    ...preferenceValues,
                                    [pref.key]: JSON.stringify([option.value]),
                                  })
                                }}
                              >
                                <div className="text-center w-full">
                                  <div className="text-2xl mb-1">{option.emoji}</div>
                                  <div className="text-sm font-medium">{option.label}</div>
                                </div>
                              </Button>
                            )
                          })}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleSavePreference(pref.key)}
                            disabled={savingPreference === pref.key}
                          >
                            {savingPreference === pref.key ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enregistrement...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Enregistrer
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingPreference(null)
                              // Restaurer la valeur originale
                              const originalValue = household?.preferences.find(p => p.key === pref.key)?.value || ""
                              setPreferenceValues({
                                ...preferenceValues,
                                [pref.key]: originalValue,
                              })
                            }}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const dietArray = JSON.parse(pref.value || "[]")
                              const dietLabels: Record<string, string> = {
                                vegetarian: "🥗 Végétarien",
                                vegan: "🌱 Végétalien",
                                omnivore: "🥩 Tout",
                                pescatarian: "🐟 Pescétarien",
                              }
                              return dietArray.map((d: string) => dietLabels[d] || d).join(", ") || "Non défini"
                            })()}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingPreference(pref.key)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : pref.key === "meatFrequency" ? (
                  <div className="space-y-3">
                    <Label>{getPreferenceLabel(pref.key)}</Label>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {pref.value ? `${JSON.parse(pref.value)} repas avec viande / 14 repas total` : "Non défini"}
                      </p>
                      {pref.value && (
                        <>
                          <input
                            type="range"
                            min="0"
                            max="14"
                            value={JSON.parse(pref.value)}
                            onChange={(e) => {
                              const newValue = Number(e.target.value)
                              setPreferenceValues({
                                ...preferenceValues,
                                [pref.key]: JSON.stringify(newValue),
                              })
                            }}
                            onMouseUp={(e) => {
                              const newValue = Number((e.target as HTMLInputElement).value)
                              handleSavePreference(pref.key, JSON.stringify(newValue))
                            }}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0 repas</span>
                            <span className="font-medium">{JSON.parse(pref.value)} repas avec viande</span>
                            <span>14 repas</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : editingPreference === pref.key ? (
                  <div className="space-y-2">
                    <Label>{getPreferenceLabel(pref.key)}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={preferenceValues[pref.key] || ""}
                        onChange={(e) =>
                          setPreferenceValues({
                            ...preferenceValues,
                            [pref.key]: e.target.value,
                          })
                        }
                        className="flex-1"
                        placeholder="Valeur..."
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSavePreference(pref.key)}
                        disabled={savingPreference === pref.key}
                      >
                        {savingPreference === pref.key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPreference(null)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{getPreferenceLabel(pref.key)}</p>
                      <p className="text-sm text-muted-foreground">
                        {pref.value || "Non défini"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPreference(pref.key)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeletePreferenceDialog(pref.key)}
                      >
                        <XIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setAddPreferenceDialog({ open: true, key: "" })}
          >
            + Ajouter une préférence
          </Button>
        </CardContent>
      </Card>

      {/* Section Ingrédients interdits */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Ingrédients interdits
          </CardTitle>
          <CardDescription>
            Ces ingrédients ne seront jamais proposés dans tes repas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {household.bannedIngredients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun ingrédient banni
            </p>
          ) : (
            <div className="space-y-2">
              {household.bannedIngredients.map((banned) => (
                <div
                  key={banned.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div className="flex-1">
                    <p className="font-medium">{banned.ingredient.name}</p>
                    {banned.reason && (
                      <p className="text-xs text-muted-foreground">{banned.reason}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      openUnbanDialog(banned.ingredient.id, banned.ingredient.name)
                    }
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation pour débannir un ingrédient */}
      <AlertDialog open={unbanDialog.open} onOpenChange={(open) => setUnbanDialog({ ...unbanDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Autoriser cet ingrédient ?</AlertDialogTitle>
            <AlertDialogDescription>
              {unbanDialog.ingredientName} pourra à nouveau être proposé dans les repas de ce foyer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnban}>Autoriser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation pour supprimer une préférence */}
      <AlertDialog open={deletePreferenceDialog.open} onOpenChange={(open) => setDeletePreferenceDialog({ ...deletePreferenceDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette préférence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La préférence sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreference}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog pour ajouter une préférence */}
      <AlertDialog open={addPreferenceDialog.open} onOpenChange={(open) => setAddPreferenceDialog({ ...addPreferenceDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter une préférence</AlertDialogTitle>
            <AlertDialogDescription>
              Clé de la préférence (diet, allergies, objectives, etc.)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ex: diet, allergies..."
              value={addPreferenceDialog.key}
              onChange={(e) => setAddPreferenceDialog({ ...addPreferenceDialog, key: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && addPreferenceDialog.key.trim()) {
                  setPreferenceValues({ ...preferenceValues, [addPreferenceDialog.key.trim()]: "" })
                  setEditingPreference(addPreferenceDialog.key.trim())
                  setAddPreferenceDialog({ open: false, key: "" })
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (addPreferenceDialog.key.trim()) {
                  setPreferenceValues({ ...preferenceValues, [addPreferenceDialog.key.trim()]: "" })
                  setEditingPreference(addPreferenceDialog.key.trim())
                  setAddPreferenceDialog({ open: false, key: "" })
                }
              }}
              disabled={!addPreferenceDialog.key.trim()}
            >
              Ajouter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section Actions du foyer */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚙️</span> Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setLeaveHouseholdDialog(true)}
          >
            <DoorOpen className="h-4 w-4 mr-2" />
            Quitter le foyer
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setLogoutDialog(true)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de confirmation pour quitter le foyer */}
      <AlertDialog open={leaveHouseholdDialog} onOpenChange={setLeaveHouseholdDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter le foyer ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu ne pourras plus accéder aux repas et listes de courses de ce foyer. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveHousehold} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Quitter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation pour déconnexion */}
      <AlertDialog open={logoutDialog} onOpenChange={setLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Se déconnecter ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu devras te reconnecter pour accéder à nouveau à ton compte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Se déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
