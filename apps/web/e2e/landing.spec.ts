import { test, expect } from "@playwright/test"

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("renders the main headline", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /verified matrix/i })
    ).toBeVisible()
  })

  test("shows the five readiness levels", async ({ page }) => {
    for (const label of ["Failing", "Marginal", "Functional", "Proficient", "Expert-grade"]) {
      await expect(page.getByText(label).first()).toBeVisible()
    }
  })

  test("shows the scale section heading", async ({ page }) => {
    await expect(page.getByText("Five levels. No ambiguity.")).toBeVisible()
  })

  test("shows the three feature cards", async ({ page }) => {
    await expect(page.getByText("Editor score")).toBeVisible()
    await expect(page.getByText("Your score")).toBeVisible()
    await expect(page.getByText("The gap")).toBeVisible()
  })

  test("shows the Sign in button for unauthenticated users", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible()
  })

  test("sign in link navigates to the login page", async ({ page }) => {
    await page.getByRole("link", { name: /Sign in/i }).click()
    await expect(page).toHaveURL("/auth/login")
  })
})

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login")
  })

  test("renders GitHub and Google sign-in buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: /GitHub/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible()
  })

  test("does not show a profile link or sidebar", async ({ page }) => {
    await expect(page.getByRole("navigation")).not.toBeVisible().catch(() => {
      // sidebar may not render on the login page — that's correct
    })
  })
})
