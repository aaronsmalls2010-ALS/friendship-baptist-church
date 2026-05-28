import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ministries",
  description: "Explore the ministries of The Friendship Baptist Church. From youth to seniors, music to outreach — find your place to serve.",
  alternates: { canonical: "/ministries" },
};

export default function MinistriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
