import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { AppGate } from "@/components/app-gate";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sportsMarkets } from "@/lib/demo-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const market = sportsMarkets.find((item) => item.slug === slug);
  return { title: market ? `${market.home} vs ${market.away}` : "Market" };
}

export default async function SportsMarketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const market = sportsMarkets.find((item) => item.slug === slug);
  if (!market) notFound();

  return (
    <AppGate>
      <AppShell active="sports">
        <div className="mx-auto max-w-6xl px-3 pb-28 pt-5 sm:px-6 sm:pb-24 sm:pt-6">
          <p className="truncate text-xs text-[var(--muted)]">
            Sports / {market.sport} / {market.league}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone={market.status === "LIVE" ? "live" : "neutral"}>
                  {market.status === "LIVE" ? <Radio className="mr-1 h-3 w-3" /> : null}
                  {market.status}
                </Badge>
                <span className="text-xs text-[var(--muted)]">{market.clock}</span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                {market.home} vs {market.away}
              </h1>
              {market.score ? (
                <p className="mt-2 font-mono text-sm text-[var(--win)]">{market.score}</p>
              ) : null}
            </div>
            <div className="flex min-h-16 items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:block sm:text-right">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Total pool
              </p>
              <p className="font-mono text-lg font-semibold tabular-nums sm:mt-1">
                {new Intl.NumberFormat("en-IN").format(market.pool)} credits
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <Card>
                <div
                  className="flex gap-1 overflow-x-auto border-b border-[var(--border)] p-2"
                  role="tablist"
                  aria-label="Market views"
                >
                  <Button className="min-h-11 shrink-0" role="tab" aria-selected>
                    Winner
                  </Button>
                  <Button className="min-h-11 shrink-0" variant="ghost" role="tab">
                    Pool history
                  </Button>
                  <Button className="min-h-11 shrink-0" variant="ghost" role="tab">
                    Activity
                  </Button>
                </div>
                <CardContent className="p-3 sm:p-5">
                  <div className="grid gap-2 sm:flex sm:gap-3">
                    {market.outcomes.map((outcome) => (
                      <Link
                        key={outcome.id}
                        href="/sports"
                        className="flex min-h-16 flex-1 items-center justify-between gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] p-3 outline-none hover:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] sm:min-h-20 sm:p-4"
                      >
                        <span className="min-w-0">
                          <strong className="block truncate">{outcome.label}</strong>
                          <span className="mt-1 block text-xs text-[var(--muted)]">
                            {outcome.share.toFixed(1)}% pool
                          </span>
                        </span>
                        <strong className="min-w-[4rem] text-right font-mono text-[var(--primary)]">
                          {outcome.multiplier.toFixed(2)}×
                        </strong>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <h2 className="font-semibold">Pool probability history</h2>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      Aggregate credit share, not a traded price
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-1" aria-label="Chart window">
                    {["1H", "6H", "1D", "All"].map((item) => (
                      <Button
                        key={item}
                        variant={item === "6H" ? "secondary" : "ghost"}
                        size="sm"
                        className="min-h-11 min-w-11 px-3"
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
                <CardContent className="p-3 sm:p-5">
                  <div className="relative h-60 overflow-hidden rounded-[10px] bg-[var(--canvas)]">
                    <div className="sports-chart-grid absolute inset-0" />
                    <svg
                      viewBox="0 0 800 240"
                      className="absolute inset-0 h-full w-full"
                      aria-hidden="true"
                    >
                      <path
                        d="M0,178 C80,160 110,170 175,142 S300,155 370,118 S510,130 590,82 S720,98 800,64"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M0,62 C85,84 120,73 182,102 S300,90 370,122 S510,108 590,158 S720,143 800,176"
                        fill="none"
                        stroke="var(--data-secondary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    Trend summary: {market.home} gained 9.4 percentage points over
                    the selected window while {market.away} declined.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
                  <h2 className="font-semibold">Rules and resolution</h2>
                </div>
                <CardContent className="space-y-4 p-4 text-sm leading-6 text-[var(--muted)] sm:p-5">
                  <p>
                    The market resolves to the official winner of the stated event.
                    If the event is abandoned with no official result, all stakes
                    are refunded.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      [Clock3, "Open", "Accepting stakes"],
                      [Activity, "Proposed", "24h dispute window"],
                      [CheckCircle2, "Final", "Claims available"],
                    ].map(([Icon, title, detail]) => (
                      <div
                        key={String(title)}
                        className="rounded-[9px] border border-[var(--border)] bg-[var(--canvas)] p-3"
                      >
                        <Icon className="h-4 w-4 text-[var(--primary)]" />
                        <p className="mt-2 text-xs font-semibold text-[var(--text)]">
                          {String(title)}
                        </p>
                        <p className="text-[11px]">{String(detail)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside>
              <Card className="sticky top-20">
                <CardContent className="p-5">
                  <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="mt-4 font-semibold">Back an outcome</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Choose an option on the Sports feed to open the live after-bet
                    projection.
                  </p>
                  <Link href="/sports" className="mt-5 block">
                    <Button className="w-full">Return to markets</Button>
                  </Link>
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    <ShieldCheck className="h-3 w-3" /> Play-money only
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </AppShell>
    </AppGate>
  );
}
