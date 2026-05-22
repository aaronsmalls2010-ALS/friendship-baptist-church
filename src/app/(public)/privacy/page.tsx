import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shared/page-hero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for The Friendship Baptist Church website. Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title="Privacy Policy"
        breadcrumbs={[{ label: "Privacy Policy" }]}
      />

      <section className="section-padding bg-white dark:bg-warm-950">
        <div className="container-narrow">
          <div className="prose-container space-y-10">
            {/* Last Updated */}
            <p className="text-sm text-warm-500 dark:text-warm-400">
              Last Updated: May 2026
            </p>

            {/* Introduction */}
            <div>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  The Friendship Baptist Church of Beaufort, South Carolina
                  (&quot;the Church,&quot; &quot;we,&quot; &quot;us,&quot; or
                  &quot;our&quot;) is committed to protecting the privacy of our
                  members, visitors, and all users of our website at
                  thefriendshipbaptist.com (the &quot;Services&quot;). This
                  Privacy Policy explains how we collect, use, safeguard, and
                  share your personal information when you interact with our
                  Services.
                </p>
                <p>
                  By using our Services, you agree to the practices described in
                  this Privacy Policy. We encourage you to read this document
                  carefully and to review our{" "}
                  <Link
                    href="/terms"
                    className="text-purple-700 dark:text-purple-400 underline hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                  >
                    Terms of Service
                  </Link>{" "}
                  for additional information about your use of our website.
                </p>
              </div>
            </div>

            {/* Information We Collect */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Information We Collect
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  We collect information that you provide directly to us, as
                  well as information that is collected automatically when you
                  use our Services.
                </p>

                <h3 className="font-heading text-lg font-semibold text-warm-800 dark:text-warm-100 mt-6">
                  Personal Information You Provide
                </h3>
                <p>
                  When you create an account, make a donation, submit a prayer
                  request, or otherwise interact with our Services, we may
                  collect the following information:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Full name, email address, phone number, and mailing address
                  </li>
                  <li>
                    Date of birth (for membership registration and age
                    verification)
                  </li>
                  <li>
                    Prayer requests, testimonies, and other content you choose
                    to submit
                  </li>
                  <li>
                    Donation amounts and frequency (payment card details are
                    processed and stored exclusively by our third-party payment
                    processor and are never stored on our servers)
                  </li>
                  <li>
                    Ministry preferences, volunteer interests, and group
                    membership information
                  </li>
                </ul>

                <h3 className="font-heading text-lg font-semibold text-warm-800 dark:text-warm-100 mt-6">
                  Information Collected Automatically
                </h3>
                <p>
                  When you visit our website, we may automatically collect
                  certain usage data, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Browser type, operating system, and device information
                  </li>
                  <li>
                    Pages visited, time spent on pages, and navigation patterns
                  </li>
                  <li>IP address and general geographic location</li>
                  <li>
                    Referring website or source that directed you to our
                    Services
                  </li>
                </ul>

                <h3 className="font-heading text-lg font-semibold text-warm-800 dark:text-warm-100 mt-6">
                  Cookies
                </h3>
                <p>
                  Our website uses essential cookies that are necessary for the
                  proper functioning of the Services, such as authentication
                  tokens to keep you logged in. We do not use advertising or
                  tracking cookies. For more details, see the Cookie Policy
                  section below.
                </p>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                How We Use Your Information
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  We use the information we collect to serve our congregation
                  and community faithfully. Specifically, we use your
                  information to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Provide and maintain member services, including your account
                    profile, ministry participation, and event registration
                  </li>
                  <li>
                    Process tithes, offerings, and donations securely, and
                    provide annual giving statements for tax purposes
                  </li>
                  <li>
                    Share prayer requests with our prayer team and pastoral
                    staff (with your consent and in accordance with your privacy
                    preferences)
                  </li>
                  <li>
                    Send church communications such as newsletters, event
                    announcements, service updates, and ministry information
                  </li>
                  <li>
                    Respond to your inquiries, feedback, and contact form
                    submissions
                  </li>
                  <li>
                    Improve our Services, understand how our website is used,
                    and enhance the overall user experience
                  </li>
                  <li>
                    Comply with legal obligations and protect the rights and
                    safety of our church community
                  </li>
                </ul>
              </div>
            </div>

            {/* Data Protection & Security */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Data Protection &amp; Security
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  We take the protection of your personal information
                  seriously. We implement a range of security measures to
                  safeguard your data, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Encryption of data in transit using TLS/SSL protocols and
                    encryption of sensitive data at rest
                  </li>
                  <li>
                    Access controls that limit who can view and manage personal
                    information to authorized church staff and ministry leaders
                    on a need-to-know basis
                  </li>
                  <li>
                    Secure, authenticated access to administrative systems and
                    databases
                  </li>
                  <li>
                    Regular security reviews and updates to our systems and
                    practices
                  </li>
                </ul>
                <p>
                  While we strive to protect your personal information, no
                  method of electronic transmission or storage is completely
                  secure. We cannot guarantee absolute security, but we are
                  committed to taking every reasonable step to protect your
                  data.
                </p>
              </div>
            </div>

            {/* Data Sharing */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Data Sharing
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  The Friendship Baptist Church does not sell, rent, or trade
                  your personal information to third parties. We may share your
                  information only in the following limited circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Payment Processing:
                    </span>{" "}
                    We share transaction information with our secure,
                    third-party payment processor solely for the purpose of
                    processing your tithes, offerings, and donations. The
                    payment processor operates under its own privacy policy and
                    PCI-DSS compliance standards.
                  </li>
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Email Communications:
                    </span>{" "}
                    We use a third-party email service provider to deliver
                    newsletters, announcements, and other church communications.
                    Your name and email address are shared with this provider
                    solely for the purpose of sending these communications.
                  </li>
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Legal Requirements:
                    </span>{" "}
                    We may disclose your information if required to do so by law
                    or in response to a valid legal process, such as a court
                    order or subpoena.
                  </li>
                </ul>
              </div>
            </div>

            {/* Your Rights */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Your Rights
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  We respect your rights regarding your personal information.
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Access:
                    </span>{" "}
                    Request a copy of the personal information we hold about you
                  </li>
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Correction:
                    </span>{" "}
                    Request that we correct any inaccurate or incomplete
                    personal information
                  </li>
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Deletion:
                    </span>{" "}
                    Request that we delete your personal information from our
                    systems, subject to certain legal and operational
                    requirements
                  </li>
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Data Portability:
                    </span>{" "}
                    Request a copy of your data in a commonly used,
                    machine-readable format
                  </li>
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Opt-Out:
                    </span>{" "}
                    Unsubscribe from our email communications at any time by
                    clicking the unsubscribe link in any email or by contacting
                    us directly
                  </li>
                </ul>
                <p>
                  To exercise any of these rights, please contact us at{" "}
                  <a
                    href="mailto:info@thefriendshipbaptist.com"
                    className="text-purple-700 dark:text-purple-400 underline hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                  >
                    info@thefriendshipbaptist.com
                  </a>
                  . We will respond to your request within 30 days.
                </p>
              </div>
            </div>

            {/* Cookie Policy */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Cookie Policy
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  Our website uses only essential cookies that are necessary
                  for the proper operation of our Services. These include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Authentication cookies:
                    </span>{" "}
                    Used to keep you signed in to your account and maintain your
                    session
                  </li>
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Preference cookies:
                    </span>{" "}
                    Used to remember your settings such as dark mode preference
                  </li>
                </ul>
                <p>
                  We do not use advertising cookies, tracking cookies, or any
                  third-party analytics cookies that monitor your browsing
                  activity across other websites. We believe in respecting your
                  privacy and keeping our use of cookies to the absolute
                  minimum necessary to serve you well.
                </p>
              </div>
            </div>

            {/* Data Retention */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Data Retention
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  We retain your personal information for as long as your
                  account is active or as needed to provide you with our
                  Services. Specifically:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Account data:
                    </span>{" "}
                    Retained while your account remains active. Upon your
                    request to delete your account, we will remove your personal
                    information within 30 days, except where retention is
                    required by law
                  </li>
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Donation records:
                    </span>{" "}
                    Retained for a minimum of seven years in accordance with IRS
                    requirements for tax-exempt organizations and to support
                    your annual giving statements
                  </li>
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Communication preferences:
                    </span>{" "}
                    Your opt-out preferences are retained indefinitely to ensure
                    we continue to honor your communication choices
                  </li>
                  <li>
                    <span className="font-medium text-warm-800 dark:text-warm-200">
                      Prayer requests:
                    </span>{" "}
                    Retained for the duration of the prayer cycle and then
                    archived or removed based on the nature of the request
                  </li>
                </ul>
              </div>
            </div>

            {/* Children's Privacy */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Children&apos;s Privacy
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  The Friendship Baptist Church is committed to protecting the
                  privacy of children. Our Services are not directed to children
                  under the age of 13, and we do not knowingly collect personal
                  information from children under 13 without verifiable parental
                  consent, in compliance with the Children&apos;s Online Privacy
                  Protection Act (COPPA).
                </p>
                <p>
                  If we become aware that we have inadvertently collected
                  personal information from a child under 13 without
                  appropriate parental consent, we will take steps to delete
                  that information as promptly as possible.
                </p>
                <p>
                  If you are a parent or guardian and believe that your child
                  has provided personal information to us without your consent,
                  please contact us at{" "}
                  <a
                    href="mailto:info@thefriendshipbaptist.com"
                    className="text-purple-700 dark:text-purple-400 underline hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                  >
                    info@thefriendshipbaptist.com
                  </a>{" "}
                  so that we can take appropriate action.
                </p>
              </div>
            </div>

            {/* Changes to This Policy */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Changes to This Policy
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  We may update this Privacy Policy from time to time to
                  reflect changes in our practices, technology, legal
                  requirements, or other factors. When we make material changes,
                  we will update the &quot;Last Updated&quot; date at the top of
                  this page and, where appropriate, notify registered users by
                  email or through a notice on our website.
                </p>
                <p>
                  Your continued use of our Services after any changes to this
                  Privacy Policy constitutes your acceptance of the updated
                  policy. We encourage you to review this page periodically to
                  stay informed about how we are protecting your information.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Contact Information
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  If you have any questions, concerns, or requests regarding
                  this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-warm-50 dark:bg-warm-900 rounded-xl p-6 space-y-2">
                  <p className="font-heading font-bold text-warm-900 dark:text-warm-50">
                    The Friendship Baptist Church
                  </p>
                  <p>Beaufort, South Carolina</p>
                  <p>
                    Pastor Isiah Smalls
                  </p>
                  <p>
                    Email:{" "}
                    <a
                      href="mailto:info@thefriendshipbaptist.com"
                      className="text-purple-700 dark:text-purple-400 underline hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                    >
                      info@thefriendshipbaptist.com
                    </a>
                  </p>
                  <p>
                    Website:{" "}
                    <a
                      href="https://thefriendshipbaptist.com"
                      className="text-purple-700 dark:text-purple-400 underline hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                    >
                      thefriendshipbaptist.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
