import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/accept-invite/$code")({
  component: AcceptInvite,
});

function AcceptInvite() {
  const { code } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const accept = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("accept_partner_invite", { _code: code });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
    toast.success("You are now partners!");
    setTimeout(() => navigate({ to: "/app/partner" }), 800);
  };

  useEffect(() => {
    if (user && code && !done) {
      // auto-accept
      void accept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, code]);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12 text-center">
      <SectionLabel>Partner Invite</SectionLabel>
      <h1 className="font-display text-2xl text-gold">Accept invitation</h1>
      <p className="text-sm text-foreground/60">Code: <code className="text-gold">{code}</code></p>
      <GoldButton onClick={accept} disabled={busy || done}>
        {done ? "Accepted!" : busy ? "Accepting..." : "Accept invite"}
      </GoldButton>
    </div>
  );
}
