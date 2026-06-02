import { test, expect, type Page } from "@playwright/test";

/**
 * Verifies the hero <VideoPlayer analyticsId="hero" surface="home_hero" />
 * fires a `video_pause` event with the expected payload when the user pauses
 * mid-playback (before the clip naturally ends).
 *
 * Strategy:
 *  - Listen for the in-app `lovable:analytics` CustomEvent (dispatched by
 *    `src/lib/analytics.ts#track`) and stash every event on `window`.
 *  - Start the hero video, wait for `video_play`, seek to ~30% of the clip,
 *    then issue a programmatic pause and assert the resulting `video_pause`
 *    event carries `video_id: "hero"`, `surface: "home_hero"`, and a
 *    `current_time` that is strictly between 0 and the clip duration.
 */

type AnalyticsEvent = {
  event: string;
  props: Record<string, string | number | boolean | null | undefined>;
};

declare global {
  interface Window {
    __analyticsEvents?: AnalyticsEvent[];
  }
}

async function installAnalyticsCapture(page: Page) {
  await page.addInitScript(() => {
    window.__analyticsEvents = [];
    window.addEventListener("lovable:analytics", (e: Event) => {
      const detail = (e as CustomEvent<AnalyticsEvent>).detail;
      window.__analyticsEvents!.push(detail);
    });
  });
}

test.describe("hero video analytics", () => {
  test("fires video_pause with hero video_id and surface when paused mid-play", async ({ page }) => {
    await installAnalyticsCapture(page);
    await page.goto("/");

    // The hero VideoPlayer is the first <video> on the home page.
    const video = page.locator("video").first();
    await expect(video).toBeVisible();

    // Wait until the browser knows enough to play (metadata + first frame).
    await video.evaluate(
      (el: HTMLVideoElement) =>
        new Promise<void>((resolve) => {
          if (el.readyState >= 2) return resolve();
          el.addEventListener("loadeddata", () => resolve(), { once: true });
        }),
    );

    // Start playback programmatically — muted + playsInline means autoplay is
    // permitted in Chromium without a user gesture.
    await video.evaluate(async (el: HTMLVideoElement) => {
      el.muted = true;
      await el.play();
    });

    // Wait for the play event to be captured so we know the player is wired.
    await expect
      .poll(() => page.evaluate(() => window.__analyticsEvents?.some((e) => e.event === "video_play")))
      .toBe(true);

    // Seek to ~30% so we are clearly mid-clip (not at start, not at end), then
    // pause. We avoid relying on real-time playback duration so the test is
    // stable on fast/slow CI runners and short hero clips.
    await video.evaluate((el: HTMLVideoElement) => {
      const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 5;
      el.currentTime = duration * 0.3;
      el.pause();
    });

    // Assert the pause event landed with the expected payload.
    const pauseEvent = await page.waitForFunction(
      () => window.__analyticsEvents?.find((e) => e.event === "video_pause"),
      undefined,
      { timeout: 10_000 },
    );

    const payload = (await pauseEvent.jsonValue()) as AnalyticsEvent;
    expect(payload.event).toBe("video_pause");
    expect(payload.props.video_id).toBe("hero");
    expect(payload.props.surface).toBe("home_hero");
    expect(typeof payload.props.src).toBe("string");
    expect(typeof payload.props.current_time).toBe("number");
    expect(payload.props.current_time as number).toBeGreaterThan(0);
    expect(typeof payload.props.progress_pct).toBe("number");
    expect(payload.props.progress_pct as number).toBeGreaterThanOrEqual(0);
    expect(payload.props.progress_pct as number).toBeLessThan(100);

    // Sanity: no `video_complete` event should have fired before our pause.
    const events = await page.evaluate(() => window.__analyticsEvents ?? []);
    const completeBeforePause =
      events.findIndex((e) => e.event === "video_complete") <
      events.findIndex((e) => e.event === "video_pause");
    expect(completeBeforePause).toBe(false);
  });
});
