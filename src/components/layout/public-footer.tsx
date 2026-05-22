import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Heart } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Tagline } from "@/components/brand/tagline";
import { CHURCH_INFO } from "@/lib/constants";

const footerLinks = {
  about: [
    { label: "Our Story", href: "/about" },
    { label: "Church History", href: "/history" },
    { label: "Pastor Smalls", href: "/pastor" },
    { label: "Deacons", href: "/deacons" },
  ],
  connect: [
    { label: "Ministries", href: "/ministries" },
    { label: "Events", href: "/events" },
    { label: "Calendar", href: "/calendar" },
    { label: "New Here?", href: "/welcome" },
    { label: "Business Directory", href: "/business-directory" },
  ],
  resources: [
    { label: "Sermons", href: "/media?tab=sermons" },
    { label: "Prayer Requests", href: "/prayer" },
    { label: "Give", href: "/give" },
    { label: "Contact Us", href: "/contact" },
    { label: "Member Login", href: "/auth/login" },
  ],
};

export function PublicFooter() {
  return (
    <footer className="bg-purple-950 text-white/80 lg:pb-0 pb-16">
      {/* Main Footer */}
      <div className="container-wide section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Church Info */}
          <div className="lg:col-span-1">
            <Logo variant="full" size="sm" darkBg className="mb-4" />
            <Tagline variant="gold" className="mb-6" />

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-peach-400 shrink-0" />
                <span>
                  {CHURCH_INFO.address.street}
                  <br />
                  {CHURCH_INFO.address.city}, {CHURCH_INFO.address.state}{" "}
                  {CHURCH_INFO.address.zip}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-peach-400 shrink-0" />
                <a href={`tel:${CHURCH_INFO.phone}`} className="hover:text-white transition-colors">
                  {CHURCH_INFO.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-peach-400 shrink-0" />
                <a href={`mailto:${CHURCH_INFO.email}`} className="hover:text-white transition-colors">
                  {CHURCH_INFO.email}
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-base font-semibold text-white mb-4">About</h3>
            <ul className="space-y-2.5">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-peach-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white mb-4">
              Connect
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.connect.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-peach-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-peach-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Service Times */}
            <div className="mt-8">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold-400" />
                Service Times
              </h3>
              <ul className="space-y-2 text-sm">
                {CHURCH_INFO.serviceTimes.map((service) => (
                  <li key={service.name}>
                    <span className="text-peach-400">{service.day}</span>{" "}
                    {service.time}
                    <br />
                    <span className="text-white/60">{service.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-purple-900/50">
        <div className="container-wide py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>
            &copy; {new Date().getFullYear()} {CHURCH_INFO.name}. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white/80 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white/80 transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="flex items-center gap-1">
            Built with <Heart className="h-3 w-3 text-peach-400" /> for the
            glory of God
          </p>
        </div>
      </div>
    </footer>
  );
}
