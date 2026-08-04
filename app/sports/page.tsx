import type { Metadata } from "next";
import { SportsPage } from "@/components/sports-page";

export const metadata: Metadata = {
  title: "Sports",
};

export default function Page() {
  return <SportsPage />;
}
