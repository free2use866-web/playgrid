"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Award,
  Crown,
  Medal,
  Minus,
  Sparkles,
  Trophy,
} from "lucide-react";
import { AppGate } from "@/components/app-gate";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { leaderboard } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function LeaderboardPage() {
  const [board, setBoard] = useState<"wealth" | "performance">("wealth");

  return (
    <AppGate>
      <AppShell active="leaderboard">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge tone="warning">
                <Trophy className="mr-1.5 h-3 w-3" /> Season 01
              </Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
                Leaderboard
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Wealth and skill are measured separately.
              </p>
            </div>
            <div className="flex gap-1 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-1">
              <Button
                size="sm"
                variant={board === "wealth" ? "default" : "ghost"}
                onClick={() => setBoard("wealth")}
              >
                Coin wealth
              </Button>
              <Button
                size="sm"
                variant={board === "performance" ? "default" : "ghost"}
                onClick={() => setBoard("performance")}
              >
                Performance
              </Button>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
            {(() => {
              const champion = leaderboard[0];
              return (
                <Card className="leader-champion overflow-hidden">
                  <CardContent className="relative p-6 sm:p-8">
                    <div className="grid h-11 w-11 place-items-center rounded-[9px] bg-[#f5c45116] text-[var(--warning)]">
                      <Crown className="h-5 w-5" />
                    </div>
                    <p className="mt-8 text-xs font-semibold text-[var(--muted)]">
                      Current leader
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                      {champion.username}
                    </h2>
                    <p className="mt-8 font-mono text-4xl font-semibold tracking-[-0.04em]">
                      {new Intl.NumberFormat("en-IN").format(
                        board === "wealth"
                          ? champion.credits
                          : Math.floor(champion.roi * 100),
                      )}
                      <span className="ml-2 text-xs font-normal tracking-normal text-[var(--muted)]">
                        {board === "wealth" ? "credits" : "net points"}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              );
            })()}

            <div className="grid gap-3">
              {leaderboard.slice(1, 3).map((row, index) => {
                const Icon = index === 0 ? Medal : Award;
                const colors = index === 0
                  ? "text-[#c4cedf] bg-[#c4cedf14]"
                  : "text-[#e79b6b] bg-[#e79b6b14]";
                return (
                  <Card key={row.username}>
                    <CardContent className="flex min-h-32 items-center gap-4 p-5">
                      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[9px]", colors)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--muted)]">Rank #{row.rank}</p>
                        <h2 className="mt-1 truncate font-semibold">{row.username}</h2>
                      </div>
                      <p className="ml-auto font-mono text-lg font-semibold">
                        {new Intl.NumberFormat("en-IN").format(
                          board === "wealth" ? row.credits : Math.floor(row.roi * 100),
                        )}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card className="mt-6 overflow-hidden">
            <div className="grid grid-cols-[60px_minmax(150px,1fr)_140px_100px_90px] gap-3 border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] max-md:grid-cols-[50px_1fr_110px]">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-right">
                {board === "wealth" ? "Total credits" : "Net points"}
              </span>
              <span className="text-right max-md:hidden">ROI</span>
              <span className="text-right max-md:hidden">Streak</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {leaderboard.map((row, index) => (
                <div
                  key={row.username}
                  className={cn(
                    "grid min-h-16 grid-cols-[60px_minmax(150px,1fr)_140px_100px_90px] items-center gap-3 px-4 py-3 text-sm max-md:grid-cols-[50px_1fr_110px]",
                    row.username === "demo_student" && "bg-[#8b7dff0e]",
                  )}
                >
                  <div className="flex items-center gap-1">
                    {index % 3 === 0 ? (
                      <ArrowUp className="h-3 w-3 text-[var(--win)]" />
                    ) : index % 3 === 1 ? (
                      <Minus className="h-3 w-3 text-[var(--muted)]" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-[var(--loss)]" />
                    )}
                    <strong className="font-mono">#{row.rank}</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[var(--surface-raised)] text-xs font-bold">
                      {row.username.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium">{row.username}</p>
                      {row.username === "demo_student" ? (
                        <p className="text-[10px] uppercase tracking-wider text-[var(--primary)]">
                          Demo account
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <strong className="text-right font-mono">
                    {new Intl.NumberFormat("en-IN").format(
                      board === "wealth"
                        ? row.credits
                        : Math.floor(row.roi * 100),
                    )}
                  </strong>
                  <span className="text-right font-mono text-[var(--win)] max-md:hidden">
                    +{row.roi.toFixed(1)}%
                  </span>
                  <span className="text-right font-mono text-[var(--muted)] max-md:hidden">
                    {row.streak}W
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-5 flex gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4 text-xs leading-5 text-[var(--muted)]">
            <Sparkles className="h-4 w-4 shrink-0 text-[var(--primary)]" />
            {board === "wealth"
              ? "Coin Wealth includes available and locked play credits. Welcome and referral rewards are included."
              : "Performance excludes welcome rewards, referrals, admin corrections, void rounds, and pending outcomes."}
          </div>
        </div>
      </AppShell>
    </AppGate>
  );
}
