import "@testing-library/jest-dom/vitest"
import { vi, afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Clean up the DOM after each test
afterEach(() => {
  cleanup()
})

// Radix UI uses Pointer Events which jsdom does not implement.
// Only patch in browser-like environments (jsdom), not in node.
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture = vi.fn(() => false) as typeof Element.prototype.hasPointerCapture
  Element.prototype.setPointerCapture = vi.fn() as typeof Element.prototype.setPointerCapture
  Element.prototype.releasePointerCapture = vi.fn() as typeof Element.prototype.releasePointerCapture
  Element.prototype.scrollIntoView = vi.fn() as typeof Element.prototype.scrollIntoView
}

// Mock next/navigation for all component tests
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => {
    const { createElement } = require("react")
    return createElement("a", { href, ...props }, children)
  },
}))
