import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Deacons",
  description: "Meet the dedicated deacons who serve The Friendship Baptist Church in Beaufort, SC.",
  alternates: { canonical: "/deacons" },
};

export default function DeaconsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
