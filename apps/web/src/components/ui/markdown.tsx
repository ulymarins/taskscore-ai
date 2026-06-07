"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownProseProps {
  content: string
  className?: string
}

export function MarkdownProse({ content, className }: MarkdownProseProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="mt-8 text-base font-semibold text-zinc-100 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 font-mono text-xs uppercase tracking-wider text-zinc-500 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-zinc-400">{children}</p>
          ),
          ul: ({ children }) => <ul className="space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-2 list-decimal pl-4 text-zinc-400">{children}</ol>,
          li: ({ children }) => (
            <li className="flex gap-2.5 text-zinc-400">
              <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-700" />
              <span className="flex-1">{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-200">{children}</strong>
          ),
          em: ({ children }) => <em className="text-zinc-300 not-italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-zinc-300 underline underline-offset-4 transition-colors hover:text-zinc-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-zinc-800 pl-4 text-zinc-500">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-zinc-800" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
