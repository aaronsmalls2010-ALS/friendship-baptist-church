"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PageHero } from "@/components/shared/page-hero";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { FadeIn } from "@/components/motion/fade-in";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MOCK_MEMORIALS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Heart,
  BookOpen,
  Music,
  Users,
  ChevronRight,
  Flower2,
} from "lucide-react";

// Slow, reverent animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1.0,
      delay: i * 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },
  },
};

function formatLifespan(birth?: string, passing?: string) {
  const birthYear = birth ? new Date(birth + "T12:00:00").getFullYear() : "?";
  const passYear = passing ? new Date(passing + "T12:00:00").getFullYear() : "?";
  return `${birthYear} – ${passYear}`;
}

export default function LovedOnesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const published = useMemo(
    () => MOCK_MEMORIALS.filter((m) => m.is_published),
    []
  );

  const filtered = useMemo(() => {
    if (!searchTerm) return published;
    const term = searchTerm.toLowerCase();
    return published.filter(
      (m) =>
        m.first_name.toLowerCase().includes(term) ||
        m.last_name.toLowerCase().includes(term) ||
        m.church_roles?.some((r) => r.toLowerCase().includes(term))
    );
  }, [searchTerm, published]);

  return (
    <>
      {/* Hero — warm, reverent tone */}
      <PageHero
        title="Loved Ones Gone Home"
        subtitle="Hall of Angels"
        overlay="warm"
        breadcrumbs={[
          { label: "Loved Ones Gone Home" },
        ]}
      />

      {/* Intro */}
      <section className="section-padding bg-white">
        <div className="container-wide max-w-3xl text-center">
          <motion.div
            variants={headerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Flower2 className="mx-auto mb-4 h-8 w-8 text-purple-300" />
            <h2 className="font-heading text-fluid-2xl font-bold text-warm-900">
              In Loving Memory
            </h2>
            <p className="mt-4 text-warm-600 leading-relaxed">
              This sacred space honors the cherished members of Friendship Baptist Church
              who have gone home to be with the Lord. Their faith, service, and love
              continue to inspire us. May their memories be a blessing to all who
              knew them.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search */}
      <section className="bg-warm-50 py-6">
        <div className="container-wide max-w-md">
          <FadeIn>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
              <Input
                type="text"
                placeholder="Search by name or church role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-warm-200 bg-white focus-visible:ring-purple-500"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Memorial Cards — Obituary-Style Directory */}
      <section className="section-padding bg-gradient-to-b from-warm-50 to-white">
        <div className="container-wide">
          {filtered.length === 0 ? (
            <FadeIn>
              <div className="mx-auto max-w-md rounded-xl border border-warm-200 bg-white p-12 text-center">
                <Heart className="mx-auto mb-3 h-10 w-10 text-warm-300" />
                <p className="text-warm-500">No memorials match your search.</p>
              </div>
            </FadeIn>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 max-w-5xl mx-auto">
              <AnimatePresence mode="popLayout">
                {filtered.map((memorial, i) => (
                  <motion.div
                    key={memorial.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    exit="exit"
                    viewport={{ once: true, margin: "-40px" }}
                    layout
                  >
                    <Link
                      href={`/loved-ones/${memorial.id}`}
                      className="group block"
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-warm-200 bg-white shadow-sm transition-all duration-500 hover:shadow-xl hover:border-purple-200">
                        {/* Top decorative accent */}
                        <div className="h-2 bg-gradient-to-r from-purple-600 via-purple-400 to-gold-400" />

                        <div className="p-6 sm:p-8">
                          {/* Portrait Area */}
                          <div className="mb-6 flex justify-center">
                            <div className="relative">
                              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-peach-100 ring-4 ring-white shadow-lg">
                                {memorial.photo_url ? (
                                  <img
                                    src={memorial.photo_url}
                                    alt={`${memorial.first_name} ${memorial.last_name}`}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="font-heading text-3xl font-bold text-purple-400">
                                    {memorial.first_name[0]}
                                    {memorial.last_name[0]}
                                  </span>
                                )}
                              </div>
                              {/* Decorative cross */}
                              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gold-100 text-gold-600 shadow-sm ring-2 ring-white">
                                <span className="text-sm">&#10013;</span>
                              </div>
                            </div>
                          </div>

                          {/* Name — obituary front style */}
                          <div className="text-center">
                            <h3 className="font-heading text-xl font-bold text-warm-900 group-hover:text-purple-800 transition-colors duration-500">
                              {memorial.first_name} {memorial.last_name}
                            </h3>
                            <p className="mt-1 text-sm font-medium text-warm-400 tracking-wider">
                              {formatLifespan(memorial.date_of_birth, memorial.date_of_passing)}
                            </p>
                          </div>

                          {/* Divider */}
                          <div className="my-4 flex items-center gap-3">
                            <div className="h-px flex-1 bg-warm-200" />
                            <Flower2 className="h-3.5 w-3.5 text-warm-300" />
                            <div className="h-px flex-1 bg-warm-200" />
                          </div>

                          {/* Roles */}
                          {memorial.church_roles && memorial.church_roles.length > 0 && (
                            <div className="mb-4 flex flex-wrap justify-center gap-1.5">
                              {memorial.church_roles.map((role, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="bg-purple-50 text-purple-600 text-xs font-normal"
                                >
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Scripture */}
                          {memorial.scripture && (
                            <div className="mb-4 flex items-center justify-center gap-1.5 text-xs text-warm-400">
                              <BookOpen className="h-3 w-3" />
                              <span className="italic">{memorial.scripture}</span>
                            </div>
                          )}

                          {/* Favorite Hymn */}
                          {memorial.favorite_hymn && (
                            <div className="mb-4 flex items-center justify-center gap-1.5 text-xs text-warm-400">
                              <Music className="h-3 w-3" />
                              <span className="italic">&ldquo;{memorial.favorite_hymn}&rdquo;</span>
                            </div>
                          )}

                          {/* Preview of obituary */}
                          <p className="text-center text-sm text-warm-500 leading-relaxed line-clamp-3">
                            {memorial.obituary}
                          </p>

                          {/* Footer Stats */}
                          <div className="mt-5 flex items-center justify-between border-t border-warm-100 pt-4 text-xs text-warm-400">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              <span>{memorial.comments.length} tribute{memorial.comments.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="flex items-center gap-1 text-purple-500 group-hover:text-purple-700 transition-colors duration-500">
                              <span className="font-medium">View Memorial</span>
                              <ChevronRight className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Scripture Divider */}
      <ScriptureDivider
        reference="Revelation 21:4"
        text="He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away."
      />

      {/* CTA for members */}
      <section className="section-padding bg-white">
        <div className="container-wide max-w-2xl text-center">
          <FadeIn>
            <Users className="mx-auto mb-4 h-8 w-8 text-purple-400" />
            <h3 className="font-heading text-fluid-xl font-bold text-warm-900">
              Honor a Loved One
            </h3>
            <p className="mt-3 text-warm-500 leading-relaxed">
              Church family members can create a memorial page for a loved one
              who has gone home to be with the Lord. Sign in to your member
              portal to get started.
            </p>
            <div className="mt-6">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-8 py-3.5 font-medium text-white shadow-lg shadow-purple-900/20 transition-all hover:bg-purple-600"
              >
                <Heart className="h-4 w-4" />
                Member Sign In
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
