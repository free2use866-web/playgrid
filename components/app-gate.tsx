"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { DemoLoginButtons } from "@/components/demo-login-buttons";
import { LoginAccessPanel } from "@/components/login-access-panel";
import { PlayGridBrand } from "@/components/playgrid-brand";
import { getDemoSession, type DemoRole } from "@/lib/demo-session";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function AppGate({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"student" | "admin">("student");
  const [aal2, setAal2] = useState(false);
  const [demoRole, setDemoRole] = useState<DemoRole | null>(null);

  useEffect(() => {
    const demo = getDemoSession();
    if (demo) {
      queueMicrotask(() => {
        setDemoRole(demo.role);
        setRole(demo.role);
        setAal2(demo.role === "admin");
        setLoading(false);
      });
      return;
    }

    const preview =
      process.env.NODE_ENV === "development" &&
      window.location.hostname === "terminal.local";
    if (preview) {
      queueMicrotask(() => {
        setRole(requireAdmin ? "admin" : "student");
        setAal2(requireAdmin);
        setLoading(false);
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    let active = true;
    const assessSession = async (nextSession: Session | null) => {
      let nextRole: "student" | "admin" = "student";
      let nextAal2 = false;

      if (nextSession) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", nextSession.user.id)
          .maybeSingle();
        if (profile?.role === "admin") nextRole = "admin";

        if (requireAdmin) {
          const { data: assurance } =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          nextAal2 = assurance?.currentLevel === "aal2";
        }
      }

      if (!active) return;
      setSession(nextSession);
      setRole(nextRole);
      setAal2(nextAal2);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => assessSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void assessSession(nextSession);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [requireAdmin]);

  if (loading) {
    return (
      <main
        className="entry-shell grid min-h-[100dvh] place-items-center px-5"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="text-center">
          <PlayGridBrand href="/" />
          <LoaderCircle
            aria-hidden="true"
            className="mx-auto mt-5 h-5 w-5 animate-spin text-[var(--primary)]"
          />
          <p className="mt-3 text-xs text-[var(--muted)]">
            Checking your session…
          </p>
        </div>
      </main>
    );
  }

  if (!session && !demoRole && process.env.NODE_ENV !== "development") {
    return (
      <main className="entry-shell min-h-[100dvh] px-5 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <PlayGridBrand href="/" />
          <span className="entry-status">
            <i aria-hidden="true" />
            Play money only
          </span>
        </div>
        <div className="mx-auto grid min-h-[calc(100vh-104px)] max-w-md place-items-center py-10">
          <LoginAccessPanel compact />
        </div>
      </main>
    );
  }

  if (requireAdmin && (role !== "admin" || !aal2)) {
    return (
      <main className="entry-shell grid min-h-[100dvh] place-items-center px-5 py-10">
        <section className="entry-panel w-full max-w-md">
          <div className="entry-panel-meta" aria-hidden="true">
            <span>Access / 02</span>
            <span className="text-[var(--loss)]">Restricted</span>
          </div>
          <p className="entry-eyebrow mt-8">Restricted workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            Admin access required
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            This area requires an admin role and a verified MFA session.
          </p>
          {demoRole === "student" ? <DemoLoginButtons compact /> : null}
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
