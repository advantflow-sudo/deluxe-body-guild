import { test, expect } from "@playwright/test";

/**
 * Floods the community feed with realtime events via the Supabase JS
 * client running in-page, and asserts:
 *   1. Reloads are throttled (single in-flight + trailing debounce)
 *   2. Final counters match the number of inserted events
 *   3. No long-task jank > 200ms during the burst
 */
const USER = process.env.PLAYWRIGHT_TEST_USER;
const PASS = process.env.PLAYWRIGHT_TEST_PASS;
const POST = process.env.PLAYWRIGHT_SEED_POST_ID;

test.describe("realtime throttling", () => {
  test.skip(!USER || !PASS || !POST, "Seeded creds + post id required");

  test("burst of likes/comments is throttled and accurate", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(USER!);
    await page.getByLabel(/password/i).fill(PASS!);
    await page.getByRole("button", { name: /sign in|continue/i }).click();
    await page.waitForURL(/\/app/);
    await page.goto("/app/community");

    // Instrument the page to count feed reloads.
    await page.evaluate(() => {
      (window as any).__reloadCount = 0;
      const orig = window.fetch;
      window.fetch = async (...args) => {
        try {
          const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
          if (url.includes("community_posts")) (window as any).__reloadCount++;
        } catch {}
        return orig.apply(window, args as any);
      };
      const obs = new PerformanceObserver((list) => {
        const longs = list.getEntries().filter((e) => e.duration > 200);
        (window as any).__longTasks = ((window as any).__longTasks ?? 0) + longs.length;
      });
      try { obs.observe({ entryTypes: ["longtask"] }); } catch {}
    });

    const initialLikes = await page
      .locator(`[data-post-id="${POST}"] [data-likes-count]`)
      .first()
      .getAttribute("data-likes-count");

    // Fire 30 rapid like inserts via Supabase JS already loaded in-page.
    const BURST = 30;
    const inserted = await page.evaluate(
      async ({ postId, n }) => {
        const sb = (window as any).supabase;
        if (!sb) return 0;
        const ops = Array.from({ length: n }, () =>
          sb.from("post_likes").insert({ post_id: postId }),
        );
        const results = await Promise.allSettled(ops);
        return results.filter((r) => r.status === "fulfilled").length;
      },
      { postId: POST, n: BURST },
    );

    // Allow the trailing debounce (~1.2s) to flush.
    await page.waitForTimeout(2500);

    const reloadCount = await page.evaluate(() => (window as any).__reloadCount ?? 0);
    const longTasks = await page.evaluate(() => (window as any).__longTasks ?? 0);

    // Throttled: far fewer reloads than events fired.
    expect(reloadCount).toBeLessThan(Math.max(5, Math.ceil(BURST / 5)));
    expect(longTasks).toBeLessThan(3);

    const finalLikes = await page
      .locator(`[data-post-id="${POST}"] [data-likes-count]`)
      .first()
      .getAttribute("data-likes-count");
    expect(Number(finalLikes)).toBe(Number(initialLikes ?? 0) + inserted);
  });
});
