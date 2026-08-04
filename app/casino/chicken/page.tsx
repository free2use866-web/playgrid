import type { Metadata } from "next";
import { CasinoPage } from "@/components/casino-page";

export const metadata: Metadata = { title: "Chicken" };

export default function Page() {
  return <CasinoPage game="chicken" />;
}
