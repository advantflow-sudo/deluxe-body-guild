import mark from "@/assets/deluxe-mark.webp";

type Props = { showTag?: boolean; className?: string; size?: "sm" | "md" | "lg" };

export function Logo({ showTag = true, className = "", size = "md" }: Props) {
  const markSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-9 w-9 sm:h-11 sm:w-11";
  const wordSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-base sm:text-xl";
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <img
        src={mark}
        alt="Deluxe Fitness"
        className={`${markSize} object-contain drop-shadow-[0_0_12px_rgba(201,162,76,0.25)]`}
      />
      <div className="flex min-w-0 flex-col leading-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`font-display ${wordSize} tracking-[0.18em] sm:tracking-[0.22em] text-gold-gradient`}>
            DELUXE
          </span>
          <span className="h-px w-2 bg-gold/50 sm:w-3" />
          <span className={`font-display ${wordSize} tracking-[0.18em] sm:tracking-[0.22em] text-foreground/90`}>
            FITNESS
          </span>
        </div>
        {showTag && (
          <span className="mt-1 hidden text-[8.5px] font-medium tracking-[0.4em] text-gold/70 sm:mt-1.5 sm:inline">
            DISCIPLINE · TRANSFORM · BECOME DELUXE
          </span>
        )}
      </div>
    </div>
  );
}
