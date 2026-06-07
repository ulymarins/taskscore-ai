"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { type AiModelOption, type ExistingVote } from "@/types"

const SCORES = [1, 2, 3, 4, 5] as const
type ScoreType = (typeof SCORES)[number]

const SCORE_LABELS: Record<ScoreType, { label: string; hint: string }> = {
  1: { label: "Failing",      hint: "Cannot complete the task reliably — output needs full reconstruction." },
  2: { label: "Marginal",     hint: "Produces a rough scaffold; material errors require substantial expert correction." },
  3: { label: "Functional",   hint: "Completes the task under clear conditions; domain review and edits required before use." },
  4: { label: "Proficient",   hint: "Consistently accurate output; spot-check recommended, minor adjustments only." },
  5: { label: "Expert-grade", hint: "Meets or exceeds expert baseline; ready for production with standard QA." },
}

interface VoteFormProps {
  taskId: string
  models: AiModelOption[]
  isAuthenticated: boolean
  existingVote: ExistingVote | null
}

export function VoteForm({ taskId, models, isAuthenticated, existingVote }: VoteFormProps) {
  const router = useRouter()
  const [score, setScore] = useState<ScoreType | null>((existingVote?.score as ScoreType) ?? null)
  const [modelId, setModelId] = useState<string>(existingVote?.aiModelId ?? "")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 text-center space-y-4">
        <p className="text-sm text-zinc-400">Sign in to submit your readiness rating.</p>
        <Button asChild variant="outline" className="border-zinc-700 text-zinc-300 hover:text-zinc-100">
          <a href="/auth/login">Sign in with GitHub or Google</a>
        </Button>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!score || !modelId) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          score,
          aiModelId: modelId,
          notes: notes.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Failed to submit. Please try again.")
        return
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Score selector */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-zinc-500">Readiness Score</Label>
        <div className="flex gap-1.5">
          {SCORES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScore(s)}
              className={cn(
                "flex-1 rounded-md border py-2.5 font-mono text-sm font-bold transition-all",
                score === s
                  ? "border-zinc-400 bg-zinc-800 text-zinc-100"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              )}
              title={SCORE_LABELS[s].label}
            >
              {s}
            </button>
          ))}
        </div>
        {score !== null && (
          <div className="space-y-0.5">
            <p className="font-mono text-xs font-medium text-zinc-300">
              {score} — {SCORE_LABELS[score].label}
            </p>
            <p className="text-xs text-zinc-600">{SCORE_LABELS[score].hint}</p>
          </div>
        )}
      </div>

      {/* Model selector */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-zinc-500">AI Model Used</Label>
        <Select value={modelId} onValueChange={setModelId}>
          <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-300">
            <SelectValue placeholder="Select model..." />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-900">
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id} className="focus:bg-zinc-800">
                <span className="font-mono text-sm text-zinc-200">{model.name}</span>
                <span className="ml-2 text-xs text-zinc-500">{model.provider}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Optional notes */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-zinc-500">
          Notes <span className="normal-case text-zinc-700">(optional)</span>
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe your testing conditions, edge cases, or observations..."
          className="resize-none border-zinc-800 bg-zinc-900 text-sm text-zinc-300 placeholder:text-zinc-700 focus-visible:ring-zinc-700"
          rows={3}
          maxLength={500}
        />
        <p className="text-right font-mono text-xs text-zinc-700">{notes.length}/500</p>
      </div>

      {error && (
        <p className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-md border border-emerald-900 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-400">
          Score submitted. Thank you.
        </p>
      )}

      <Button
        type="submit"
        disabled={!score || !modelId || loading}
        className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-40"
      >
        {loading ? "Submitting..." : existingVote ? "Update Score" : "Submit Score"}
      </Button>
    </form>
  )
}
