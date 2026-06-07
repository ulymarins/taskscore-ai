import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ScoreDisplay } from "@/components/task/score-display"

describe("ScoreDisplay", () => {
  it("renders the editor score", () => {
    render(<ScoreDisplay editorScore={4} communityScore={null} voteCount={0} />)
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("shows an em dash when community score is null", () => {
    render(<ScoreDisplay editorScore={3} communityScore={null} voteCount={0} />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders community score with one decimal when available", () => {
    render(<ScoreDisplay editorScore={4} communityScore={3.5} voteCount={10} />)
    expect(screen.getByText("3.5")).toBeInTheDocument()
  })

  it("shows the correct vote count", () => {
    render(<ScoreDisplay editorScore={4} communityScore={3.5} voteCount={42} />)
    expect(screen.getByText(/42 votes/)).toBeInTheDocument()
  })

  it("uses singular 'vote' when count is 1", () => {
    render(<ScoreDisplay editorScore={3} communityScore={3} voteCount={1} />)
    expect(screen.getByText(/\b1 vote\b/)).toBeInTheDocument()
  })

  it("shows 0 votes label when vote count is 0", () => {
    render(<ScoreDisplay editorScore={2} communityScore={null} voteCount={0} />)
    expect(screen.getByText(/0 votes/)).toBeInTheDocument()
  })
})
