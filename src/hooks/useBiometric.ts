import { useCallback, useEffect, useState } from "react";

const ENABLED_KEY = "df_biometric_enabled_v1";
const CRED_KEY = "df_biometric_cred_v1";

function b64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function unb64(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/**
 * Lightweight biometric ("Face ID / Touch ID") gate using WebAuthn platform authenticator.
 * Stores the credential id locally and uses navigator.credentials.get() as a unlock challenge.
 * Not a full server-attested WebAuthn flow — used purely to lock the local app.
 */
export function useBiometric() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const ok = typeof window !== "undefined"
      && typeof PublicKeyCredential !== "undefined"
      && !!navigator.credentials;
    setSupported(ok);
    if (typeof window !== "undefined") {
      setEnabled(localStorage.getItem(ENABLED_KEY) === "1" && !!localStorage.getItem(CRED_KEY));
    }
    if (ok && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then((avail) => {
        if (!avail) setSupported(false);
      }).catch(() => setSupported(false));
    }
  }, []);

  const enable = useCallback(async (userId: string, userName: string) => {
    if (!supported) throw new Error("Biometric not supported on this device.");
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Deluxe Fitness", id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
        timeout: 60_000,
        attestation: "none",
      },
    }) as PublicKeyCredential | null;
    if (!cred) throw new Error("No credential created");
    localStorage.setItem(CRED_KEY, b64(cred.rawId));
    localStorage.setItem(ENABLED_KEY, "1");
    setEnabled(true);
  }, [supported]);

  const verify = useCallback(async () => {
    const id = localStorage.getItem(CRED_KEY);
    if (!id) throw new Error("Biometric not enrolled");
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: unb64(id), type: "public-key", transports: ["internal"] }],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    return !!assertion;
  }, []);

  const disable = useCallback(() => {
    localStorage.removeItem(ENABLED_KEY);
    localStorage.removeItem(CRED_KEY);
    setEnabled(false);
  }, []);

  return { supported, enabled, enable, verify, disable };
}
