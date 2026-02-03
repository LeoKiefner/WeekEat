"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { signIn } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
}

interface Member {
  email: string
  firstName: string
}

type DietType = "vegetarian" | "vegan" | "omnivore" | "pescatarian" | null

const STORAGE_KEY = "weekeat_onboarding_data"

interface OnboardingData {
  householdName: string
  creatorEmail: string
  creatorFirstName: string
  dietType: DietType
  meatFrequency?: number // Nombre de repas avec viande par semaine (0-14, seulement si omnivore)
  allergies: string
  members: Member[]
  minDishware: boolean
  prioritizeSeasonal: boolean
  thursdayRestaurant: boolean
  batchCooking: boolean
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [householdName, setHouseholdName] = useState("")
  const [creatorEmail, setCreatorEmail] = useState("")
  const [creatorFirstName, setCreatorFirstName] = useState("")
  const [dietType, setDietType] = useState<DietType>(null)
  const [meatFrequency, setMeatFrequency] = useState<number>(7) // Par défaut : 7 repas avec viande par semaine
  const [allergies, setAllergies] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberFirstName, setNewMemberFirstName] = useState("")
  const [minDishware, setMinDishware] = useState(true)
  const [prioritizeSeasonal, setPrioritizeSeasonal] = useState(true)
  const [thursdayRestaurant, setThursdayRestaurant] = useState(false)
  const [batchCooking, setBatchCooking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")

  // Charger les données depuis localStorage au montage
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const data: OnboardingData = JSON.parse(saved)
          setHouseholdName(data.householdName || "")
          setCreatorEmail(data.creatorEmail || "")
          setCreatorFirstName(data.creatorFirstName || "")
              setDietType(data.dietType || null)
              setMeatFrequency(data.meatFrequency ?? 7)
              setAllergies(data.allergies || "")
          setMembers(data.members || [])
          setMinDishware(data.minDishware ?? true)
          setPrioritizeSeasonal(data.prioritizeSeasonal ?? true)
          setThursdayRestaurant(data.thursdayRestaurant || false)
          setBatchCooking(data.batchCooking || false)
        } catch (e) {
          console.error("Erreur chargement localStorage:", e)
        }
      }
    }
  }, [open])

  // Sauvegarder automatiquement quand les valeurs changent
  useEffect(() => {
    if (open) {
      const data: OnboardingData = {
            householdName,
            creatorEmail,
            creatorFirstName,
            dietType,
            meatFrequency,
            allergies,
            members,
        minDishware,
        prioritizeSeasonal,
        thursdayRestaurant,
        batchCooking,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdName, creatorEmail, creatorFirstName, dietType, allergies, members, minDishware, prioritizeSeasonal, thursdayRestaurant, batchCooking, open])

  // Empêcher toute fermeture de la modal (onboarding obligatoire)
  const handleOpenChange = (newOpen: boolean) => {
    // Ne jamais permettre de fermer la modal - l'onboarding est obligatoire
    // La modal se fermera uniquement après création du foyer
  }

  function addMember() {
    if (newMemberEmail.trim() && newMemberFirstName.trim()) {
      // Vérifier que l'email n'est pas déjà dans la liste
      if (!members.some(m => m.email.toLowerCase() === newMemberEmail.toLowerCase())) {
        setMembers([...members, {
          email: newMemberEmail.trim(),
          firstName: newMemberFirstName.trim(),
        }])
        setNewMemberEmail("")
        setNewMemberFirstName("")
      }
    }
  }

  function removeMember(index: number) {
    setMembers(members.filter((_, i) => i !== index))
  }

  async function handleFinish() {
    if (!householdName.trim() || !creatorEmail.trim() || !creatorFirstName.trim()) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir le nom du foyer, ton email et ton prénom",
        variant: "destructive",
      })
      return
    }

    if (!password || password.length < 6) {
      toast({
        title: "Mot de passe trop court",
        description: "Choisis un mot de passe d'au moins 6 caractères",
        variant: "destructive",
      })
      return
    }

    if (password !== passwordConfirm) {
      toast({
        title: "Mot de passe",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Construire les données à envoyer à l'API
      const payload = {
        householdName,
        creatorEmail: creatorEmail.trim(),
        creatorFirstName: creatorFirstName.trim(),
        dietType,
        meatFrequency,
        allergies,
        members,
        minDishware,
        prioritizeSeasonal,
        thursdayRestaurant,
        batchCooking,
        password,
      }

      // Sauvegarder les données (sans le mot de passe) dans localStorage
      const dataToStore: OnboardingData = {
        householdName,
        creatorEmail: creatorEmail.trim(),
        creatorFirstName: creatorFirstName.trim(),
        dietType,
        meatFrequency,
        allergies,
        members,
        minDishware,
        prioritizeSeasonal,
        thursdayRestaurant,
        batchCooking,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore))

      // Appeler l'API pour créer le compte + foyer
      const res = await fetch("/api/onboarding/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de la création du compte")
      }

      // Une fois le compte créé, se connecter directement avec email + mot de passe
      const result = await signIn("credentials", {
        email: creatorEmail.trim(),
        password,
        callbackUrl: "/app/week",
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Compte créé mais connexion impossible. Essaie depuis l'écran de connexion.")
      }

      // Nettoyer le localStorage après inscription réussie
      localStorage.removeItem(STORAGE_KEY)

      // Rediriger vers l'app après connexion réussie
      if (typeof window !== "undefined") {
        window.location.href = "/app/week"
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la préparation",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Écran 1: Nom du foyer (très simple)
  if (step === 1) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="space-y-4"
          >
            <DialogHeader>
              <div className="text-5xl text-center mb-4 animate-float">🏠</div>
              <DialogTitle className="text-2xl text-center">Créons ton foyer</DialogTitle>
              <DialogDescription className="text-center">
                On commence doucement : choisis juste un joli nom ✨
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du foyer</Label>
                <Input
                  id="name"
                  placeholder="Ex: Maison principale"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="text-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && householdName.trim()) {
                      setStep(2)
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                size="lg"
                className="w-full mt-4"
                disabled={!householdName.trim()}
              >
                Continuer
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  // Écran 2: Tes infos (email + mot de passe + prénom)
  if (step === 2) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="space-y-4"
          >
            <DialogHeader>
              <div className="text-5xl text-center mb-4">👋</div>
              <DialogTitle className="text-2xl text-center">Tes infos</DialogTitle>
              <DialogDescription className="text-center">
                Juste ce qu'il faut pour que WeekEat te reconnaisse
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="creator-email">Ton email</Label>
                <Input
                  id="creator-email"
                  type="email"
                  placeholder="ton@email.com"
                  value={creatorEmail}
                  onChange={(e) => setCreatorEmail(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Choisis un mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "text-lg",
                    password.length > 0 && password.length < 6 && "border-destructive",
                    password.length >= 6 && "border-green-500"
                  )}
                />
                {password.length > 0 && (
                  <p className={cn(
                    "text-xs",
                    password.length < 6 ? "text-destructive" : "text-green-600"
                  )}>
                    {password.length < 6 
                      ? `❌ Minimum 6 caractères (${password.length}/6)`
                      : "✅ Mot de passe valide"
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-confirm">Confirme ton mot de passe</Label>
                <Input
                  id="password-confirm"
                  type="password"
                  placeholder="Répète le mot de passe"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={cn(
                    "text-lg",
                    passwordConfirm.length > 0 && password !== passwordConfirm && "border-destructive",
                    passwordConfirm.length > 0 && password === passwordConfirm && password.length >= 6 && "border-green-500"
                  )}
                />
                {passwordConfirm.length > 0 && (
                  <p className={cn(
                    "text-xs",
                    password !== passwordConfirm ? "text-destructive" : "text-green-600"
                  )}>
                    {password !== passwordConfirm
                      ? "❌ Les mots de passe ne correspondent pas"
                      : "✅ Les mots de passe correspondent"
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="creator-firstname">Ton prénom</Label>
                <Input
                  id="creator-firstname"
                  placeholder="Ex: Léo"
                  value={creatorFirstName}
                  onChange={(e) => setCreatorFirstName(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Précédent
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1"
                  disabled={
                    !creatorEmail.trim() ||
                    !creatorFirstName.trim() ||
                    !password ||
                    password.length < 6 ||
                    !passwordConfirm ||
                    password !== passwordConfirm
                  }
                >
                  Continuer
                </Button>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  // Écran 3: Membres du foyer
  if (step === 3) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="space-y-4"
          >
            <DialogHeader>
              <div className="text-5xl text-center mb-4">👥</div>
              <DialogTitle className="text-2xl text-center">Qui mange avec toi ?</DialogTitle>
              <DialogDescription className="text-center">
                Tu peux inviter ta moitié ou tes coloc' maintenant (ou plus tard)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                <Label>Membres du foyer</Label>

              {/* Afficher le créateur */}
              {creatorEmail && creatorFirstName && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{creatorFirstName}</p>
                    <p className="text-xs text-muted-foreground">{creatorEmail}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                    Propriétaire
                  </span>
                </div>
              )}

                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={`${member.email}-${index}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{member.firstName}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <button
                        onClick={() => removeMember(index)}
                        className="p-1 hover:bg-primary/10 rounded transition-colors"
                        type="button"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Prénom"
                    value={newMemberFirstName}
                    onChange={(e) => setNewMemberFirstName(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addMember()
                      }
                    }}
                  />
                  <Input
                    type="email"
                    placeholder="email@exemple.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addMember()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addMember}
                    size="icon"
                    variant="outline"
                    disabled={!newMemberEmail.trim() || !newMemberFirstName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tu pourras ajouter des membres plus tard depuis les paramètres du foyer
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Précédent
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Continuer
                </Button>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  // Écran 4: Alimentation + allergies
  if (step === 4) {
    const dietOptions = [
      { value: "vegetarian" as DietType, emoji: "🥗", label: "Végétarien" },
      { value: "vegan" as DietType, emoji: "🌱", label: "Végétalien" },
      { value: "omnivore" as DietType, emoji: "🥩", label: "Tout" },
      { value: "pescatarian" as DietType, emoji: "🐟", label: "Pescétarien" },
    ]

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="space-y-4"
          >
            <DialogHeader>
              <div className="text-5xl text-center mb-4">🌿</div>
              <DialogTitle className="text-2xl text-center">Préférences alimentaires</DialogTitle>
              <DialogDescription className="text-center">
                On s'adapte à tes goûts (tu pourras modifier après)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                <Label>Type d'alimentation</Label>
                <div className="grid grid-cols-2 gap-2">
                  {dietOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={dietType === option.value ? "default" : "outline"}
                      className={cn(
                        "h-auto py-4 transition-all",
                        dietType === option.value && "ring-2 ring-primary ring-offset-2"
                      )}
                      onClick={() => setDietType(option.value)}
                    >
                      <div className="text-center w-full">
                        <div className="text-2xl mb-1">{option.emoji}</div>
                        <div className="text-sm font-medium">{option.label}</div>
                      </div>
                    </Button>
                  ))}
                </div>
                {dietType && (
                  <p className="text-xs text-muted-foreground text-center">
                    ✅ {dietOptions.find(o => o.value === dietType)?.label} sélectionné
                  </p>
                )}
                {dietType === "omnivore" && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="meatFrequency">Nombre de repas avec viande par semaine (sur tous tes repas)</Label>
                    <input
                      id="meatFrequency"
                      type="range"
                      min="0"
                      max="14"
                      value={meatFrequency}
                      onChange={(e) => setMeatFrequency(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 repas</span>
                      <span className="font-medium">{meatFrequency} repas avec viande / 14 repas total</span>
                      <span>14 repas</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {meatFrequency === 0 && "Aucun repas avec viande"}
                      {meatFrequency > 0 && meatFrequency <= 3 && `${meatFrequency} repas avec viande (rarement)`}
                      {meatFrequency > 3 && meatFrequency <= 7 && `${meatFrequency} repas avec viande (modérément)`}
                      {meatFrequency > 7 && meatFrequency < 14 && `${meatFrequency} repas avec viande (régulièrement)`}
                      {meatFrequency === 14 && "Tous les repas avec viande"}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Allergies ou intolérances (optionnel)</Label>
                <Input 
                  placeholder="Ex: Gluten, lactose, fruits à coque..."
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Tu pourras ajouter des ingrédients bannis plus tard
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Précédent
                </Button>
                <Button onClick={() => setStep(5)} className="flex-1">
                  Continuer
                </Button>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  // Écran 5: Contraintes avec presets
  if (step === 5) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <motion.div
            key="step-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="space-y-4"
          >
            <DialogHeader>
              <div className="text-5xl text-center mb-4">⚙️</div>
              <DialogTitle className="text-2xl text-center">Contraintes</DialogTitle>
              <DialogDescription className="text-center">
                Quelques réglages rapides pour commencer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧹</span>
                  <div>
                    <p className="font-medium">Vaisselle minimale</p>
                    <p className="text-xs text-muted-foreground">Une casserole, c'est suffisant</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={minDishware}
                  onChange={(e) => setMinDishware(e.target.checked)}
                  className="w-5 h-5" 
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌿</span>
                  <div>
                    <p className="font-medium">Saisonnalité Alsace</p>
                    <p className="text-xs text-muted-foreground">Priorité aux produits de saison</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={prioritizeSeasonal}
                  onChange={(e) => setPrioritizeSeasonal(e.target.checked)}
                  className="w-5 h-5" 
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <p className="font-medium">Jeudi soir : resto</p>
                    <p className="text-xs text-muted-foreground">Pas de repas ce jour</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={thursdayRestaurant}
                  onChange={(e) => setThursdayRestaurant(e.target.checked)}
                  className="w-5 h-5" 
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <p className="font-medium">Batch cooking</p>
                    <p className="text-xs text-muted-foreground">Préparations en avance</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={batchCooking}
                  onChange={(e) => setBatchCooking(e.target.checked)}
                  className="w-5 h-5" 
                />
              </div>
            </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Précédent
                </Button>
                <Button
                  onClick={handleFinish}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Création..." : "C'est parti !"}
                </Button>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  return null
}
