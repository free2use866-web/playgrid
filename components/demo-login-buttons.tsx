"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enterDemo, type DemoRole } from "@/lib/demo-session";

export function DemoLoginButtons({ compact = false }: { compact?: boolean }) {
  const [pendingRole, setPendingRole] = useState<DemoRole | null>(null);

  function handleDemo(role: DemoRole) {
    setPendingRole(role);
    enterDemo(role);
  }

  return (
    <div className={compact ? "mt-5" : "mt-6"}>
      <div className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        Preview with sample data
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
      <div className="grid gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleDemo("student")}
          disabled={pendingRole !== null}
          aria-label="Enter Student Demo with isolated sample data"
          aria-busy={pendingRole === "student"}
          className="entry-demo-button h-auto min-h-[66px] w-full justify-start whitespace-normal px-3.5 py-3 text-left"
        >
          <span aria-hidden="true" className="entry-demo-index">01</span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-[var(--text)]">
              Student Demo
            </span>
            {!compact ? (
              <span className="mt-0.5 block text-xs font-normal leading-4 text-[var(--muted)]">
                Markets, games, and rankings
              </span>
            ) : null}
          </span>
          {pendingRole !== "student" ? (
            <ArrowUpRight
              aria-hidden="true"
              className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--muted)]"
            />
          ) : null}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleDemo("admin")}
          disabled={pendingRole !== null}
          aria-label="Enter Admin Demo with isolated sample data"
          aria-busy={pendingRole === "admin"}
          className="entry-demo-button h-auto min-h-[66px] w-full justify-start whitespace-normal px-3.5 py-3 text-left"
        >
          <span aria-hidden="true" className="entry-demo-index">02</span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-[var(--text)]">
              Admin Demo
            </span>
            {!compact ? (
              <span className="mt-0.5 block text-xs font-normal leading-4 text-[var(--muted)]">
                Controls, queues, and audit views
              </span>
            ) : null}
          </span>
          {pendingRole !== "admin" ? (
            <ArrowUpRight
              aria-hidden="true"
              className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--muted)]"
            />
          ) : null}
        </Button>
      </div>
      <p
        className="mt-3 text-center text-xs leading-5 text-[var(--muted)]"
        aria-live="polite"
      >
        {pendingRole
          ? `Opening ${pendingRole === "admin" ? "Admin" : "Student"} Demo…`
          : "Demos are isolated, reset on exit, and never change live records."}
      </p>
    </div>
  );
}
