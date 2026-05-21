type Props = { showTag?: boolean; className?: string };

export function Logo({ showTag = true, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gold/60 bg-deluxe-black">
        <span className="font-display text-2xl leading-none tracking-tighter text-gold">
          DF
        </span>
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl tracking-[0.18em] text-foreground">
            DELUXE
          </span>
          <span className="h-px w-3 bg-gold/50" />
          <span className="font-display text-xl tracking-[0.18em] text-gold">
            FITNESS
          </span>
        </div>
        {showTag && (
          <span className="mt-0.5 text-[9px] font-semibold tracking-[0.35em] text-muted-foreground">
            DISCIPLINE · TRANSFORM · BECOME DELUXE
          </span>
        )}
      </div>
    </div>
  );
}
