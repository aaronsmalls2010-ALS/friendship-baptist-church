import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pastor Isiah Smalls",
  description: "Meet Pastor Isiah Smalls, shepherd of The Friendship Baptist Church in Beaufort, SC. Learn about his vision and leadership.",
  alternates: { canonical: "/pastor" },
};

export default function PastorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
