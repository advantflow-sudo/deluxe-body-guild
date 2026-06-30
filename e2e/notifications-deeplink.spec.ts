import { test, expect } from "@playwright/test";

/**
 * Verifies clicking a notification deep-links to the correct post and,
 * when present, scrolls/highlights the specific comment.
 *
 * Requires seeded records:
 *   PLAYWRIGHT_TEST_USER / PLAYWRIGHT_TEST_PASS — auth
 *   PLAYWRIGHT_SEED_POST_ID — community_posts.id with notification row
 *   PLAYWRIGHT_SEED_COMMENT_ID — post_comments.id under that post
 */
const USER = process.env.PLAYWRIGHT_TEST_USER;
const PASS = process.env.PLAYWRIGHT_TEST_PASS;
const POST = process.env.PLAYWRIGHT_SEED_POST_ID;
const COMMENT = process.env.PLAYWRIGHT_SEED_COMMENT_ID;

test.describe("notification deep-link", () => {
  test.skip(!USER || !PASS || !POST, "Seeded creds + post id required");

  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(USER!);
    await page.getByLabel(/password/i).fill(PASS!);
    await page.getByRole("button", { name: /sign in|continue/i }).click();
    await page.waitForURL(/\/app/);
  });

  test("clicking a notification routes to post and highlights it", async ({ page }) => {
    await page.getByRole("button", { name: /notifications/i }).click();
    const dialog = page.getByRole("dialog", { name: /notifications/i });
    await expect(dialog).toBeVisible();

    const link = dialog.locator(`a[href*="p=${POST}"]`).first();
    await link.click();

    await expect(page).toHaveURL(new RegExp(`community.*p=${POST}`));
    const post = page.locator(`[data-post-id="${POST}"]`);
    await expect(post).toBeVisible();
    await expect(post).toHaveClass(/ring/);
  });

  test("comment deep-link scrolls and focuses the comment", async ({ page }) => {
    test.skip(!COMMENT, "Seeded comment id required");
    await page.goto(`/app/community?p=${POST}&c=${COMMENT}`);
    const comment = page.locator(`[data-comment-id="${COMMENT}"]`);
    await expect(comment).toBeVisible();
    await expect(comment).toHaveClass(/ring/);
    // Smooth-scroll lands the element within viewport
    const inView = await comment.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight;
    });
    expect(inView).toBeTruthy();
  });
});
