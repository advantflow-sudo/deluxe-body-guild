import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { haptic } from "@/hooks/useHaptics";

type Tone = "default" | "danger" | "warning";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  icon?: ReactNode;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(Ctx);
  if (!fn) throw new Error("useConfirm must be used within <ConfirmDialogProvider>");
  return fn;
}

interface PendingState extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    haptic("warning");
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    if (!pending) return;
    pending.resolve(value);
    haptic(value ? "success" : "light");
    setPending(null);
  };

  const tone = pending?.tone ?? "default";
  const confirmTone =
    tone === "danger"
      ? "bg-red-500/90 text-white hover:bg-red-500"
      : tone === "warning"
      ? "bg-gold text-deluxe-black hover:bg-gold/90"
      : "bg-gold text-deluxe-black hover:bg-gold/90";

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) close(false); }}>
        <AlertDialogContent className="border border-gold/30 bg-deluxe-black/95 text-foreground shadow-[0_0_60px_-10px_rgba(212,175,55,0.35)] backdrop-blur">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-display text-xl text-gold">
              {pending?.icon}
              {pending?.title}
            </AlertDialogTitle>
            {pending?.description && (
              <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {pending.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => close(false)}
              className="border-gold/20 bg-transparent text-foreground hover:bg-gold/10"
            >
              {pending?.cancelLabel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => close(true)}
              className={`border-0 uppercase tracking-[0.15em] ${confirmTone}`}
            >
              {pending?.confirmLabel ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Ctx.Provider>
  );
}
