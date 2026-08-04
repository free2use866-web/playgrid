import type { Metadata } from "next";
import { CasinoPage } from "@/components/casino-page";

export const metadata: Metadata = { title: "Dice" };

export default function Page() {
  return <CasinoPage game="dice" />;
}
