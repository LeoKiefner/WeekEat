"use client"

import { useFormState, useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CreateHouseholdFormProps {
  onSubmit: (formData: FormData) => Promise<void>
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Création..." : "Créer le foyer"}
    </Button>
  )
}

export function CreateHouseholdForm({ onSubmit }: CreateHouseholdFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau foyer</CardTitle>
        <CardDescription>
          Un foyer regroupe plusieurs personnes partageant leurs repas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du foyer</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Maison principale"
              required
            />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
