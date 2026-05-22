"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  breadcrumbs?: Breadcrumb[];
  className?: string;
  overlay?: "purple" | "dark" | "warm";
}

const overlayClasses = {
  purple: "from-purple-950/90 via-purple-900/70 to-purple-800/50",
  dark: "from-warm-950/90 via-warm-900/70 to-warm-800/50",
  warm: "from-purple-950/80 via-purple-900/60 to-peach-900/40",
};

export function PageHero({
  title,
  subtitle,
  backgroundImage = "/images/church/exterior.png",
  breadcrumbs,
  className,
  overlay = "purple",
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[320px] items-end overflow-hidden pb-12 pt-32 lg:min-h-[380px] lg:pb-16 lg:pt-40",
        className
      )}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r",
          overlayClasses[overlay]
        )}
      />

      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(196,167,125,0.08),transparent_50%)]" />

      {/* Content */}
      <div className="container-wide relative z-10">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            aria-label="Breadcrumb"
            className="mb-4"
          >
            <ol className="flex items-center gap-1.5 text-sm text-white/70">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5" />
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </motion.nav>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-heading text-fluid-4xl font-bold text-white"
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-3 max-w-2xl text-fluid-lg text-white/80"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Accent bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-6 h-1 w-20 origin-left rounded-full bg-gradient-to-r from-gold-400 to-peach-400"
        />
      </div>
    </section>
  );
}
