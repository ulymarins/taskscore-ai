import { describe, it, expect } from "vitest"
import { parseResources } from "@/lib/parse-resources"

describe("parseResources", () => {
  it("returns an empty array for null", () => {
    expect(parseResources(null)).toEqual([])
  })

  it("returns an empty array for undefined", () => {
    expect(parseResources(undefined)).toEqual([])
  })

  it("returns an empty array for a plain object", () => {
    expect(parseResources({ title: "x", url: "y" })).toEqual([])
  })

  it("returns an empty array for a string", () => {
    expect(parseResources("https://example.com")).toEqual([])
  })

  it("returns an empty array for an empty array", () => {
    expect(parseResources([])).toEqual([])
  })

  it("returns well-formed resource objects", () => {
    const input = [
      { title: "Prisma docs", url: "https://prisma.io" },
      { title: "Next.js docs", url: "https://nextjs.org" },
    ]
    expect(parseResources(input)).toEqual(input)
  })

  it("filters out items with a non-string title", () => {
    const input = [
      { title: 42, url: "https://example.com" },
      { title: "Good", url: "https://good.com" },
    ]
    expect(parseResources(input)).toEqual([{ title: "Good", url: "https://good.com" }])
  })

  it("filters out items with a non-string url", () => {
    const input = [
      { title: "Bad URL", url: 123 },
      { title: "Good", url: "https://good.com" },
    ]
    expect(parseResources(input)).toEqual([{ title: "Good", url: "https://good.com" }])
  })

  it("filters out null entries in the array", () => {
    const input = [null, { title: "Valid", url: "https://example.com" }]
    expect(parseResources(input)).toEqual([{ title: "Valid", url: "https://example.com" }])
  })

  it("filters out primitive entries in the array", () => {
    const input = ["string", 42, true, { title: "Valid", url: "https://example.com" }]
    expect(parseResources(input)).toEqual([{ title: "Valid", url: "https://example.com" }])
  })

  it("ignores extra properties on otherwise valid objects", () => {
    const input = [{ title: "Docs", url: "https://example.com", extra: "ignored" }]
    expect(parseResources(input)).toEqual([{ title: "Docs", url: "https://example.com", extra: "ignored" }])
  })
})
