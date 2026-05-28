import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our History",
  description: "Discover the rich history of The Friendship Baptist Church, rooted in the Lowcountry Gullah Geechee tradition of Beaufort, South Carolina.",
  alternates: { canonical: "/history" },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
