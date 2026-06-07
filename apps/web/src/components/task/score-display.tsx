interface ScoreDisplayProps {
  editorScore: number
  communityScore: number | null
  voteCount: number
}

export function ScoreDisplay({ editorScore, communityScore, voteCount }: ScoreDisplayProps) {
  return (
    <div className="flex items-start gap-8">
      <div>
        <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">Editor Score</p>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-4xl font-bold text-zinc-100">{editorScore}</span>
          <span className="font-mono text-zinc-600">/5</span>
        </div>
      </div>

      <div className="mt-1 w-px self-stretch bg-zinc-800" />

      <div>
        <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">
          Community Score
          <span className="ml-2 normal-case text-zinc-700">
            ({voteCount} {voteCount === 1 ? "vote" : "votes"})
          </span>
        </p>
        <div className="flex items-baseline gap-1">
          {communityScore !== null ? (
            <>
              <span className="font-mono text-4xl font-bold text-zinc-100">
                {communityScore.toFixed(1)}
              </span>
              <span className="font-mono text-zinc-600">/5</span>
            </>
          ) : (
            <span className="font-mono text-3xl text-zinc-700">—</span>
          )}
        </div>
      </div>
    </div>
  )
}
