"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LockKeyhole,
  Plus,
  Search,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { AppGate } from "@/components/app-gate";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDemoSession } from "@/lib/demo-session";

const adminMarkets = [
  { id: "MKT-1042", event: "India vs Australia", status: "Live", pool: "12,450", closes: "46 min" },
  { id: "MKT-1043", event: "Madrid vs Manchester", status: "Open", pool: "9,180", closes: "6h 12m" },
  { id: "MKT-1044", event: "Mumbai vs Chennai", status: "Open", pool: "6,825", closes: "1d 4h" },
  { id: "MKT-1039", event: "Formula championship", status: "Dispute", pool: "22,340", closes: "18h left" },
];

export function AdminPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState(false);
  const demoSession = useDemoSession();

  useEffect(() => {
    if (!createOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCreateOpen(false);
        setCreated(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [createOpen]);

  return (
    <AppGate requireAdmin>
      <AppShell active="admin" admin>
        <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
                <LockKeyhole className="h-3.5 w-3.5 text-[var(--warning)]" />
                {demoSession
                  ? "Demo authorization, live operations blocked"
                  : "AAL2 verified, operations audited"}
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
                Control room
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Govern markets, access, economy, disputes, and risk.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create market
            </Button>
          </div>

          <Card className="admin-metric-rail mt-7 grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
            {[
              [BarChart3, "Open markets", "18", "+3 today"],
              [UsersRound, "Active members", "2,481", "+8.4%"],
              [CircleDollarSign, "Credits in play", "1.84M", "42% locked"],
              [ShieldAlert, "Needs review", "3", "1 dispute"],
            ].map(([Icon, label, value, note]) => (
              <article key={String(label)} className="admin-metric border-b border-[var(--border)] p-5 sm:border-r xl:border-b-0 last:border-r-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-[var(--muted)]">
                        {String(label)}
                      </p>
                      <p className="mt-2 font-mono text-2xl font-semibold">
                        {String(value)}
                      </p>
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[var(--surface-raised)]">
                      <Icon className="h-4 w-4 text-[var(--primary)]" />
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-[var(--muted)]">{String(note)}</p>
              </article>
            ))}
          </Card>

          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
            <Card className="overflow-hidden" id="markets">
              <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-5 py-4">
                <div>
                  <h2 className="font-semibold">Market operations</h2>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    Every lifecycle action creates an immutable audit event.
                  </p>
                </div>
                <div className="relative ml-auto max-sm:w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <Input className="h-9 pl-9" placeholder="Find market" />
                </div>
              </div>
              <div className="overflow-x-auto max-md:hidden">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[110px_1fr_100px_100px_110px_40px] gap-3 border-b border-[var(--border)] bg-[var(--surface-raised)] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    <span>ID</span>
                    <span>Event</span>
                    <span>Status</span>
                    <span className="text-right">Pool</span>
                    <span className="text-right">Window</span>
                    <span />
                  </div>
                  {adminMarkets.map((market) => (
                    <div
                      key={market.id}
                      className="grid min-h-16 grid-cols-[110px_1fr_100px_100px_110px_40px] items-center gap-3 border-b border-[var(--border)] px-5 py-3 text-sm last:border-0"
                    >
                      <span className="font-mono text-xs text-[var(--muted)]">
                        {market.id}
                      </span>
                      <strong>{market.event}</strong>
                      <Badge
                        tone={
                          market.status === "Live"
                            ? "live"
                            : market.status === "Dispute"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {market.status}
                      </Badge>
                      <span className="text-right font-mono">{market.pool}</span>
                      <span className="text-right text-xs text-[var(--muted)]">
                        {market.closes}
                      </span>
                      <Button variant="ghost" size="icon" aria-label={`Open ${market.event}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid md:hidden">
                {adminMarkets.map((market) => (
                  <article key={`mobile-${market.id}`} className="border-b border-[var(--border)] p-4 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] text-[var(--muted)]">{market.id}</p>
                        <h3 className="mt-1 font-semibold">{market.event}</h3>
                      </div>
                      <Badge tone={market.status === "Live" ? "live" : market.status === "Dispute" ? "warning" : "neutral"}>
                        {market.status}
                      </Badge>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-[8px] bg-[var(--surface-raised)] p-3">
                        <dt className="text-[var(--muted)]">Pool</dt>
                        <dd className="mt-1 font-mono font-semibold">{market.pool}</dd>
                      </div>
                      <div className="rounded-[8px] bg-[var(--surface-raised)] p-3">
                        <dt className="text-[var(--muted)]">Window</dt>
                        <dd className="mt-1 font-semibold">{market.closes}</dd>
                      </div>
                    </dl>
                    <button className="ui-pressable mt-3 flex min-h-10 w-full items-center justify-between rounded-[8px] px-3 text-left text-xs font-semibold text-[var(--primary)] hover:bg-[var(--surface-raised)]">
                      Open market <ChevronRight className="h-4 w-4" />
                    </button>
                  </article>
                ))}
              </div>
            </Card>

            <div className="space-y-5">
              <Card>
                <div className="border-b border-[var(--border)] px-5 py-4">
                  <h2 className="font-semibold">Risk queue</h2>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {[
                    ["Referral cluster", "14 linked accounts", "Review", AlertTriangle],
                    ["Result dispute", "Formula championship", "18h left", Clock3],
                    ["Balance correction", "Maker approval needed", "Approve", BookOpenCheck],
                  ].map(([title, detail, action, Icon]) => (
                    <button
                      key={String(title)}
                      className="flex min-h-16 w-full items-center gap-3 px-5 py-3 text-left hover:bg-[var(--surface-raised)]"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f5c45112] text-[var(--warning)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <strong className="block text-sm">{String(title)}</strong>
                        <span className="text-xs text-[var(--muted)]">{String(detail)}</span>
                      </span>
                      <span className="ml-auto text-xs font-semibold text-[var(--primary)]">
                        {String(action)}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card id="audit">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[var(--win)]" />
                    <h2 className="font-semibold">System status</h2>
                    <Badge tone="warning" className="ml-auto">
                      {demoSession ? "Demo data" : "Core online"}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-3 text-xs">
                    {[
                      ["Database + RLS", "Operational"],
                      ["Realtime channels", "Schema ready"],
                      ["Chain reconciler", "Not connected"],
                      ["Fairness service", "PF-v1 prototype"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-[var(--muted)]">{label}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>

      {createOpen ? (
        <div className="admin-modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/70 px-4">
          <Card className="admin-modal w-full max-w-lg shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="create-market-title">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 id="create-market-title" className="font-semibold">Create sports market</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Submission enters the maker-checker approval queue.
              </p>
            </div>
            <CardContent className="space-y-4 p-5">
              {created ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--win)]" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Draft preview ready
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Persistence and checker approval connect in the next backend
                    integration.
                  </p>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-semibold">
                    Event title
                    <Input autoFocus className="mt-2" placeholder="Team A vs Team B" />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold">
                      Sport
                      <select className="mt-2 h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--canvas)] px-3 text-sm">
                        <option>Cricket</option>
                        <option>Football</option>
                        <option>Basketball</option>
                      </select>
                    </label>
                    <label className="block text-xs font-semibold">
                      Close time
                      <Input className="mt-2" type="datetime-local" />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold">
                    Outcomes
                    <Input className="mt-2" placeholder="Team A, Draw, Team B" />
                  </label>
                  <div className="rounded-[10px] border border-[#f5c45144] bg-[#f5c4510d] p-3 text-xs leading-5 text-[var(--warning)]">
                    Creating a market never changes balances. Publication and
                    resolution require AAL2, an audit reason, and separate approval.
                  </div>
                </>
              )}
            </CardContent>
            <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setCreateOpen(false);
                  setCreated(false);
                }}
              >
                {created ? "Close" : "Cancel"}
              </Button>
              {!created ? (
                <Button onClick={() => setCreated(true)}>Create draft</Button>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}
    </AppGate>
  );
}
