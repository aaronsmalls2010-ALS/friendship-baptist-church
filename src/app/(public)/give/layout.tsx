import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Give & Support",
  description: "Support the mission of The Friendship Baptist Church. Learn about tithes, offerings, and ways to give back to our Beaufort, SC community.",
  alternates: { canonical: "/give" },
};

export default function GiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
