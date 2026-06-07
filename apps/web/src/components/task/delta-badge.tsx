import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DeltaBadgeProps {
  editorScore: number
  communityScore: number | null
  voteCount: number
}

export function DeltaBadge({ editorScore, communityScore, voteCount }: DeltaBadgeProps) {
  if (communityScore === null || voteCount === 0) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-zinc-700 bg-transparent text-zinc-600 font-mono text-xs"
      >
        <Minus className="h-3 w-3" />
        No data
      </Badge>
    )
  }

  const delta = communityScore - editorScore
  const abs = Math.abs(delta)

  if (abs < 0.05) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-zinc-700 bg-transparent text-zinc-400 font-mono text-xs"
      >
        <Minus className="h-3 w-3" />
        ±0
      </Badge>
    )
  }

  if (delta > 0) {
    return (
      <Badge className="gap-1 border border-emerald-800 bg-emerald-950 text-emerald-400 font-mono text-xs hover:bg-emerald-950">
        <TrendingUp className="h-3 w-3" />+{delta.toFixed(1)}
      </Badge>
    )
  }

  return (
    <Badge className="gap-1 border border-amber-800 bg-amber-950 text-amber-400 font-mono text-xs hover:bg-amber-950">
      <TrendingDown className="h-3 w-3" />
      {delta.toFixed(1)}
    </Badge>
  )
}
