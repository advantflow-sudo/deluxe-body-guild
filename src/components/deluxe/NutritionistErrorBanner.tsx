import { AlertTriangle, CreditCard, Clock, LogIn, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { FAILURE_COPY, type NutritionistFailure } from "@/lib/nutritionist";

export function NutritionistErrorBanner({
  kind,
  detail,
  retrying,
  onRetry,
  onDismiss,
}: {
  kind: NutritionistFailure;
  detail?: string;
  retrying?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  const copy = FAILURE_COPY[kind];
  const Icon =
    kind === "rate_limited" ? Clock : kind === "out_of_credits" ? CreditCard : kind === "session_expired" ? LogIn : AlertTriangle;

  return (
    <div
      role="alert"
      className="mt-5 border border-gold/40 bg-deluxe-black/60 p-4"
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gold">{copy.title}</div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{detail ?? copy.detail}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {kind === "session_expired" ? (
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center gap-2 border border-gold/50 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/10"
              >
                <LogIn className="h-3 w-3" /> Sign in again
              </Link>
            ) : (
              onRetry && (
                <button
                  onClick={onRetry}
                  disabled={retrying}
                  className="inline-flex min-h-11 items-center gap-2 border border-gold/50 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/10 disabled:opacity-50"
                >
                  {retrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {retrying ? "Retrying…" : "Retry"}
                </button>
              )
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="min-h-11 px-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
