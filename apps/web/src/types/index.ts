export type ScoreValue = 1 | 2 | 3 | 4 | 5

export interface TaskRow {
  id: string
  slug: string
  name: string
  domainSlug: string
  category: string
  categorySlug: string
  editorScore: number
  communityScore: number | null
  voteCount: number
}

export interface AiModelOption {
  id: string
  name: string
  provider: string
}

export interface ExistingVote {
  score: number
  aiModelId: string
}
