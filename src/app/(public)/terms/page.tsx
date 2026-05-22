import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shared/page-hero";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for The Friendship Baptist Church website and online services.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        title="Terms of Service"
        breadcrumbs={[{ label: "Terms of Service" }]}
      />

      <section className="section-padding bg-white dark:bg-warm-950">
        <div className="container-narrow">
          <div className="prose-container space-y-10">
            {/* Last Updated */}
            <p className="text-sm text-warm-500 dark:text-warm-400">
              Last Updated: May 2026
            </p>

            {/* Acceptance of Terms */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Acceptance of Terms
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  Welcome to the website of The Friendship Baptist Church of
                  Beaufort, South Carolina (&quot;the Church,&quot; &quot;we,&quot;
                  &quot;us,&quot; or &quot;our&quot;). By accessing or using our
                  website at thefriendshipbaptist.com, including any subdomains,
                  mobile applications, or online services connected to this site
                  (collectively, the &quot;Services&quot;), you agree to be bound
                  by these Terms of Service (&quot;Terms&quot;).
                </p>
                <p>
                  If you do not agree to these Terms, please do not use our
                  Services. Your continued use of the website following the posting
                  of any changes to these Terms constitutes acceptance of those
                  changes.
                </p>
              </div>
            </div>

            {/* Description of Service */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Description of Service
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  The Friendship Baptist Church website provides a range of
                  digital services to support our congregation and community,
                  including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Church membership portal for managing your profile and
                    connecting with the congregation
                  </li>
                  <li>
                    Online giving and donation processing to support the
                    ministry and outreach of the Church
                  </li>
                  <li>
                    Prayer request submissions for members and visitors seeking
                    spiritual support
                  </li>
                  <li>
                    Event listings, calendar information, and registration for
                    church programs and activities
                  </li>
                  <li>
                    Access to sermons, devotionals, and other ministry media
                    content
                  </li>
                  <li>
                    Communication tools such as newsletters and announcements
                  </li>
                  <li>
                    A business directory connecting members with
                    community-owned businesses
                  </li>
                </ul>
                <p>
                  We reserve the right to modify, suspend, or discontinue any
                  aspect of our Services at any time without prior notice.
                </p>
              </div>
            </div>

            {/* User Accounts */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                User Accounts
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  Certain features of our Services may require you to create an
                  account. When registering, you agree to provide accurate,
                  current, and complete information and to update that
                  information as necessary.
                </p>
                <p>
                  You are responsible for maintaining the confidentiality of
                  your account credentials, including your password. You agree
                  to notify us immediately if you become aware of any
                  unauthorized use of your account. The Church is not liable for
                  any loss or damage resulting from your failure to safeguard
                  your account information.
                </p>
                <p>
                  You must be at least 13 years of age to create an account on
                  our website. Users between the ages of 13 and 17 must have
                  the consent of a parent or legal guardian to use our Services.
                  We do not knowingly collect personal information from children
                  under 13 without verifiable parental consent.
                </p>
              </div>
            </div>

            {/* Privacy & Data Protection */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Privacy &amp; Data Protection
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  Your privacy is important to us. Our collection, use, and
                  protection of your personal information is governed by our{" "}
                  <Link
                    href="/privacy"
                    className="text-purple-700 dark:text-purple-400 underline hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  , which is incorporated into these Terms by reference. By
                  using our Services, you consent to the practices described in
                  the Privacy Policy.
                </p>
                <p>
                  We are committed to handling your data with care and integrity
                  as an expression of our Christian stewardship. We will never
                  sell your personal information to third parties.
                </p>
              </div>
            </div>

            {/* User Conduct */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                User Conduct
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  As a community rooted in faith and love, we ask that all users
                  of our Services conduct themselves in a manner consistent with
                  the values of The Friendship Baptist Church. By using our
                  Services, you agree not to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Harass, threaten, intimidate, or demean any individual or
                    group
                  </li>
                  <li>
                    Post or transmit content that is hateful, discriminatory,
                    obscene, or otherwise offensive
                  </li>
                  <li>
                    Send unsolicited messages, spam, or advertisements through
                    any Church communication channels
                  </li>
                  <li>
                    Impersonate another person, church leader, or entity
                  </li>
                  <li>
                    Attempt to gain unauthorized access to any portion of the
                    Services or other systems or networks connected to the
                    Services
                  </li>
                  <li>
                    Use the Services for any unlawful purpose or in violation of
                    any applicable local, state, or federal law
                  </li>
                  <li>
                    Interfere with or disrupt the operation of the Services or
                    the servers and networks used to make the Services available
                  </li>
                </ul>
                <p>
                  We reserve the right to remove any content and suspend or
                  terminate the account of any user who violates these
                  guidelines, at our sole discretion.
                </p>
              </div>
            </div>

            {/* Content Guidelines */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Content Guidelines
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  Our Services may allow you to submit content such as prayer
                  requests, testimonies, event information, and business
                  directory listings. All user-submitted content must be:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Truthful, respectful, and appropriate for a church community</li>
                  <li>
                    Free of profanity, vulgarity, or language that is
                    inconsistent with our values
                  </li>
                  <li>
                    Relevant to the purpose for which it is submitted (for
                    example, prayer requests should be genuine requests for
                    spiritual support)
                  </li>
                  <li>
                    Compliant with all applicable laws, including intellectual
                    property and privacy laws
                  </li>
                </ul>
                <p>
                  The Church reserves the right to review, edit, or remove any
                  user-submitted content that does not meet these guidelines.
                  Testimonies shared publicly through our Services should not
                  disclose private information about other individuals without
                  their consent.
                </p>
              </div>
            </div>

            {/* Online Giving & Donations */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Online Giving &amp; Donations
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  The Friendship Baptist Church accepts online tithes,
                  offerings, and donations through our website. All donations
                  are processed by secure, third-party payment processors.
                  The Church does not store your full credit card or bank
                  account information on our servers.
                </p>
                <p>
                  All donations made through our Services are final and
                  generally non-refundable. If you believe an error has
                  occurred with a transaction, please contact us at{" "}
                  <a
                    href="mailto:info@thefriendshipbaptist.com"
                    className="text-purple-700 dark:text-purple-400 underline hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                  >
                    info@thefriendshipbaptist.com
                  </a>{" "}
                  and we will work with you to resolve the matter.
                </p>
                <p>
                  The Friendship Baptist Church is a registered 501(c)(3)
                  nonprofit organization. Donations may be tax-deductible to
                  the extent allowed by law. You will receive a year-end giving
                  statement for your records. Please consult your tax advisor
                  regarding the deductibility of your contributions.
                </p>
              </div>
            </div>

            {/* Intellectual Property */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Intellectual Property
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  All content on the Services, including but not limited to
                  text, graphics, logos, images, audio, video, sermons,
                  devotionals, and software, is the property of The Friendship
                  Baptist Church or its content providers and is protected by
                  applicable copyright, trademark, and other intellectual
                  property laws.
                </p>
                <p>
                  You may view, download, and print content from our Services
                  for personal, non-commercial use only. You may not reproduce,
                  distribute, modify, or create derivative works from our
                  content without prior written permission from the Church.
                </p>
                <p>
                  By submitting content to our Services (such as prayer
                  requests, testimonies, or business listings), you grant The
                  Friendship Baptist Church a non-exclusive, royalty-free,
                  perpetual license to use, display, and distribute that content
                  in connection with the operation of our Services and ministry
                  activities. You retain ownership of your submitted content.
                </p>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Limitation of Liability
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  The Services are provided on an &quot;as is&quot; and
                  &quot;as available&quot; basis. The Friendship Baptist Church
                  makes no warranties, express or implied, regarding the
                  reliability, accuracy, availability, or fitness of the
                  Services for any particular purpose.
                </p>
                <p>
                  To the fullest extent permitted by applicable law, The
                  Friendship Baptist Church, its pastor, officers, deacons,
                  staff, and volunteers shall not be liable for any indirect,
                  incidental, special, consequential, or punitive damages
                  arising out of or related to your use of the Services,
                  including but not limited to loss of data, loss of revenue, or
                  interruption of service.
                </p>
                <p>
                  The Church does not provide professional counseling, legal,
                  medical, or financial advice through its Services. Any
                  spiritual guidance offered through the website is intended
                  for general encouragement and should not be considered a
                  substitute for professional services.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div>
              <h2 className="font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                Changes to Terms
              </h2>
              <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                <p>
                  We may update these Terms from time to time to reflect changes
                  in our Services, legal requirements, or operational needs. When
                  we make material changes, we will update the &quot;Last
                  Updated&quot; date at the top of this page and, where
                  appropriate, notify registered users by email or through an
                  announcement on our website.
                </p>
                <p>
                  Your continued use of the Services after any changes to these
                  Terms constitutes your acceptance of the revised Terms. We
                  encourage you to review these Terms periodically.
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
                  If you have any questions or concerns about these Terms of
                  Service, please contact us:
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
