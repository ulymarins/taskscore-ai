// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

// Hoist mock factories so they're available when vi.mock() runs
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  taskFindFirst: vi.fn(),
  aiModelFindUnique: vi.fn(),
  voteUpsert: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mocks.getUser },
    }),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    task: { findFirst: mocks.taskFindFirst },
    aiModel: { findUnique: mocks.aiModelFindUnique },
    vote: { upsert: mocks.voteUpsert },
  },
}))

import { POST } from "@/app/api/votes/route"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/votes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { taskId: "task-1", score: 3, aiModelId: "model-1" }
const MOCK_VOTE = {
  id: "vote-1",
  score: 3,
  aiModelId: "model-1",
  updatedAt: new Date(),
}

describe("POST /api/votes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated user
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    // Default: task and model exist
    mocks.taskFindFirst.mockResolvedValue({ id: "task-1" })
    mocks.aiModelFindUnique.mockResolvedValue({ id: "model-1" })
    mocks.voteUpsert.mockResolvedValue(MOCK_VOTE)
  })

  // ── Auth ────────────────────────────────────────────────────────────

  it("returns 401 when the user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  // ── Validation ──────────────────────────────────────────────────────

  it("returns 400 for malformed JSON", async () => {
    const req = new Request("http://localhost/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 422 when taskId is missing", async () => {
    const res = await POST(makeRequest({ score: 3, aiModelId: "model-1" }))
    expect(res.status).toBe(422)
  })

  it("returns 422 when score is 0 (below minimum)", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, score: 0 }))
    expect(res.status).toBe(422)
  })

  it("returns 422 when score is 6 (above maximum)", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, score: 6 }))
    expect(res.status).toBe(422)
  })

  it("returns 422 when score is a float", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, score: 3.5 }))
    expect(res.status).toBe(422)
  })

  it("returns 422 when notes exceeds 500 characters", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, notes: "x".repeat(501) }))
    expect(res.status).toBe(422)
  })

  it("accepts an optional notes field within the character limit", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, notes: "Tested on a real codebase." }))
    expect(res.status).toBe(200)
  })

  // ── Resource checks ─────────────────────────────────────────────────

  it("returns 404 when the task does not exist or is unpublished", async () => {
    mocks.taskFindFirst.mockResolvedValue(null)
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(404)
  })

  it("returns 404 when the AI model does not exist", async () => {
    mocks.aiModelFindUnique.mockResolvedValue(null)
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(404)
  })

  // ── Happy path ───────────────────────────────────────────────────────

  it("returns 200 and the upserted vote on a valid request", async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.vote).toBeDefined()
    expect(body.vote.score).toBe(3)
  })

  it("calls prisma.vote.upsert exactly once", async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mocks.voteUpsert).toHaveBeenCalledTimes(1)
  })

  it("includes the userId from the session in the upsert", async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mocks.voteUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          taskId_userId_aiModelId: expect.objectContaining({ userId: "user-1" }),
        }),
      })
    )
  })

  it("passes notes: null to upsert when notes is not provided", async () => {
    await POST(makeRequest(VALID_BODY))
    expect(mocks.voteUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ notes: null }),
      })
    )
  })

  it("passes notes to upsert when provided", async () => {
    await POST(makeRequest({ ...VALID_BODY, notes: "Edge case found" }))
    expect(mocks.voteUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ notes: "Edge case found" }),
      })
    )
  })

  it("accepts each valid score from 1 to 5", async () => {
    for (const score of [1, 2, 3, 4, 5]) {
      const res = await POST(makeRequest({ ...VALID_BODY, score }))
      expect(res.status).toBe(200)
    }
  })
})
