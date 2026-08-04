"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { PlayGridBrand } from "@/components/playgrid-brand";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [state, setState] = useState<"working" | "error">("working");
  const [message, setMessage] = useState("Verifying your Google account…");

  useEffect(() => {
    async function complete() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setState("error");
        setMessage("Authentication is not configured.");
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setState("error");
          setMessage(error.message);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setState("error");
        setMessage("No verified session was returned.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.session.user.id)
        .maybeSingle();

      setMessage("Verified. Preparing your account…");
      window.location.replace(profile?.username ? "/sports" : "/onboarding");
    }

    complete();
  }, []);

  return (
    <main className="entry-shell grid min-h-[100dvh] place-items-center overflow-x-clip px-5 py-10">
      <section className="entry-panel w-full max-w-md">
        <PlayGridBrand href="/" />
        <div className="entry-panel-meta mt-8" aria-hidden="true">
          <span>Google callback</span>
          <span className={state === "error" ? "text-[var(--loss)]" : "text-[var(--primary)]"}>
            {state === "working" ? "Verifying" : "Blocked"}
          </span>
        </div>
        <div className="py-8">
          {state === "working" ? (
            <LoaderCircle aria-hidden="true" className="h-7 w-7 animate-spin text-[var(--primary)]" />
          ) : (
            <span aria-hidden="true" className="font-mono text-sm font-bold text-[var(--loss)]">ERROR / 01</span>
          )}
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
            {state === "working" ? "Signing you in" : "Sign-in blocked"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{message}</p>
          {state === "error" ? (
            <Link href="/" prefetch={false} className="ui-pressable mt-6 inline-flex h-11 items-center justify-center rounded-[9px] bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)]">
              Return to login
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
