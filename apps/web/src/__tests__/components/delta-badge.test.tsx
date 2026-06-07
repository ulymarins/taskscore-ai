import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { DeltaBadge } from "@/components/task/delta-badge"

describe("DeltaBadge", () => {
  it("shows 'No data' when communityScore is null", () => {
    render(<DeltaBadge editorScore={3} communityScore={null} voteCount={0} />)
    expect(screen.getByText("No data")).toBeInTheDocument()
  })

  it("shows 'No data' when voteCount is 0 even if score is provided", () => {
    render(<DeltaBadge editorScore={3} communityScore={3} voteCount={0} />)
    expect(screen.getByText("No data")).toBeInTheDocument()
  })

  it("shows '±0' when delta is below the threshold (< 0.05)", () => {
    render(<DeltaBadge editorScore={3} communityScore={3.04} voteCount={5} />)
    expect(screen.getByText("±0")).toBeInTheDocument()
  })

  it("shows '±0' when scores are exactly equal", () => {
    render(<DeltaBadge editorScore={4} communityScore={4} voteCount={10} />)
    expect(screen.getByText("±0")).toBeInTheDocument()
  })

  it("shows positive delta when community score exceeds editor score", () => {
    render(<DeltaBadge editorScore={3} communityScore={4} voteCount={5} />)
    expect(screen.getByText(/\+1\.0/)).toBeInTheDocument()
  })

  it("shows negative delta when community score is below editor score", () => {
    render(<DeltaBadge editorScore={4} communityScore={3} voteCount={5} />)
    expect(screen.getByText(/-1\.0/)).toBeInTheDocument()
  })

  it("formats delta to one decimal place", () => {
    render(<DeltaBadge editorScore={3} communityScore={4.666} voteCount={3} />)
    expect(screen.getByText(/\+1\.7/)).toBeInTheDocument()
  })
})
