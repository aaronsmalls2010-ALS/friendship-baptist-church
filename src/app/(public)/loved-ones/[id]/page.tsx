"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHero } from "@/components/shared/page-hero";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { MOCK_MEMORIALS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import {
  Heart,
  BookOpen,
  Music,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Quote,
  Camera,
  MessageCircle,
  Calendar,
  Users,
} from "lucide-react";

/* ── Slow, reverent animation presets ──────────────────────────────── */
const sectionFade = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const photoFade = {
  enter: { opacity: 0, scale: 1.05 },
  center: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.0, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.8, ease: "easeInOut" },
  },
};

function formatLifespan(birth?: string, passing?: string) {
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const b = birth ? fmt(birth) : "Unknown";
  const p = passing ? fmt(passing) : "Unknown";
  return { birth: b, passing: p };
}

function yearsLived(birth?: string, passing?: string) {
  if (!birth || !passing) return null;
  const b = new Date(birth + "T12:00:00");
  const p = new Date(passing + "T12:00:00");
  let age = p.getFullYear() - b.getFullYear();
  if (
    p.getMonth() < b.getMonth() ||
    (p.getMonth() === b.getMonth() && p.getDate() < b.getDate())
  )
    age--;
  return age;
}

export default function MemorialProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const memorial = useMemo(
    () => MOCK_MEMORIALS.find((m) => m.id === id && m.is_published),
    [id]
  );

  const [currentPhoto, setCurrentPhoto] = useState(0);

  if (!memorial) {
    return (
      <>
        <PageHero
          title="Memorial Not Found"
          overlay="warm"
          breadcrumbs={[
                        { label: "Loved Ones", href: "/loved-ones" },
          ]}
        />
        <section className="section-padding bg-white">
          <div className="container-wide text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-warm-300" />
            <p className="text-warm-500">This memorial could not be found.</p>
            <Link
              href="/loved-ones"
              className="mt-6 inline-flex items-center gap-2 text-purple-700 hover:text-purple-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Hall of Angels
            </Link>
          </div>
        </section>
      </>
    );
  }

  const fullName = `${memorial.first_name} ${memorial.last_name}`;
  const dates = formatLifespan(memorial.date_of_birth, memorial.date_of_passing);
  const age = yearsLived(memorial.date_of_birth, memorial.date_of_passing);
  const photos = memorial.photos;
  const hasPhotos = photos.length > 0;

  const nextPhoto = () =>
    setCurrentPhoto((p) => (p + 1) % photos.length);
  const prevPhoto = () =>
    setCurrentPhoto((p) => (p - 1 + photos.length) % photos.length);

  return (
    <>
      {/* Hero */}
      <PageHero
        title={fullName}
        subtitle={`${dates.birth} — ${dates.passing}`}
        overlay="warm"
        breadcrumbs={[
                    { label: "Loved Ones", href: "/loved-ones" },
          { label: fullName },
        ]}
      />

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <article className="bg-white">
        {/* Portrait & Vitals */}
        <section className="section-padding">
          <div className="container-wide max-w-4xl">
            <motion.div
              variants={sectionFade}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center"
            >
              {/* Portrait */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-peach-100 ring-4 ring-purple-200 shadow-xl sm:h-48 sm:w-48">
                    {memorial.photo_url ? (
                      <img
                        src={memorial.photo_url}
                        alt={fullName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-heading text-5xl font-bold text-purple-300 sm:text-6xl">
                        {memorial.first_name[0]}
                        {memorial.last_name[0]}
                      </span>
                    )}
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
                    className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 text-gold-600 shadow-md ring-3 ring-white"
                  >
                    <span className="text-lg">&#10013;</span>
                  </motion.div>
                </div>
              </div>

              {/* Name */}
              <h1 className="font-heading text-fluid-3xl font-bold text-warm-900">
                {fullName}
              </h1>

              {/* Lifespan */}
              <p className="mt-2 text-warm-500 tracking-wider">
                {dates.birth} &mdash; {dates.passing}
                {age && (
                  <span className="ml-2 text-warm-400">({age} years)</span>
                )}
              </p>

              {/* Divider */}
              <div className="mx-auto my-6 flex max-w-xs items-center gap-3">
                <div className="h-px flex-1 bg-warm-200" />
                <Flower2 className="h-4 w-4 text-purple-300" />
                <div className="h-px flex-1 bg-warm-200" />
              </div>

              {/* Church roles */}
              {memorial.church_roles && memorial.church_roles.length > 0 && (
                <div className="mb-6 flex flex-wrap justify-center gap-2">
                  {memorial.church_roles.map((role, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Quick stats — mobile-friendly contact-page style */}
              <div className="mx-auto grid max-w-md gap-3 sm:grid-cols-2">
                {memorial.scripture && (
                  <div className="flex items-center gap-3 rounded-xl border border-warm-200 bg-warm-50 p-4">
                    <BookOpen className="h-5 w-5 flex-shrink-0 text-purple-400" />
                    <div className="text-left">
                      <p className="text-xs text-warm-400">Favorite Scripture</p>
                      <p className="text-sm font-medium text-warm-700">{memorial.scripture}</p>
                    </div>
                  </div>
                )}
                {memorial.favorite_hymn && (
                  <div className="flex items-center gap-3 rounded-xl border border-warm-200 bg-warm-50 p-4">
                    <Music className="h-5 w-5 flex-shrink-0 text-purple-400" />
                    <div className="text-left">
                      <p className="text-xs text-warm-400">Favorite Hymn</p>
                      <p className="text-sm font-medium text-warm-700">{memorial.favorite_hymn}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Scripture Quote Band */}
        {memorial.scripture_text && (
          <motion.section
            variants={sectionFade}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-800 to-purple-900 py-12"
          >
            <div className="container-wide max-w-3xl text-center">
              <Quote className="mx-auto mb-4 h-8 w-8 text-purple-300 opacity-60" />
              <blockquote className="font-heading text-fluid-lg italic text-white/90 leading-relaxed">
                &ldquo;{memorial.scripture_text}&rdquo;
              </blockquote>
              {memorial.scripture && (
                <p className="mt-4 text-sm font-medium tracking-wider text-purple-300">
                  &mdash; {memorial.scripture}
                </p>
              )}
            </div>
          </motion.section>
        )}

        {/* Obituary */}
        <section className="section-padding bg-white">
          <div className="container-wide max-w-3xl">
            <motion.div
              variants={sectionFade}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-center font-heading text-fluid-xl font-bold text-warm-900">
                A Life Well Lived
              </h2>
              <div className="prose prose-warm mx-auto max-w-none text-warm-700 leading-[1.9]">
                {memorial.obituary.split("\n").map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Family Message */}
        {memorial.family_message && (
          <section className="bg-warm-50 py-12">
            <div className="container-wide max-w-2xl">
              <motion.div
                variants={sectionFade}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="rounded-2xl border border-warm-200 bg-white p-8 text-center shadow-sm"
              >
                <Heart className="mx-auto mb-4 h-6 w-6 text-purple-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-warm-400">
                  From the Family
                </p>
                <blockquote className="mt-4 font-heading text-lg italic text-warm-700 leading-relaxed">
                  &ldquo;{memorial.family_message}&rdquo;
                </blockquote>
              </motion.div>
            </div>
          </section>
        )}

        {/* Photo Gallery — slideshow-style */}
        {hasPhotos && (
          <section className="section-padding bg-white">
            <div className="container-wide max-w-3xl">
              <motion.div
                variants={sectionFade}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="mb-6 flex items-center justify-center gap-2 text-warm-400">
                  <Camera className="h-5 w-5" />
                  <h2 className="font-heading text-fluid-xl font-bold text-warm-900">
                    Cherished Memories
                  </h2>
                </div>

                {/* Slideshow */}
                <div className="relative overflow-hidden rounded-2xl bg-warm-100">
                  <div className="aspect-[4/3] sm:aspect-video">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentPhoto}
                        variants={photoFade}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <img
                          src={photos[currentPhoto].image_url}
                          alt={photos[currentPhoto].caption || `Photo of ${fullName}`}
                          className="h-full w-full object-cover"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Nav arrows */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Dots indicator */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                      {photos.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPhoto(idx)}
                          className={`h-2 w-2 rounded-full transition-all duration-500 ${
                            idx === currentPhoto
                              ? "bg-white w-6"
                              : "bg-white/50 hover:bg-white/70"
                          }`}
                          aria-label={`View photo ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Caption */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentPhoto}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-3 text-center text-sm italic text-warm-500"
                  >
                    {photos[currentPhoto].caption}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            </div>
          </section>
        )}

        {/* Tributes / Comments */}
        {memorial.comments.length > 0 && (
          <section className="section-padding bg-warm-50">
            <div className="container-wide max-w-3xl">
              <motion.div
                variants={sectionFade}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="mb-8 flex items-center justify-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-400" />
                  <h2 className="font-heading text-fluid-xl font-bold text-warm-900">
                    Tributes &amp; Remembrances
                  </h2>
                </div>

                <div className="space-y-5">
                  {memorial.comments.map((comment, idx) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.8,
                        delay: idx * 0.15,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      className="rounded-xl border border-warm-200 bg-white p-6 shadow-sm"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                          <span className="text-sm font-bold text-purple-600">
                            {comment.author_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-warm-900">
                            {comment.author_name}
                          </p>
                          <p className="text-xs text-warm-400">
                            {formatDate(comment.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="text-warm-600 leading-relaxed italic">
                        &ldquo;{comment.body}&rdquo;
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Back Navigation */}
        <section className="bg-white py-8">
          <div className="container-wide text-center">
            <FadeIn>
              <Link
                href="/loved-ones"
                className="inline-flex items-center gap-2 rounded-xl border border-warm-200 px-6 py-3 text-sm font-medium text-warm-600 transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Hall of Angels
              </Link>
            </FadeIn>
          </div>
        </section>
      </article>
    </>
  );
}
