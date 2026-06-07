"use client"

import { useState } from "react"
import { Check, Copy, FileCode2 } from "lucide-react"

interface PromptBlockProps {
  prompt: string
  taskName: string
  expectedOutput: string
  notes: string | null
}

type CopyTarget = "directive" | "rule"

function buildAgentRulePayload(
  taskName: string,
  prompt: string,
  expectedOutput: string,
  notes: string | null,
): string {
  const guardrails = notes
    ? notes
        .split(/(?<=\.)\s+(?=[A-Z])/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => `- ${s.replace(/\.$/, "")}.`)
        .join("\n")
    : "No specific failures documented"

  return `# Custom Rule: ${taskName}

## System Directive
${prompt}

## Expected Output
${expectedOutput}

## Guardrails (Known Failures to Avoid)
${guardrails}
`
}

export function PromptBlock({ prompt, taskName, expectedOutput, notes }: PromptBlockProps) {
  const [copied, setCopied] = useState<CopyTarget | null>(null)

  async function handleCopy(target: CopyTarget) {
    const payload =
      target === "directive"
        ? prompt
        : buildAgentRulePayload(taskName, prompt, expectedOutput, notes)

    try {
      await navigator.clipboard.writeText(payload)
      setCopied(target)
      setTimeout(() => setCopied((current) => (current === target ? null : current)), 2000)
    } catch {
      // Clipboard unavailable (e.g. insecure context); fail silently.
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="ml-3 font-mono text-xs text-zinc-600">system-instruction.txt</span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy("directive")}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            aria-label="Copy directive to clipboard"
          >
            {copied === "directive" ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            Copy Directive
          </button>

          <button
            type="button"
            onClick={() => handleCopy("rule")}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            aria-label="Copy IDE or agent rule payload to clipboard"
          >
            {copied === "rule" ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <FileCode2 className="h-3 w-3" />
            )}
            Copy IDE / Agent Rule
          </button>
        </div>
      </div>

      <pre className="overflow-x-auto whitespace-pre-wrap p-5 font-mono text-sm leading-relaxed text-zinc-300">
        {prompt}
      </pre>
    </div>
  )
}
