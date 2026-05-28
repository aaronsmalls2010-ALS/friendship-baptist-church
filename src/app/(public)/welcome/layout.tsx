import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to FBC",
  description: "New to The Friendship Baptist Church? We're glad you're here. Learn what to expect and how to get connected.",
  alternates: { canonical: "/welcome" },
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
