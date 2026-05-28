import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events & Calendar",
  description: "Stay updated with upcoming events, activities, and gatherings at The Friendship Baptist Church in Beaufort, SC.",
  alternates: { canonical: "/events" },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
