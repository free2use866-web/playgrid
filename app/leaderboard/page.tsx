import type { Metadata } from "next";
import { LeaderboardPage } from "@/components/leaderboard-page";

export const metadata: Metadata = { title: "Leaderboard" };

export default function Page() {
  return <LeaderboardPage />;
}
