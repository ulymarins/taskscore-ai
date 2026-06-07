import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"

const voteSchema = z.object({
  taskId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  aiModelId: z.string().min(1),
  notes: z.string().max(500).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = voteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { taskId, score, aiModelId, notes } = parsed.data

  // Verify task exists and is published
  const task = await prisma.task.findFirst({
    where: { id: taskId, publishedAt: { not: null } },
    select: { id: true },
  })

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // Verify model exists
  const model = await prisma.aiModel.findUnique({
    where: { id: aiModelId },
    select: { id: true },
  })

  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 })
  }

  const vote = await prisma.vote.upsert({
    where: {
      taskId_userId_aiModelId: {
        taskId,
        userId: user.id,
        aiModelId,
      },
    },
    update: { score, notes: notes ?? null },
    create: {
      taskId,
      userId: user.id,
      aiModelId,
      score,
      notes: notes ?? null,
    },
    select: { id: true, score: true, aiModelId: true, updatedAt: true },
  })

  return NextResponse.json({ vote }, { status: 200 })
}
