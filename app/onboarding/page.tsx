"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { AppGate } from "@/components/app-gate";
import { PlayGridBrand } from "@/components/playgrid-brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDemoSession } from "@/lib/demo-session";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function OnboardingPage() {
  const [username, setUsername] = useState("");
  const [referral, setReferral] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);

  const validUsername = /^[a-z0-9_]{3,20}$/.test(username);

  async function finish() {
    setLoading(true);
    setError("");
    if (getDemoSession()) {
      window.location.replace("/sports");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured.");
      setLoading(false);
      return;
    }
    const { error: rpcError } = await supabase.rpc("finish_onboarding", {
      p_username: username,
      p_referral_code: referral || null,
      p_request_id: crypto.randomUUID(),
    });
    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }
    window.location.replace("/sports");
  }

  return (
    <AppGate>
      <main className="entry-shell min-h-[100dvh] overflow-x-clip px-5 py-6 text-[var(--text)] sm:px-8">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between border-b border-[var(--border)] pb-5">
          <PlayGridBrand href="/" />
          <span className="entry-status"><i aria-hidden="true" /> Identity setup</span>
        </header>
        <div className="onboarding-layout mx-auto grid min-h-[calc(100dvh-90px)] w-full max-w-5xl items-center gap-10 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)]">
          <section>
            <p className="entry-eyebrow">Account / 02</p>
            <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
              Create your PlayGrid identity
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
              One initial username plus one lifetime rename.
            </p>
            <form
              className="onboarding-form mt-8"
              onSubmit={(event) => {
                event.preventDefault();
                setUsernameTouched(true);
                if (validUsername && accepted && !loading) void finish();
              }}
            >
                <label className="block text-sm font-semibold" htmlFor="username">
                  Unique username
                </label>
                <div className="mt-2">
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value.toLowerCase().replace(/\s/g, "_"),
                      )
                    }
                    placeholder="probability_king"
                    maxLength={20}
                    onBlur={() => setUsernameTouched(true)}
                    aria-describedby="username-guidance username-feedback"
                    aria-invalid={usernameTouched && !validUsername}
                  />
                </div>
                <p id="username-guidance" className="mt-2 text-xs text-[var(--muted)]">
                  3-20 lowercase letters, numbers, and underscores.
                </p>
                <p
                  id="username-feedback"
                  aria-live="polite"
                  className={
                    usernameTouched
                      ? `mt-1 text-xs ${validUsername ? "text-[var(--primary)]" : "text-[var(--loss)]"}`
                      : "sr-only"
                  }
                >
                  {usernameTouched
                    ? validUsername
                      ? "Username format is valid."
                      : "Use 3-20 lowercase letters, numbers, or underscores."
                    : ""}
                </p>

                <label className="mt-5 block text-sm font-semibold" htmlFor="referral">
                  Referral code <span className="font-normal text-[var(--muted)]">(optional)</span>
                </label>
                <div className="mt-2">
                  <Input
                    id="referral"
                    value={referral}
                    onChange={(event) =>
                      setReferral(event.target.value.toUpperCase().trim())
                    }
                    placeholder="PG-FRIEND"
                    className="font-mono"
                    maxLength={24}
                  />
                </div>

                <label className="onboarding-consent mt-6 flex cursor-pointer gap-3 p-3">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus)]"
                  />
                  <span className="text-xs leading-5 text-[var(--muted)]">
                    I understand credits have no monetary value and cannot be
                    purchased, transferred, sold, or redeemed.
                  </span>
                </label>

                {error ? (
                  <p className="mt-3 text-xs text-[var(--loss)]" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button
                  size="lg"
                  className="mt-5 w-full"
                  disabled={!validUsername || !accepted || loading}
                  type="submit"
                >
                  {loading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Claim username and continue
                </Button>
            </form>
          </section>

          <aside className="onboarding-ledger" aria-label="Welcome credit allocation">
            <div className="entry-panel-meta" aria-hidden="true">
              <span>Welcome allocation</span>
              <span>1,000 total</span>
            </div>
            <h2 className="mt-8 text-lg font-semibold">Your starting balance</h2>
            <dl className="mt-5">
              <div><dt>Sports Credits</dt><dd>500</dd></div>
              <div><dt>Arcade Credits</dt><dd>500</dd></div>
            </dl>
            <div className="mt-8 border-t border-[var(--border)] pt-5">
              <p className="text-sm font-semibold">Identity stays private</p>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                Other users see your username, never your institution email.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </AppGate>
  );
}
