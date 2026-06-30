import { test, expect, Page } from "@playwright/test";

/**
 * Keyboard + ARIA contract for the NotificationBell dropdown and the
 * ShareButton sheet:
 *   • opens via Enter/Space, closes via Escape
 *   • aria-expanded toggles, aria-modal set while open
 *   • focus is trapped (Tab cycles inside dialog)
 *   • focus returns to the trigger on close
 */

const USER = process.env.PLAYWRIGHT_TEST_USER;
const PASS = process.env.PLAYWRIGHT_TEST_PASS;

async function signIn(page: Page) {
  await page.goto("/auth");
  await page.getByLabel(/email/i).fill(USER!);
  await page.getByLabel(/password/i).fill(PASS!);
  await page.getByRole("button", { name: /sign in|continue/i }).click();
  await page.waitForURL(/\/app/);
}

async function assertFocusTrap(page: Page, dialogSelector: string) {
  const focusables = await page.locator(`${dialogSelector} :is(a,button,[tabindex="0"])`).count();
  expect(focusables).toBeGreaterThan(0);
  for (let i = 0; i < focusables + 2; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate((sel) => {
      const dlg = document.querySelector(sel);
      return !!dlg && dlg.contains(document.activeElement);
    }, dialogSelector);
    expect(inside).toBeTruthy();
  }
}

test.describe("NotificationBell a11y", () => {
  test.skip(!USER || !PASS, "Auth creds required");

  test("keyboard open/close + focus trap + focus restore", async ({ page }) => {
    await signIn(page);

    const bell = page.getByRole("button", { name: /notifications/i });
    await bell.focus();
    await expect(bell).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: /notifications/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(bell).toHaveAttribute("aria-expanded", "true");

    await assertFocusTrap(page, '[role="dialog"][aria-modal="true"]');

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(bell).toHaveAttribute("aria-expanded", "false");
    await expect(bell).toBeFocused();
  });
});

test.describe("ShareButton sheet a11y", () => {
  test.skip(!USER || !PASS, "Auth creds required");

  test("keyboard open/close + focus trap + focus restore", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/community");

    const share = page.getByRole("button", { name: /share/i }).first();
    await share.focus();
    await page.keyboard.press("Enter");

    const sheet = page.getByRole("dialog", { name: /share/i });
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute("aria-modal", "true");

    await assertFocusTrap(page, '[role="dialog"][aria-modal="true"]');

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(share).toBeFocused();
  });
});
