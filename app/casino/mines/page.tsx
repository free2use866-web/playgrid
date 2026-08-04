import type { Metadata } from "next";
import { CasinoPage } from "@/components/casino-page";

export const metadata: Metadata = { title: "Mines" };

export default function Page() {
  return <CasinoPage game="mines" />;
}
