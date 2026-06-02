import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Users, Copy, Sparkles, Send, Trash2, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/app/partner")({
  component: PartnerPage,
});

interface Partnership {
  id: string;
  user_a: string;
  user_b: string;
  status: string;
  pairing_mode: string;
  created_at: string;
}
interface Profile { id: string; display_name: string | null; avatar_url: string | null }
interface Nudge { id: string; from_user: string; to_user: string; kind: string; message: string | null; created_at: string; read_at: string | null }

function PartnerPage() {
  const { user } = useAuth();
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [partnerScore, setPartnerScore] = useState<number>(0);
  const [partnerStreak, setPartnerStreak] = useState<number>(0);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [invite, setInvite] = useState<{ code: string } | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: parts } = await supabase
      .from("partnerships")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .eq("status", "active")
      .limit(1);
    const p = parts?.[0] ?? null;
    setPartnership(p as Partnership | null);

    if (p) {
      const otherId = p.user_a === user.id ? p.user_b : p.user_a;
      const [prof, scoreRes, streakRes, nudgeRes] = await Promise.all([
        supabase.from("profiles").select("id,display_name,avatar_url").eq("id", otherId).maybeSingle(),
        supabase.from("daily_scores").select("total").eq("user_id", otherId).eq("score_date", new Date().toISOString().slice(0, 10)).maybeSingle(),
        supabase.from("streaks").select("current_len").eq("user_id", otherId).maybeSingle(),
        supabase.from("partner_nudges").select("*").eq("partnership_id", p.id).order("created_at", { ascending: false }).limit(20),
      ]);
      setPartnerProfile(prof.data ?? null);
      setPartnerScore(scoreRes.data?.total ?? 0);
      setPartnerStreak(streakRes.data?.current_len ?? 0);
      setNudges((nudgeRes.data ?? []) as Nudge[]);

      // mark unread inbound nudges as read
      await supabase.from("partner_nudges").update({ read_at: new Date().toISOString() })
        .eq("partnership_id", p.id).eq("to_user", user.id).is("read_at", null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  // Realtime nudges
  useEffect(() => {
    if (!partnership) return;
    const ch = supabase
      .channel(`partner-nudges-${partnership.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "partner_nudges", filter: `partnership_id=eq.${partnership.id}` },
        (payload) => setNudges((n) => [payload.new as Nudge, ...n]))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [partnership]);

  const createInvite = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("create_partner_invite");
    setBusy(false);
    if (error) return toast.error(error.message);
    setInvite({ code: (data as any).code });
    toast.success("Invite code created");
  };

  const acceptInvite = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("accept_partner_invite", { _code: code.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Partner accepted!");
    setCode("");
    void load();
  };

  const autoMatch = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("auto_match_partner");
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Matched!");
    void load();
  };

  const sendNudge = async (kind: "cheer" | "callout" | "challenge") => {
    if (!partnership || !user) return;
    const otherId = partnership.user_a === user.id ? partnership.user_b : partnership.user_a;
    const { error } = await supabase.from("partner_nudges").insert({
      partnership_id: partnership.id, from_user: user.id, to_user: otherId,
      kind, message: message.trim() || null,
    });
    if (error) return toast.error(error.message);
    setMessage("");
    toast.success(`${kind === "cheer" ? "Cheer" : kind === "callout" ? "Callout" : "Challenge"} sent`);
  };

  const endPartnership = async () => {
    if (!partnership) return;
    if (!confirm("End this partnership?")) return;
    await supabase.from("partnerships").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", partnership.id);
    setPartnership(null); setPartnerProfile(null);
    toast("Partnership ended");
  };

  const inviteLink = invite ? `${window.location.origin}/accept-invite/${invite.code}` : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-28">
      <header className="space-y-1">
        <SectionLabel>Accountability</SectionLabel>
        <h1 className="font-display text-2xl text-gold">Your Partner</h1>
      </header>

      {loading ? (
        <div className="text-foreground/50">Loading...</div>
      ) : partnership && partnerProfile ? (
        <div className="space-y-5">
          <div className="border border-gold/25 bg-deluxe-charcoal/60 p-5">
            <div className="flex items-center gap-4">
              {partnerProfile.avatar_url ? (
                <img src={partnerProfile.avatar_url} alt="" className="h-14 w-14 rounded-full border border-gold/30 object-cover" />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-full border border-gold/30 bg-deluxe-black text-gold"><Users className="h-6 w-6" /></div>
              )}
              <div className="flex-1">
                <div className="font-display text-lg text-foreground">{partnerProfile.display_name ?? "Partner"}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-foreground/50">{partnership.pairing_mode === "auto" ? "Auto-matched" : "Invited"}</div>
              </div>
              <button onClick={endPartnership} aria-label="End partnership" className="text-foreground/40 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="border border-gold/15 bg-deluxe-black/60 p-3 text-center">
                <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">Today</div>
                <div className="font-display text-2xl text-gold">{partnerScore}</div>
              </div>
              <div className="border border-gold/15 bg-deluxe-black/60 p-3 text-center">
                <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">Streak</div>
                <div className="font-display text-2xl text-gold">{partnerStreak}</div>
              </div>
            </div>
          </div>

          <div className="border border-gold/20 bg-deluxe-charcoal/40 p-5 space-y-3">
            <SectionLabel>Send a nudge</SectionLabel>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional message..."
              maxLength={200}
              className="w-full border border-gold/20 bg-deluxe-black/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-gold/50 focus:outline-none"
            />
            <div className="grid grid-cols-3 gap-2">
              <OutlineButton onClick={() => sendNudge("cheer")} className="!px-2 !py-2 !text-[10px]"><Heart className="h-3 w-3" />Cheer</OutlineButton>
              <OutlineButton onClick={() => sendNudge("callout")} className="!px-2 !py-2 !text-[10px]"><Send className="h-3 w-3" />Callout</OutlineButton>
              <OutlineButton onClick={() => sendNudge("challenge")} className="!px-2 !py-2 !text-[10px]"><Sparkles className="h-3 w-3" />Challenge</OutlineButton>
            </div>
          </div>

          <div>
            <SectionLabel>Recent nudges</SectionLabel>
            <ul className="mt-3 space-y-2">
              {nudges.length === 0 ? (
                <li className="text-sm text-foreground/40">No nudges yet — send the first one.</li>
              ) : nudges.map((n) => {
                const me = n.from_user === user?.id;
                return (
                  <li key={n.id} className={`border ${me ? "border-gold/15 bg-deluxe-black/40" : "border-gold/30 bg-gold/5"} px-3 py-2 text-sm`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-gold">{me ? "You" : "Partner"} · {n.kind}</span>
                      <span className="text-[10px] text-foreground/40">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {n.message && <div className="mt-1 text-foreground/80">{n.message}</div>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="border border-gold/25 bg-deluxe-charcoal/60 p-5 space-y-3">
            <SectionLabel>Invite someone you know</SectionLabel>
            <p className="text-sm text-foreground/60">Generate a code and share it. They tap the link to pair.</p>
            <GoldButton onClick={createInvite} disabled={busy}>Generate invite</GoldButton>
            {invite && (
              <div className="space-y-2 border border-gold/20 bg-deluxe-black/60 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">Share this link</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate text-xs text-gold">{inviteLink}</code>
                  <button
                    onClick={() => { void navigator.clipboard.writeText(inviteLink); toast.success("Copied"); }}
                    className="text-foreground/60 hover:text-gold"
                  ><Copy className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>

          <div className="border border-gold/25 bg-deluxe-charcoal/60 p-5 space-y-3">
            <SectionLabel>Have a code?</SectionLabel>
            <div className="flex gap-2">
              <input
                value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="Paste invite code"
                className="flex-1 border border-gold/20 bg-deluxe-black/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-gold/50 focus:outline-none"
              />
              <OutlineButton onClick={acceptInvite} disabled={busy} className="!px-4 !py-2 !text-[10px]">Accept</OutlineButton>
            </div>
          </div>

          <div className="border border-gold/25 bg-deluxe-charcoal/60 p-5 space-y-3">
            <SectionLabel>No one to invite?</SectionLabel>
            <p className="text-sm text-foreground/60">We'll match you with someone at a similar training level.</p>
            <GoldButton onClick={autoMatch} disabled={busy}>Auto-match me</GoldButton>
          </div>
        </div>
      )}

      <div className="pt-4 text-center">
        <Link to="/app" className="text-xs uppercase tracking-[0.2em] text-foreground/40 hover:text-gold">← Back</Link>
      </div>
    </div>
  );
}
