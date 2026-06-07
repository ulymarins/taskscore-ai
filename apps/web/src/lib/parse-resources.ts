export interface Resource {
  title: string
  url: string
}

export function parseResources(raw: unknown): Resource[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (item): item is Resource =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as Resource).title === "string" &&
      typeof (item as Resource).url === "string"
  )
}
