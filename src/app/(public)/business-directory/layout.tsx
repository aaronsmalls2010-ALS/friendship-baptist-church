import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Directory",
  description: "Support local businesses owned by members of The Friendship Baptist Church and the Beaufort, SC community.",
  alternates: { canonical: "/business-directory" },
};

export default function BusinessDirectoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
