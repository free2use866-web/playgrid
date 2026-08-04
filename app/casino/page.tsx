import type { Metadata } from "next";
import { CasinoPage } from "@/components/casino-page";

export const metadata: Metadata = { title: "Casino" };

export default function Page() {
  return <CasinoPage />;
}
