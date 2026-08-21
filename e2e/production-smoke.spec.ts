import { test, expect } from "@playwright/test";

/**
 * End-to-end smoke coverage for the public production surface:
 * landing, PWA install assets, login options, auth guard, and checkout entry.
 * Authenticated flows (dashboard, workout sync, Stripe checkout redirect) require
 * a seeded test member and are covered by the authenticated specs.
 */

test.describe("public smoke", () => {
  test("landing renders hero and has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await page.locator("video").count()).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test("PWA manifest and service worker are available", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const href = await page.evaluate(
      () => document.querySelector("link[rel=manifest]")?.getAttribute("href") ?? null,
    );
    expect(href).toBeTruthy();
    const manifest = await request.get(href!);
    expect(manifest.ok()).toBeTruthy();
    const json = await manifest.json();
    expect(json.display).toBe("standalone");
    expect(Array.isArray(json.icons) && json.icons.length).toBeTruthy();
    expect((await request.get("/sw.js")).ok()).toBeTruthy();
  });

  test("login offers only Gmail and email methods", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toContain("gmail");
    expect(body).toContain("sign-in link");
    for (const banned of ["facebook", "apple id", "twitter", "github", "discord"]) {
      expect(body).not.toContain(banned);
    }
  });

  test("dashboard redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    expect(page.url()).toContain("/login");
  });

  test("pricing page exposes subscription tiers", async ({ page }) => {
    const res = await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    const body = (await page.locator("body").innerText()).toLowerCase();
    for (const tier of ["essential", "signature", "private"]) {
      expect(body).toContain(tier);
    }
  });

  test("stripe webhook health endpoint reports a valid configuration", async ({ request }) => {
    const res = await request.get("/api/public/webhooks/stripe-health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.secret?.looksValid ?? json.secretLooksValid).toBeTruthy();
  });
});
