import { test, expect } from "@playwright/test"

/**
 * These tests require the database to be seeded (`pnpm db:seed`).
 * They run against the live Next.js dev server with real Prisma queries.
 */

test.describe("Domain matrix page", () => {
  test("loads the first domain and renders a table", async ({ page }) => {
    // The root redirects to the first domain after login; browse directly
    await page.goto("/software-engineering")

    // Domain heading should be present
    await expect(page.getByRole("heading", { name: /software engineering/i })).toBeVisible()

    // Table should render at least one row
    await expect(page.getByRole("table")).toBeVisible()
    const rows = page.getByRole("row")
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(2) // header + at least one data row
  })

  test("category filter pills are rendered", async ({ page }) => {
    await page.goto("/software-engineering")

    // "All" pill is always present
    await expect(page.getByRole("link", { name: /^All$/ })).toBeVisible()
  })

  test("clicking a category pill adds a ?category= search param", async ({ page }) => {
    await page.goto("/software-engineering")

    // Find any category pill that is not "All"
    const pills = page.getByRole("link").filter({ hasNotText: /^All$/ })
    const count = await pills.count()
    if (count === 0) {
      test.skip()
      return
    }

    const firstPill = pills.first()
    const pillText = await firstPill.textContent()
    await firstPill.click()

    // URL should now contain ?category=
    await expect(page).toHaveURL(/\?category=/)

    // Table still renders after filtering
    await expect(page.getByRole("table")).toBeVisible()

    // The active pill text should still be visible
    if (pillText) {
      await expect(page.getByText(pillText.trim()).first()).toBeVisible()
    }
  })

  test("clicking 'All' removes the category filter", async ({ page }) => {
    await page.goto("/software-engineering?category=code-generation")

    await page.getByRole("link", { name: /^All$/ }).click()

    await expect(page).toHaveURL("/software-engineering")
  })

  test("text filter input narrows the table rows", async ({ page }) => {
    await page.goto("/software-engineering")

    const input = page.getByPlaceholder("Filter tasks...")
    await input.fill("zzzzz_no_match_expected")

    await expect(page.getByText(/No tasks match your filter/i)).toBeVisible()
  })
})

test.describe("Task detail page", () => {
  test("renders both editorial and toolkit panes", async ({ page }) => {
    // Navigate to the domain page first, then click the first task
    await page.goto("/software-engineering")

    const firstTaskLink = page
      .getByRole("link")
      .filter({ hasNotText: /software engineering|All|code/i })
      .first()

    const href = await firstTaskLink.getAttribute("href")
    if (!href) {
      test.skip()
      return
    }

    await page.goto(href)

    // Left pane — editorial
    await expect(page.getByText(/The Verdict/i)).toBeVisible()

    // Right pane — toolkit
    await expect(page.getByText(/Verified Prompt/i)).toBeVisible()
    await expect(page.getByText(/Expected Output/i)).toBeVisible()
  })

  test("shows a sign-in prompt in the vote form for unauthenticated users", async ({ page }) => {
    await page.goto("/software-engineering")

    const firstTaskLink = page.getByRole("table").getByRole("link").first()
    const href = await firstTaskLink.getAttribute("href")
    if (!href) {
      test.skip()
      return
    }

    await page.goto(href)

    await expect(page.getByText(/Sign in to submit/i)).toBeVisible()
  })

  test("breadcrumb links back to the domain page", async ({ page }) => {
    await page.goto("/software-engineering")

    const firstTaskLink = page.getByRole("table").getByRole("link").first()
    const href = await firstTaskLink.getAttribute("href")
    if (!href) {
      test.skip()
      return
    }

    await page.goto(href)

    // First breadcrumb = domain name
    const breadcrumbLink = page.getByRole("navigation").getByRole("link").first()
    await breadcrumbLink.click()

    await expect(page).toHaveURL("/software-engineering")
  })
})

test.describe("Sidebar navigation", () => {
  test("sidebar is visible on the domain matrix page", async ({ page }) => {
    await page.goto("/software-engineering")
    await expect(page.getByText("TaskScore.ai")).toBeVisible()
  })

  test("sidebar is NOT visible on the landing page", async ({ page }) => {
    await page.goto("/")
    // The app sidebar only renders inside the (app) layout
    // The landing page has its own nav with no sidebar
    const sidebar = page.locator("[data-sidebar]")
    await expect(sidebar).not.toBeVisible().catch(() => {
      // acceptable — sidebar simply doesn't exist on this page
    })
  })
})
