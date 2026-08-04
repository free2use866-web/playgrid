import Link from "next/link";
import { cn } from "@/lib/utils";

export function PlayGridBrand({
  className,
  quiet = false,
  href,
}: {
  className?: string;
  quiet?: boolean;
  href?: string;
}) {
  const brand = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "brand-mark relative grid grid-cols-2 gap-[3px] overflow-hidden rounded-[9px] bg-[var(--primary)] p-[7px]",
          quiet ? "h-8 w-8" : "h-9 w-9",
        )}
      >
        <i className="rounded-[1px] bg-[var(--primary-foreground)]" />
        <i className="rounded-[1px] bg-[var(--primary-foreground)]" />
        <i className="rounded-[1px] bg-[var(--primary-foreground)]" />
        <i className="rounded-[1px] ring-1 ring-inset ring-[var(--primary-foreground)]" />
      </span>
      <span
        className={cn(
          "font-semibold tracking-[-0.04em] text-[var(--text)]",
          quiet ? "text-base" : "text-lg",
        )}
      >
        PlayGrid
      </span>
    </span>
  );

  return href ? (
    <Link
      href={href}
      className="rounded-[9px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--canvas)]"
      aria-label="PlayGrid home"
    >
      {brand}
    </Link>
  ) : (
    brand
  );
}
