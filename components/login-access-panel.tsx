import { DemoLoginButtons } from "@/components/demo-login-buttons";
import { GoogleLoginButton } from "@/components/google-login-button";

export function LoginAccessPanel({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className="entry-panel"
      aria-labelledby={compact ? "gate-login-title" : "page-login-title"}
    >
      <div className="entry-panel-meta" aria-hidden="true">
        <span>Access / 01</span>
        <span className="entry-panel-signal"><i /> Ready</span>
      </div>
      <p className="entry-eyebrow mt-8">Member access</p>
      <h2
        id={compact ? "gate-login-title" : "page-login-title"}
        className="mt-2 text-[1.7rem] font-semibold tracking-[-0.045em] text-[var(--text)]"
      >
        Enter PlayGrid
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
        Use an eligible institution-managed Google account, or explore every
        feature with isolated demo data.
      </p>

      <GoogleLoginButton className="mt-6" />
      <DemoLoginButtons compact={compact} />

      <div className="entry-assurance mt-6">
        <p className="text-xs font-semibold text-[var(--text)]">
          Play money stays play money
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          No deposits, transfers, cash-out, or monetary value.
        </p>
      </div>

      <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
        Independent social-gaming project. Not affiliated with or endorsed by
        any educational institution.
      </p>
    </section>
  );
}
