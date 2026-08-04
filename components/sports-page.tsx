"use client";

import { useId, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Radio,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { AppGate } from "@/components/app-gate";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  sportsMarkets,
  type Outcome,
  type SportsMarket,
} from "@/lib/demo-data";
import { getDemoSession, useDemoSession } from "@/lib/demo-session";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const sportFilters = ["All", "Cricket", "Football", "Basketball", "Tennis", "Esports", "More"];
const statusFilters = ["Live", "Upcoming", "Futures", "Settled"];

type Selection = {
  market: SportsMarket;
  outcome: Outcome;
};

function formatCredits(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function OutcomeButton({
  outcome,
  selected,
  onClick,
}: {
  outcome: Outcome;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Back ${outcome.label}, ${outcome.share} percent pool share, projected ${outcome.multiplier} times return`}
      className={cn(
        "ui-pressable flex min-h-14 w-full min-w-0 items-center justify-between gap-3 rounded-[9px] border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] sm:block sm:min-h-[66px] sm:flex-1",
        selected
          ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[inset_3px_0_0_var(--primary)] sm:shadow-none"
          : "border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]",
      )}
    >
      <span className="min-w-0 truncate text-sm font-semibold">{outcome.label}</span>
      <span className="flex shrink-0 items-center gap-3 text-xs sm:mt-1 sm:justify-between">
        <span className="text-[var(--muted)]">{outcome.share.toFixed(1)}%</span>
        <strong className="min-w-[3.75rem] text-right font-mono text-[var(--primary)]">
          {outcome.multiplier.toFixed(2)}×
        </strong>
      </span>
    </button>
  );
}

function MarketCard({
  market,
  selection,
  onSelect,
}: {
  market: SportsMarket;
  selection: Selection | null;
  onSelect: (outcome: Outcome) => void;
}) {
  return (
    <Card className="market-card overflow-hidden">
      <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)] sm:px-4">
        <Badge tone={market.status === "LIVE" ? "live" : "neutral"}>
          {market.status === "LIVE" ? <Radio className="mr-1 h-3 w-3" /> : null}
          {market.status}
        </Badge>
        <span className="min-w-0 flex-1 truncate">{market.clock}</span>
        <span className="w-full text-right font-mono tabular-nums sm:ml-auto sm:w-auto">
          {formatCredits(market.pool)} pool
        </span>
      </div>
      <CardContent className="p-3 sm:p-4">
        <a
          href={`/sports/${market.slug}`}
          className="group flex min-h-11 items-start justify-between gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--muted)]">{market.league}</p>
            <h3 className="mt-1 text-[15px] font-semibold tracking-tight sm:text-base">
              {market.home} <span className="text-[var(--muted)]">vs</span>{" "}
              {market.away}
            </h3>
            {market.score ? (
              <p className="mt-1.5 font-mono text-xs text-[var(--win)]">
                {market.score}
              </p>
            ) : null}
          </div>
          <ChevronRight className="mt-2 h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-0.5" />
        </a>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:flex">
          {market.outcomes.map((outcome) => (
            <OutcomeButton
              key={outcome.id}
              outcome={outcome}
              selected={
                selection?.market.id === market.id &&
                selection.outcome.id === outcome.id
              }
              onClick={() => onSelect(outcome)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BetSlip({
  selection,
  onClose,
  mobile = false,
  expanded = false,
  onToggle,
}: {
  selection: Selection | null;
  onClose: () => void;
  mobile?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const [stake, setStake] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();
  const stakeHelpId = `${inputId}-help`;
  const stakeErrorId = `${inputId}-error`;
  const demoSession = useDemoSession();
  const available =
    demoSession?.role === "student" ? demoSession.sportsCredits : 500;

  if (!selection && mobile) return null;

  if (!selection) {
    return (
      <Card className="bet-slip sticky top-20">
        <CardContent className="p-6 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[var(--surface-raised)] text-[var(--muted)]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-semibold">Choose an outcome</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Select any market option to see the after-bet projection.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { market, outcome } = selection;
  const outcomePool = (market.pool * outcome.share) / 100;
  const afterPool = market.pool + stake;
  const afterOutcomePool = outcomePool + stake;
  const afterShare = (afterOutcomePool / afterPool) * 100;
  const afterMultiplier = (0.95 * afterPool) / afterOutcomePool;
  const projected = Math.floor(stake * afterMultiplier);
  const invalid =
    !Number.isFinite(stake) ||
    afterMultiplier <= 1.05 ||
    stake < 1 ||
    stake > 500;

  async function placeBet() {
    setSubmitting(true);
    setError("");
    setReceipt("");
    const preview =
      process.env.NODE_ENV === "development" &&
      window.location.hostname === "terminal.local";
    const demo = getDemoSession();
    const supabase = preview || demo ? null : getSupabaseBrowserClient();

    if (supabase) {
      const { data, error: rpcError } = await supabase.rpc("place_sports_bet", {
        p_outcome_id: outcome.id,
        p_stake: stake,
        p_idempotency_key: crypto.randomUUID(),
      });
      if (!rpcError && data) {
        const payload = Array.isArray(data) ? data[0] : data;
        setReceipt(String(payload?.receipt_id ?? "confirmed"));
        setSubmitting(false);
        return;
      }
      if (rpcError && !rpcError.message.toLowerCase().includes("jwt")) {
        setError(rpcError.message);
        setSubmitting(false);
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 550));
    setReceipt(`PG-${Date.now().toString(36).toUpperCase()}`);
    setSubmitting(false);
  }

  if (mobile && !expanded) {
    return (
      <Card className="overflow-hidden rounded-b-none border-b-0 shadow-[0_-12px_30px_rgb(0_0_0_/_0.28)]">
        <button
          type="button"
          className="flex min-h-16 w-full items-center gap-3 px-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]"
          onClick={onToggle}
          aria-expanded={false}
          aria-label={`Review bet on ${outcome.label}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Selection
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold">
              {outcome.label}
              <span className="ml-2 font-mono text-[var(--primary)]">
                {outcome.multiplier.toFixed(2)}×
              </span>
            </span>
          </span>
          <span className="flex min-h-11 items-center gap-1 rounded-[10px] bg-[var(--primary)] px-4 text-xs font-bold text-[var(--primary-foreground)]">
            Review
            <ChevronUp className="h-4 w-4" />
          </span>
        </button>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "bet-slip sticky top-20 overflow-hidden",
        mobile &&
          "static max-h-[calc(100dvh-9rem-env(safe-area-inset-bottom))] rounded-b-none border-b-0 shadow-[0_-18px_50px_rgb(0_0_0_/_0.42)]",
      )}
      role={mobile ? "dialog" : undefined}
      aria-modal={mobile ? true : undefined}
      aria-label={mobile ? "Bet slip" : undefined}
    >
      <div className="flex min-h-14 items-center border-b border-[var(--border)] px-3 py-2 sm:px-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Bet slip
          </p>
          <p className="mt-1 text-sm font-semibold">{outcome.label}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {mobile ? (
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              onClick={onToggle}
              aria-label="Collapse bet slip"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            onClick={onClose}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <CardContent
        className={cn(
          "space-y-4 p-4",
          mobile &&
            "max-h-[calc(100dvh-12.5rem-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain pb-6",
        )}
      >
        <div className="rounded-[10px] bg-[var(--canvas)] p-3">
          <p className="text-xs text-[var(--muted)]">{market.league}</p>
          <p className="mt-1 text-sm font-medium">
            {market.home} vs {market.away}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <label htmlFor={inputId} className="font-semibold">
              Stake credits
            </label>
            <span className="text-[var(--muted)]">
              Available {formatCredits(available)}
            </span>
          </div>
          <Input
            id={inputId}
            type="number"
            min={1}
            max={500}
            value={stake}
            onChange={(event) => setStake(Number(event.target.value))}
            className="font-mono text-base"
            aria-invalid={invalid}
            aria-describedby={invalid ? stakeErrorId : stakeHelpId}
          />
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[25, 50, 100, 250].map((amount) => (
              <Button
                key={amount}
                variant="secondary"
                size="sm"
                onClick={() => setStake(amount)}
                className="min-h-11 px-2"
              >
                {amount}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-xs">
          <div className="flex justify-between text-[var(--muted)]">
            <span>Pool share</span>
            <span>
              {outcome.share.toFixed(1)}%{" "}
              <ArrowRight className="mx-1 inline h-3 w-3" />{" "}
              <strong className="text-[var(--text)]">{afterShare.toFixed(1)}%</strong>
            </span>
          </div>
          <div className="flex justify-between text-[var(--muted)]">
            <span>Projected multiplier</span>
            <strong className="font-mono text-[var(--primary)]">
              {afterMultiplier.toFixed(2)}×
            </strong>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-2">
            <span>Projected return</span>
            <strong className="font-mono text-[var(--win)]">
              {formatCredits(projected)} credits
            </strong>
          </div>
        </div>

        <p
          id={stakeHelpId}
          className="flex gap-2 text-[11px] leading-4 text-[var(--muted)]"
        >
          <RefreshCw className="mt-0.5 h-3 w-3 shrink-0" />
          Projection changes as credits enter the pool. A 5% credit burn applies
          at settlement.
        </p>

        {invalid ? (
          <p
            id={stakeErrorId}
            className="text-xs text-[var(--warning)]"
            role="alert"
          >
            Stake must keep the projection above 1.05× and cannot exceed 500.
          </p>
        ) : null}

        {error ? (
          <p className="text-xs text-[var(--loss)]" role="alert">
            {error}
          </p>
        ) : null}

        {receipt ? (
          <div
            className="rounded-[10px] border border-[var(--win-border)] bg-[var(--win-soft)] p-3"
            role="status"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--win)]">
              <CheckCircle2 className="h-4 w-4" /> Bet request accepted
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Credits are reserved while transparent settlement is queued.
            </p>
            <p className="mt-1.5 font-mono text-[10px] text-[var(--muted)]">
              Receipt {receipt}
            </p>
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            disabled={invalid || submitting}
            onClick={placeBet}
          >
            {submitting ? "Confirming…" : "Place play-money bet"}
          </Button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
          <ShieldCheck className="h-3 w-3" /> No monetary value
        </div>
      </CardContent>
    </Card>
  );
}

export function SportsPage() {
  const [sport, setSport] = useState("All");
  const [status, setStatus] = useState("Live");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [mobileSlipOpen, setMobileSlipOpen] = useState(false);

  const markets = useMemo(
    () =>
      sportsMarkets.filter(
        (market) =>
          (sport === "All" || market.sport === sport) &&
          (status === "Live"
            ? market.status === "LIVE"
            : status === "Upcoming"
              ? market.status === "UPCOMING"
              : status === "Futures"
                ? market.status === "FUTURES"
                : false),
      ),
    [sport, status],
  );

  return (
    <AppGate>
      <AppShell active="sports">
        <div
          className={cn(
            "mx-auto max-w-[1380px] px-3 pt-5 sm:px-6 lg:px-8",
            selection ? "pb-40 sm:pb-24" : "pb-24",
          )}
        >
          <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
                <Activity className="h-3.5 w-3.5 text-[var(--win)]" />
                Updates live through secure channels
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                Sports markets
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Back outcomes with non-transferable Sports Credits.
              </p>
            </div>
          </div>

          <div
            className="mt-5 flex w-full gap-1 overflow-x-auto overscroll-x-contain border-b border-[var(--border)] sm:mt-6"
            role="tablist"
            aria-label="Market status"
          >
            {statusFilters.map((item) => (
              <button
                key={item}
                onClick={() => setStatus(item)}
                role="tab"
                aria-selected={status === item}
                className={cn(
                  "min-h-11 shrink-0 border-b-2 px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]",
                  status === item
                    ? "border-[var(--primary)] text-[var(--text)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--text)]",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div
            className="mt-3 flex w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 sm:mt-4"
            aria-label="Filter markets by sport"
          >
            {sportFilters.map((item) => (
              <Button
                key={item}
                variant={sport === item ? "default" : "secondary"}
                onClick={() => setSport(item)}
                aria-pressed={sport === item}
                    className="ui-pressable min-h-11 shrink-0"
              >
                {item}
              </Button>
            ))}
          </div>

          <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0 space-y-4">
              {markets.length ? (
                <>
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-semibold">
                      {status}: {sport === "All" ? "All sports" : sport}
                    </h2>
                    <span className="text-xs text-[var(--muted)]">
                      {markets.length} markets
                    </span>
                  </div>
                  <div className="market-feed grid gap-3">
                    {markets.map((market) => (
                      <MarketCard
                        key={market.id}
                        market={market}
                        selection={selection}
                        onSelect={(outcome) => {
                          setSelection({ market, outcome });
                          setMobileSlipOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="p-10 text-center">
                    <Clock3 className="mx-auto h-6 w-6 text-[var(--muted)]" />
                    <h2 className="mt-3 font-semibold">No markets here yet</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Try another sport or lifecycle filter.
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>

            <aside className="hidden xl:block">
              <BetSlip
                selection={selection}
                onClose={() => setSelection(null)}
              />
            </aside>
          </div>
        </div>

        {mobileSlipOpen && selection ? (
          <button
            type="button"
            className="sports-slip-backdrop fixed inset-0 z-[55] bg-[#020713]/70 backdrop-blur-[2px] xl:hidden"
            onClick={() => setMobileSlipOpen(false)}
            aria-label="Collapse bet slip"
          />
        ) : null}
        <aside
          className="sports-slip-dock fixed inset-x-0 z-[60] xl:hidden"
          style={{ bottom: "calc(68px + env(safe-area-inset-bottom))" }}
          aria-live="polite"
        >
          <BetSlip
            key={`mobile-${selection?.market.id ?? "empty"}-${selection?.outcome.id ?? "empty"}`}
            selection={selection}
            onClose={() => {
              setSelection(null);
              setMobileSlipOpen(false);
            }}
            mobile
            expanded={mobileSlipOpen}
            onToggle={() => setMobileSlipOpen((open) => !open)}
          />
        </aside>
      </AppShell>
    </AppGate>
  );
}
