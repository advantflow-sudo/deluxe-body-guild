import mark from "@/assets/deluxe-mark.png";

type Props = { showTag?: boolean; className?: string; size?: "sm" | "md" | "lg" };

export function Logo({ showTag = true, className = "", size = "md" }: Props) {
  const markSize = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const wordSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={mark}
        alt="Deluxe Fitness"
        className={`${markSize} object-contain drop-shadow-[0_0_12px_rgba(201,162,76,0.25)]`}
      />
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-2">
          <span className={`font-display ${wordSize} tracking-[0.22em] text-gold-gradient`}>
            DELUXE
          </span>
          <span className="h-px w-3 bg-gold/50" />
          <span className={`font-display ${wordSize} tracking-[0.22em] text-foreground/90`}>
            FITNESS
          </span>
        </div>
        {showTag && (
          <span className="mt-1.5 text-[8.5px] font-medium tracking-[0.4em] text-gold/70">
            DISCIPLINE · TRANSFORM · BECOME DELUXE
          </span>
        )}
      </div>
    </div>
  );
}
