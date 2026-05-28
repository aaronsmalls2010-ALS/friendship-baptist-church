import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about The Friendship Baptist Church in Beaufort, SC. Our history, our mission, our Gullah Geechee heritage, and the community we serve.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
