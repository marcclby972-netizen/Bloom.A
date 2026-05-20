"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "solo" | "equipe"
}

const colors = [
  { name: "Orange", value: "#F97316" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Purple", value: "#A855F7" },
  { name: "Pink", value: "#EC4899" },
  { name: "Cyan", value: "#06B6D4" },
]

export function ProjectModal({ isOpen, onClose, mode }: ProjectModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedColor, setSelectedColor] = useState(colors[0].value)
  const [projectMode, setProjectMode] = useState<"solo" | "equipe">(mode)
  const [deadline, setDeadline] = useState("")

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically save the project
    console.log({ name, description, selectedColor, projectMode, deadline })
    onClose()
    // Reset form
    setName("")
    setDescription("")
    setSelectedColor(colors[0].value)
    setDeadline("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Nouveau projet</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="hover:bg-secondary"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Nom du projet</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Refonte site web"
              className="bg-secondary border-border focus:ring-primary"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre projet..."
              className="bg-secondary border-border focus:ring-primary resize-none"
              rows={3}
            />
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <Label className="text-foreground">Mode</Label>
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                type="button"
                onClick={() => setProjectMode("solo")}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  projectMode === "solo"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Solo
              </button>
              <button
                type="button"
                onClick={() => setProjectMode("equipe")}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  projectMode === "equipe"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Équipe
              </button>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-foreground">Couleur</Label>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform",
                    selectedColor === color.value && "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110"
                  )}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-foreground">Date limite</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-secondary border-border focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-border hover:bg-secondary"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-primary hover:bg-orange-muted text-primary-foreground"
            >
              Créer le projet
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
