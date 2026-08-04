import { Activity, ArrowUpRight, Dice5 } from "lucide-react";
import { LoginAccessPanel } from "@/components/login-access-panel";
import { PlayGridBrand } from "@/components/playgrid-brand";

export default function LoginPage() {
  return (
    <main className="entry-shell min-h-[100dvh] overflow-x-clip">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="entry-header mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 lg:px-8">
        <PlayGridBrand href="/" />
        <span className="entry-status">
          <i aria-hidden="true" />
          Play money only
        </span>
      </header>

      <div
        id="main-content"
        className="entry-layout mx-auto grid min-h-[calc(100dvh-72px)] max-w-[1440px] items-center gap-10 px-5 pb-10 pt-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(390px,.82fr)] lg:px-8"
      >
        <section className="entry-intro min-w-0 py-6 lg:pt-10">
          <p className="entry-eyebrow">Sports predictions and original games</p>
          <h1 className="entry-heading mt-5 text-balance">
            Make the call.
            <span>Keep it virtual.</span>
          </h1>
          <p className="entry-subtitle mt-6 max-w-[530px] text-base leading-7 text-[var(--muted)]">
            Read the market, play fast rounds, and compete with credits that
            can never become money.
          </p>

        </section>

        <section className="entry-live-preview" aria-label="Product preview">
            <div className="entry-preview-head">
              <div>
                <p className="entry-preview-label">Tonight on PlayGrid</p>
                <p className="mt-1 text-sm font-semibold">Live product preview</p>
              </div>
              <span className="entry-live-state">
                <Activity aria-hidden="true" className="h-3.5 w-3.5" />
                Updating
              </span>
            </div>

            <div className="entry-preview-grid">
              <article className="entry-market-preview">
                <div className="flex items-center justify-between gap-3">
                  <span className="entry-preview-kicker">Cricket</span>
                  <span className="number text-xs text-[var(--muted)]">42,860 pool</span>
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-[-0.035em]">
                  India vs Australia
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">2nd innings, 31.2 ov</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <span className="entry-outcome">
                    India <strong className="number">1.84x</strong>
                  </span>
                  <span className="entry-outcome">
                    Australia <strong className="number">2.16x</strong>
                  </span>
                </div>
              </article>

              <article className="entry-game-preview">
                <div className="entry-game-icon">
                  <Dice5 aria-hidden="true" className="h-6 w-6" />
                </div>
                <p className="entry-preview-kicker mt-5">Original game</p>
                <h2 className="mt-1 text-lg font-semibold">Dice</h2>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  Quick result, visible receipt, no cash value.
                </p>
                <a className="entry-preview-link mt-5" href="#access-panel">
                  Try the demo <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              </article>
            </div>

            <div className="entry-preview-foot">
              <span><i aria-hidden="true" className="entry-proof-dot" /> No deposits or withdrawals</span>
              <span className="number">1,000 starting credits</span>
            </div>
        </section>

        <div id="access-panel" className="entry-access w-full py-6 lg:py-10">
          <LoginAccessPanel />
        </div>
      </div>
    </main>
  );
}
