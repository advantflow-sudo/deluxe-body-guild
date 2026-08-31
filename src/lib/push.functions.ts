import { createServerFn } from "@tanstack/react-start";

/** Public VAPID key so the browser can create a real push subscription. */
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env["VAPID_PUBLIC_KEY"]?.trim() ?? null };
});
