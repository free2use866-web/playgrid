import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "live" | "win" | "warning";
}) {
  const tones = {
    neutral: "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--muted)]",
    live: "border-[#ff667d55] bg-[#ff667d16] text-[var(--loss)]",
    win: "border-[#2ed6a155] bg-[#2ed6a116] text-[var(--win)]",
    warning: "border-[#f5c45155] bg-[#f5c45116] text-[var(--warning)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
