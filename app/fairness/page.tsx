import type { Metadata } from "next";
import { AppGate } from "@/components/app-gate";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Fingerprint, Hash, KeyRound, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Fairness" };

export default function FairnessPage() {
  return (
    <AppGate>
      <AppShell active="casino">
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-7 sm:px-6">
          <Badge tone="win">
            <ShieldCheck className="mr-1.5 h-3 w-3" /> PF-v1
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
            Don’t trust the animation. Verify the result.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            PF-v1 is the current verification prototype. Settled Dice and
            Plinko rounds expose reproducible inputs; production launch still
            requires an independently managed pre-commit service.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [KeyRound, "1. Commit", "The production service will publish a hash of the hidden server seed before a wager is accepted."],
              [Fingerprint, "2. Combine", "The server seed, your client seed, nonce, and cursor are combined with HMAC-SHA256."],
              [CheckCircle2, "3. Reveal", "The prototype returns the seed and versioned receipt after settlement for verification."],
            ].map(([Icon, title, detail]) => (
              <Card key={String(title)}>
                <CardContent className="p-5">
                  <Icon className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="mt-4 font-semibold">{String(title)}</h2>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                    {String(detail)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-[var(--primary)]" />
                <h2 className="font-semibold">Sample verification receipt</h2>
              </div>
              <dl className="mt-5 grid gap-4 text-xs sm:grid-cols-2">
                {[
                  ["Round", "rnd_01JZ8W3A7P5M"],
                  ["Algorithm", "HMAC-SHA256 / PF-v1"],
                  ["Commitment", "9e1f…c42a"],
                  ["Client seed", "web-8d57…c129"],
                  ["Nonce", "42"],
                  ["Ruleset hash", "dice-v1-97edge"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[9px] bg-[var(--canvas)] p-3">
                    <dt className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      {label}
                    </dt>
                    <dd className="mt-1.5 break-all font-mono">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AppGate>
  );
}
