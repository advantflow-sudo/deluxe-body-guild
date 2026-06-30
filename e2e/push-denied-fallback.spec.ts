import { test, expect } from "@playwright/test";

/**
 * When push permission is denied, the app must silently fall back to
 * in-app notifications: a toast appears and the NotificationBell
 * unread state updates without throwing.
 */
const USER = process.env.PLAYWRIGHT_TEST_USER;
const PASS = process.env.PLAYWRIGHT_TEST_PASS;

test.describe("push denied → in-app fallback", () => {
  test.skip(!USER || !PASS, "Auth creds required");

  test.use({ permissions: [] }); // no notifications permission granted

  test("denied push still surfaces in-app toast + unread badge", async ({ page, context }) => {
    // Explicitly deny notifications for this origin.
    await context.clearPermissions();
    await context.grantPermissions([], { origin: "http://localhost:5173" });

    await page.addInitScript(() => {
      // Force Notification.permission === "denied"
      try {
        Object.defineProperty(Notification, "permission", { get: () => "denied" });
        (Notification as any).requestPermission = async () => "denied";
      } catch {}
    });

    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(USER!);
    await page.getByLabel(/password/i).fill(PASS!);
    await page.getByRole("button", { name: /sign in|continue/i }).click();
    await page.waitForURL(/\/app/);

    // Simulate a new in-app notification arriving (silent fallback path).
    await page.evaluate(() => {
      navigator.serviceWorker?.controller?.postMessage({
        type: "df-show-notification",
        title: "New like",
        body: "Someone liked your post",
        url: "/app/community",
      });
      window.dispatchEvent(
        new CustomEvent("df:notification", {
          detail: { title: "New like", body: "Someone liked your post" },
        }),
      );
    });

    // Toast shown (sonner / shadcn toast)
    await expect(page.getByText(/new like/i).first()).toBeVisible({ timeout: 5000 });

    // Unread dot appears on the bell
    const bell = page.getByRole("button", { name: /notifications/i });
    await expect(bell.locator("[data-unread='true'], .bg-primary, [data-state='unread']").first())
      .toBeVisible({ timeout: 5000 });
  });
});
