import type { Metadata } from "next";
import { CasinoPage } from "@/components/casino-page";

export const metadata: Metadata = { title: "Plinko" };

export default function Page() {
  return <CasinoPage game="plinko" />;
}
