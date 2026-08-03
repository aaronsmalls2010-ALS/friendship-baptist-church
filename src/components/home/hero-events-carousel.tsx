"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { CTAButton } from "@/components/shared/cta-button";
import { CHURCH_TZ } from "@/lib/utils";
import type { Event } from "@/types";

const AUTO_ADVANCE_MS = 6000;

/** Short date pill, e.g. "Sat, Jun 21 · 10:00 AM" */
function formatPill(iso: string): string {
  try {
    const d = new Date(iso);
    const day = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: CHURCH_TZ,
    }).format(d);
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: CHURCH_TZ,
    }).format(d);
    return `${day} · ${time}`;
  } catch {
    return "";
  }
}

interface HeroEventsCarouselProps {
  /** Slide 0 — the CMS-editable church welcome. Rendered as-is inside the first slide. */
  welcome: ReactNode;
}

export function HeroEventsCarousel({ welcome }: HeroEventsCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const [events, setEvents] = useState<Event[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const liveRef = useRef<HTMLDivElement>(null);

  // Fetch upcoming events on mount
  useEffect(() => {
    let active = true;
    fetch("/api/public/events?window=upcoming")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        if (active) setEvents(Array.isArray(data?.events) ? data.events : []);
      })
      .catch(() => {
        /* silently keep welcome-only hero */
      });
    return () => {
      active = false;
    };
  }, []);

  const totalSlides = 1 + events.length;
  const hasCarousel = events.length > 0;

  // Clamp index if the event list shrinks
  useEffect(() => {
    if (index > totalSlides - 1) setIndex(0);
  }, [index, totalSlides]);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % totalSlides) + totalSlides) % totalSlides);
    },
    [totalSlides]
  );
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  // Auto-advance — disabled when paused, reduced-motion, or welcome-only
  useEffect(() => {
    if (!hasCarousel || paused || prefersReducedMotion) return;
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % totalSlides);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [hasCarousel, paused, prefersReducedMotion, index, totalSlides]);

  // Keyboard arrows
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!hasCarousel) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    },
    [hasCarousel, prev, next]
  );

  const currentEvent = index > 0 ? events[index - 1] : null;

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Church welcome and upcoming events"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      {/* Slides */}
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.7,
            ease: "easeInOut",
          }}
          role="group"
          aria-roledescription="slide"
          aria-label={
            currentEvent
              ? `Slide ${index + 1} of ${totalSlides}: ${currentEvent.title}`
              : `Slide 1 of ${totalSlides}: Welcome`
          }
        >
          {currentEvent ? (
            <EventSlide event={currentEvent} />
          ) : (
            <div className="absolute inset-0">{welcome}</div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Carousel chrome — only when there is at least one event */}
      {hasCarousel && (
        <>
          {/* Prev / Next arrows */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm ring-1 ring-white/20 transition-colors hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm ring-1 ring-white/20 transition-colors hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={
                  i === 0 ? "Go to welcome slide" : `Go to event ${i}`
                }
                aria-current={i === index ? "true" : undefined}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                  i === index
                    ? "w-7 bg-gold-300"
                    : "w-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          {/* Screen-reader live announcement */}
          <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true">
            {currentEvent
              ? `Slide ${index + 1} of ${totalSlides}: ${currentEvent.title}`
              : `Slide 1 of ${totalSlides}: Welcome`}
          </div>
        </>
      )}
    </section>
  );
}

/** A single upcoming-event slide. */
function EventSlide({ event }: { event: Event }) {
  return (
    <div className="absolute inset-0">
      {/* Background */}
      {event.image_url ? (
        <Image
          src={event.image_url}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
      ) : (
        // Tasteful branded gradient fallback when no image
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800 via-purple-700 to-purple-950">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, rgba(251,191,36,0.35) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(251,146,60,0.3) 0, transparent 40%)",
            }}
          />
        </div>
      )}

      {/* Legibility overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/85 via-purple-950/45 to-purple-950/60" />
      <div className="absolute inset-0 bg-black/25" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="container-wide text-center text-white pt-24 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/95 px-4 py-1.5 text-sm font-semibold text-purple-950 shadow-lg">
              <CalendarDays className="h-4 w-4" />
              {formatPill(event.start_date)}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 font-heading text-fluid-hero font-bold leading-tight"
          >
            {event.title}
          </motion.h2>

          {event.location && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-4 flex items-center justify-center gap-2 text-gold-200"
            >
              <MapPin className="h-5 w-5" />
              <span className="font-medium">{event.location}</span>
            </motion.div>
          )}

          {event.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mx-auto mt-4 max-w-2xl text-fluid-base text-white/80 line-clamp-2"
            >
              {event.description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-10 flex justify-center"
          >
            <CTAButton
              href={`/events#${event.id}`}
              variant="gold"
              size="lg"
              icon={<CalendarDays className="h-5 w-5" />}
            >
              View Event Details
            </CTAButton>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
