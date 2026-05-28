import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media — Sermons & Worship",
  description: "Watch sermons, listen to worship music, and access media from The Friendship Baptist Church in Beaufort, SC.",
  alternates: { canonical: "/media" },
};

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
