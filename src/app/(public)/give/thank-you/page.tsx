import type { Metadata } from "next";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";
import { CHURCH_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Thank You for Your Gift",
  description: "Thank you for supporting the mission of The Friendship Baptist Church.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/give/thank-you" },
};

/**
 * Post-checkout confirmation. This page is UX only — the donation itself is
 * recorded by the Stripe webhook (source of truth), never from this page, so a
 * donor who closes the tab before landing here is still recorded correctly.
 */
export default function GiveThankYouPage() {
  return (
    <>
      <PageHero
        title="Thank You"
        subtitle="Your generosity is a blessing"
        overlay="warm"
        breadcrumbs={[{ label: "Give", href: "/give" }, { label: "Thank You" }]}
      />

      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-narrow">
          <div className="mx-auto max-w-2xl rounded-2xl border border-warm-100 bg-white p-8 text-center shadow-sm dark:border-warm-800 dark:bg-warm-900 sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-100 dark:bg-gold-900/30">
              <Heart className="h-8 w-8 text-gold-600 dark:text-gold-400" />
            </div>
            <h2 className="mt-6 font-heading text-2xl font-bold text-warm-900 dark:text-warm-50">
              Your gift has been received
            </h2>
            <p className="mt-4 leading-relaxed text-warm-600 dark:text-warm-400">
              Thank you for supporting the ministry of {CHURCH_INFO.name}. A receipt has been sent
              to your email for your records. {CHURCH_INFO.name} is a registered 501(c)(3) nonprofit,
              and your gift is tax-deductible to the full extent allowed by law.
            </p>
            <p className="mt-4 text-sm text-warm-500 dark:text-warm-500">
              Members can view their full giving history and download an annual statement from the
              member portal.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-gold-500 text-warm-900 hover:bg-gold-400 font-semibold">
                <Link href="/">
                  Return Home
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/give">Give Again</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
