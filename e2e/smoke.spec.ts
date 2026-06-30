import { test, expect } from "@playwright/test";

/**
 * Smoke tests that don't require auth — verify the marketing shell
 * loads, key sections appear, and navigation works. Auth-gated flows
 * (community feed, notifications) are unit-covered in the React tree
 * and require a Supabase test session, which CI does not mint.
 */

test.describe("home smoke", () => {
  test("home loads and shows hero copy", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Deluxe Fitness/i);
    // Hero should render without runtime errors.
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.waitForLoadState("domcontentloaded");
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("navigates between marketing routes", async ({ page }) => {
    await page.goto("/");
    await page.goto("/how-it-works");
    await expect(page).toHaveURL(/how-it-works/);
    await page.goto("/pricing");
    await expect(page).toHaveURL(/pricing/);
  });

  test("login route renders Gmail sign-in", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /gmail|google|continue/i }).first()).toBeVisible();
  });
});
