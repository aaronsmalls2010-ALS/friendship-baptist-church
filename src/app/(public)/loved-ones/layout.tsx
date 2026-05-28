import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "In Loving Memory",
  description: "Honor and remember the beloved members of The Friendship Baptist Church who have gone home to be with the Lord.",
  alternates: { canonical: "/loved-ones" },
};

export default function LovedOnesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
