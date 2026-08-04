import type { Metadata } from "next";
import { AppGate } from "@/components/app-gate";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Help" };

const items = [
  ["Are credits money?", "No. Credits have no monetary value and cannot be bought, transferred, sold, or redeemed."],
  ["Why are sports projections changing?", "Sports markets are pari-mutuel. Your projected multiplier changes as credits enter each outcome pool."],
  ["Can I rename my username?", "Yes, once after your initial choice. Old usernames remain permanently reserved."],
  ["How do referrals work?", "After verified onboarding and abuse review, both people receive 50 Sports and 50 Arcade Credits."],
];

export default function HelpPage() {
  return (
    <AppGate>
      <AppShell active="sports">
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-7 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight">Help centre</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Clear answers about credits, markets, identity, and fairness.
          </p>
          <div className="mt-6 space-y-3">
            {items.map(([question, answer]) => (
              <Card key={question}>
                <CardContent className="p-5">
                  <h2 className="font-semibold">{question}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    </AppGate>
  );
}
