import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "ui-input h-11 w-full rounded-[9px] border border-[var(--border)] bg-[var(--canvas)] px-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus-soft)] aria-invalid:border-[var(--loss)] aria-invalid:ring-2 aria-invalid:ring-[var(--focus-soft)]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
