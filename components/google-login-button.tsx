"use client";

import { useId, useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.64-2.42l-3.24-2.51c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.9A6.02 6.02 0 0 1 6.08 12c0-.66.11-1.3.31-1.9V7.51H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.49l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.97c1.47 0 2.79.5 3.82 1.49l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.59C7.18 7.73 9.39 5.97 12 5.97Z"
      />
    </svg>
  );
}

export function GoogleLoginButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const errorId = useId();

  async function handleLogin() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured yet.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
        },
      });

      if (authError) {
        setError(
          authError.message.toLowerCase().includes("provider")
            ? "Google sign-in is unavailable right now. You can still use either demo below."
            : authError.message,
        );
        setLoading(false);
      }
    } catch {
      setError("We could not start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        aria-busy={loading}
        aria-describedby={error ? errorId : undefined}
        className="entry-google-button h-12 w-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
      >
        {loading ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {loading ? "Connecting to Google…" : "Continue with Google"}
      </Button>
      {error ? (
        <p
          id={errorId}
          className="entry-error mt-3 flex items-start gap-2 text-left text-[11px] leading-5 text-[var(--loss)]"
          role="alert"
        >
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
          />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
