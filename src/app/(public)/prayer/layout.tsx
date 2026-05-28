import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prayer Requests",
  description: "Submit a prayer request to The Friendship Baptist Church family. We believe in the power of prayer and lifting each other up.",
  alternates: { canonical: "/prayer" },
};

export default function PrayerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
