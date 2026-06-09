import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { GoldButton, OutlineButton } from "./ui";

const STORAGE_KEY = "df_cookie_consent_v1";

type Prefs = { essential: true; analytics: boolean; marketing: boolean; ts: number };

function readPrefs(): Prefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Prefs) : null;
  } catch {
    return null;
  }
}

function savePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("df:cookie-consent", { detail: prefs }));
  } catch {
    /* no-op */
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readPrefs();
    if (!existing) setVisible(true);
  }, []);

  const acceptAll = () => {
    savePrefs({ essential: true, analytics: true, marketing: true, ts: Date.now() });
    setVisible(false);
    setManageOpen(false);
  };

  const rejectNonEssential = () => {
    savePrefs({ essential: true, analytics: false, marketing: false, ts: Date.now() });
    setVisible(false);
    setManageOpen(false);
  };

  const saveCustom = () => {
    savePrefs({ essential: true, analytics, marketing, ts: Date.now() });
    setVisible(false);
    setManageOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Banner */}
      {!manageOpen && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-gold/30 bg-deluxe-black/95 p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300 sm:p-6"
        >
          <div className="flex items-start gap-4">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/5 sm:flex">
              <Cookie className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                Cookies & Privacy
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                We use cookies to run Deluxe Fitness, measure performance and personalise your
                experience. You can accept all or choose which categories to allow. Read our{" "}
                <a href="/privacy" className="text-gold underline-offset-4 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <GoldButton onClick={acceptAll}>Accept all</GoldButton>
                <OutlineButton onClick={() => setManageOpen(true)}>Manage preferences</OutlineButton>
                <button
                  onClick={rejectNonEssential}
                  className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground hover:text-gold"
                >
                  Reject non-essential
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preference modal */}
      {manageOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gold/30 bg-deluxe-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="flex items-center justify-between border-b border-gold/15 px-6 py-4">
              <h2 className="font-display text-lg text-foreground">Cookie preferences</h2>
              <button
                onClick={() => setManageOpen(false)}
                aria-label="Close"
                className="text-foreground/60 transition hover:text-gold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <PrefRow
                title="Essential"
                desc="Required for login, security and basic site functionality. Always on."
                checked
                disabled
              />
              <PrefRow
                title="Analytics"
                desc="Helps us understand how members use the app so we can improve it."
                checked={analytics}
                onChange={setAnalytics}
              />
              <PrefRow
                title="Marketing"
                desc="Used to personalise offers and measure marketing campaigns."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gold/15 bg-deluxe-forest/20 px-6 py-4">
              <button
                onClick={rejectNonEssential}
                className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground hover:text-gold"
              >
                Reject non-essential
              </button>
              <OutlineButton onClick={saveCustom}>Save preferences</OutlineButton>
              <GoldButton onClick={acceptAll}>Accept all</GoldButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PrefRow({
  title,
  desc,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gold/15 bg-deluxe-forest/20 p-4">
      <div className="flex-1">
        <div className="font-display text-sm text-foreground">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
      <label className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition ${checked ? "bg-gold" : "bg-deluxe-black border border-gold/30"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-deluxe-black transition ${checked ? "translate-x-6 bg-deluxe-black" : "translate-x-1 bg-gold"}`}
        />
      </label>
    </div>
  );
}
