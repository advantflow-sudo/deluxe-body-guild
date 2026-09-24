import { useEffect, useState } from "react";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, OutlineButton } from "@/components/deluxe/ui";

/** Lets iPhone members send Apple Health weight, sleep and steps via a Shortcut. */
export function HealthShortcutSetup() {
  const { user } = useAuth();
  const [status, setStatus] = useState<{ created_at: string; last_used_at: string | null } | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/api/public/health-sync` : "/api/public/health-sync";

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("health_sync_tokens").select("created_at,last_used_at").eq("user_id", user.id).maybeSingle();
    setStatus(data);
  };
  useEffect(() => { void load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("create_health_sync_token");
    setBusy(false);
    if (error) return toast.error(error.message);
    setKey(data as string);
    void load();
  };
  const revoke = async () => {
    await supabase.rpc("revoke_health_sync_token");
    setKey(null); setStatus(null);
    toast.success("Apple Health link turned off");
  };
  const copy = (v: string) => { void navigator.clipboard.writeText(v); toast.success("Copied"); };

  return (
    <div className="mt-4 border border-gold/25 bg-deluxe-black/60 p-4">
      <div className="flex items-center gap-2 font-display text-base text-foreground"><KeyRound className="h-4 w-4 text-gold" /> Apple Health via iPhone Shortcut</div>
      <p className="mt-1 text-xs text-muted-foreground">
        Sends today's weight, sleep and steps from Apple Health to Deluxe so the Coach uses your real numbers.
      </p>
      {status && !key && (
        <p className="mt-2 text-[11px] text-gold">
          Linked · {status.last_used_at ? `last sync ${new Date(status.last_used_at).toLocaleString()}` : "waiting for first sync"}
        </p>
      )}

      {key ? (
        <div className="mt-3 space-y-3 text-xs">
          <p className="text-foreground">Your personal key. Copy it now, because it won't be shown again:</p>
          <button onClick={() => copy(key)} className="flex w-full items-center justify-between gap-2 break-all border border-gold/40 bg-deluxe-black px-2 py-2 text-left font-mono text-[11px] text-gold">
            {key} <Copy className="h-3.5 w-3.5 shrink-0" />
          </button>
          <ol className="list-decimal space-y-1.5 pl-4 text-muted-foreground">
            <li>Open the <b className="text-foreground">Shortcuts</b> app, tap <b className="text-foreground">+</b>, name it "Deluxe Health".</li>
            <li>Add <b className="text-foreground">Find Health Samples</b> → Type <i>Weight</i>, sort latest first, limit 1. Repeat for <i>Sleep</i> (last 1 day) and <i>Steps</i> (today).</li>
            <li>Add <b className="text-foreground">Get Contents of URL</b>: URL <button onClick={() => copy(url)} className="text-gold underline">{url}</button>, method <b>POST</b>.</li>
            <li>Header <b>Authorization</b> = <b>Bearer</b> followed by a space and your key.</li>
            <li>Request body <b>JSON</b> with fields <b>weight_kg</b>, <b>sleep_hours</b>, <b>steps</b>, each set to the matching Health sample.</li>
            <li>In <b className="text-foreground">Automation</b>, run it daily (e.g. 9pm) with "Run immediately" on.</li>
          </ol>
        </div>
      ) : (
        <GoldButton onClick={create} disabled={busy} className="mt-3 w-full">{status ? "Get a new key" : "Set up Apple Health link"}</GoldButton>
      )}
      {status && (
        <OutlineButton onClick={revoke} className="mt-2 w-full"><Trash2 className="h-3 w-3" /> Turn off link</OutlineButton>
      )}
    </div>
  );
}
