"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Ban, X, Edit2, Save, X as XIcon } from "lucide-react"
import { inviteToHousehold } from "@/lib/actions/invitations"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
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
}

export function HouseholdView({ householdId, household }: HouseholdViewProps) {
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
  const [isEditingSettings, setIsEditingSettings] = useState(false)
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
    try {
      const res = await fetch(`/api/household/${householdId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(householdSettings),
      })

      if (res.ok) {
        setIsEditingSettings(false)
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
        {!isEditingSettings && (
          <Button variant="outline" size="sm" onClick={() => setIsEditingSettings(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        )}
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
          {isEditingSettings ? (
            <>
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
              <div className="flex gap-2">
                <Button onClick={handleSaveSettings} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingSettings(false)
                    setHouseholdSettings({
                      name: household?.name || "",
                      mealsPerWeek: household?.mealsPerWeek || 7,
                      prioritizeSeasonal: household?.prioritizeSeasonal || false,
                      minDishware: household?.minDishware || false,
                    })
                  }}
                >
                  Annuler
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom</span>
                  <span className="font-medium">{household.name}</span>
                </div>
                <div className="flex justify-between">
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repas par semaine</span>
                  <span className="font-medium">{household.mealsPerWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saisonnalité</span>
                  <span className="font-medium">
                    {household.prioritizeSeasonal ? "✅ Activée" : "❌ Désactivée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vaisselle minimale</span>
                  <span className="font-medium">
                    {household.minDishware ? "✅ Activée" : "❌ Désactivée"}
                  </span>
                </div>
              </div>
            </>
          )}
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
                {editingPreference === pref.key ? (
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
                      >
                        <Save className="h-4 w-4" />
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
                      {pref.key === "meatFrequency" ? (
                        <div className="space-y-2 mt-1">
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
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {pref.key === "diet" ? JSON.parse(pref.value || "[]").join(", ") : pref.value || "Non défini"}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {pref.key !== "meatFrequency" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPreference(pref.key)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {pref.key !== "diet" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeletePreferenceDialog(pref.key)}
                        >
                          <XIcon className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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
    </div>
  )
}
