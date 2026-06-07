import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VoteForm } from "@/components/task/vote-form"
import type { AiModelOption } from "@/types"

const MOCK_MODELS: AiModelOption[] = [
  { id: "model-1", name: "GPT-4o", provider: "OpenAI" },
  { id: "model-2", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
]

describe("VoteForm — unauthenticated", () => {
  it("shows a sign-in prompt instead of the form", () => {
    render(
      <VoteForm taskId="t1" models={MOCK_MODELS} isAuthenticated={false} existingVote={null} />
    )
    expect(screen.getByText(/Sign in to submit/i)).toBeInTheDocument()
    expect(screen.queryByText("Readiness Score")).not.toBeInTheDocument()
  })

  it("renders a link to the login page", () => {
    render(
      <VoteForm taskId="t1" models={MOCK_MODELS} isAuthenticated={false} existingVote={null} />
    )
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/auth/login")
  })
})

describe("VoteForm — authenticated", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("renders score buttons 1 through 5", () => {
    render(
      <VoteForm taskId="t1" models={MOCK_MODELS} isAuthenticated={true} existingVote={null} />
    )
    for (const score of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole("button", { name: String(score) })).toBeInTheDocument()
    }
  })

  it("submit button is disabled before score and model are selected", () => {
    render(
      <VoteForm taskId="t1" models={MOCK_MODELS} isAuthenticated={true} existingVote={null} />
    )
    expect(screen.getByRole("button", { name: /Submit Score/i })).toBeDisabled()
  })

  it("shows the score label and hint after a score is selected", async () => {
    const user = userEvent.setup()
    render(
      <VoteForm taskId="t1" models={MOCK_MODELS} isAuthenticated={true} existingVote={null} />
    )

    await user.click(screen.getByRole("button", { name: "3" }))

    expect(screen.getByText(/3 — Functional/)).toBeInTheDocument()
    expect(screen.getByText(/Domain review/i)).toBeInTheDocument()
  })

  it("shows the correct label for each score", async () => {
    const user = userEvent.setup()
    const expectedLabels: Record<number, string> = {
      1: "Failing",
      2: "Marginal",
      3: "Functional",
      4: "Proficient",
      5: "Expert-grade",
    }

    for (const [score, label] of Object.entries(expectedLabels)) {
      const { unmount } = render(
        <VoteForm taskId="t1" models={MOCK_MODELS} isAuthenticated={true} existingVote={null} />
      )
      await user.click(screen.getByRole("button", { name: score }))
      expect(screen.getByText(new RegExp(label))).toBeInTheDocument()
      unmount()
    }
  })

  it("shows 'Update Score' label when an existing vote is present", () => {
    render(
      <VoteForm
        taskId="t1"
        models={MOCK_MODELS}
        isAuthenticated={true}
        existingVote={{ score: 4, aiModelId: "model-1" }}
      />
    )
    expect(screen.getByRole("button", { name: /Update Score/i })).toBeInTheDocument()
  })

  it("pre-selects the score from an existing vote", () => {
    render(
      <VoteForm
        taskId="t1"
        models={MOCK_MODELS}
        isAuthenticated={true}
        existingVote={{ score: 4, aiModelId: "model-1" }}
      />
    )
    // Score 4 button should appear selected (darker styling indicates selection)
    // We verify the label is shown which only appears when a score is active
    expect(screen.getByText(/4 — Proficient/)).toBeInTheDocument()
  })

  it("shows a network error message when fetch throws", async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"))

    // existingVote pre-fills both score and model so the submit button is enabled
    render(
      <VoteForm
        taskId="t1"
        models={MOCK_MODELS}
        isAuthenticated={true}
        existingVote={{ score: 3, aiModelId: "model-1" }}
      />
    )

    await user.click(screen.getByRole("button", { name: /Update Score/i }))

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })

  it("submits the correct payload to /api/votes", async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ vote: { id: "v1", score: 4 } }), { status: 200 })
    )

    // existingVote pre-fills score=4 and aiModelId=model-1
    render(
      <VoteForm
        taskId="task-abc"
        models={MOCK_MODELS}
        isAuthenticated={true}
        existingVote={{ score: 4, aiModelId: "model-1" }}
      />
    )

    await user.click(screen.getByRole("button", { name: /Update Score/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/votes",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"taskId":"task-abc"'),
        })
      )
    })

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string)
    expect(body.score).toBe(4)
    expect(body.aiModelId).toBe("model-1")
  })
})
