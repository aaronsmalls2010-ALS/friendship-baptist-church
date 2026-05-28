import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Church Calendar",
  description: "View the full calendar of services, events, and activities at The Friendship Baptist Church in Beaufort, SC.",
  alternates: { canonical: "/calendar" },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
