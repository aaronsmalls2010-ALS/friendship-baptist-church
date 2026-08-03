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

/** A single upcoming-event slide — split image | details. */
function EventSlide({ event }: { event: Event }) {
  const hasImage = Boolean(event.image_url);
  return (
    // Fill the whole slide with the brand colour (so the fixed nav has a clean
    // backdrop), then inset the actual content BELOW the nav bar (top-20/24).
    <div className="absolute inset-0 bg-purple-950">
      <div className="absolute inset-x-0 bottom-0 top-28 flex flex-col md:flex-row lg:top-32">
        {/* Image half (church logo fallback when no image). object-contain so
            the full image is always shown, never cropped. */}
        <div className="relative h-2/5 w-full overflow-hidden bg-purple-950 md:h-full md:w-1/2">
          {hasImage ? (
            <Image
              src={event.image_url as string}
              alt={event.title}
              fill
              className="object-contain"
              sizes="(min-width: 768px) 50vw, 100vw"
              priority={false}
            />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-800 via-purple-700 to-purple-950">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 25%, rgba(251,191,36,0.35) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(251,146,60,0.3) 0, transparent 40%)",
              }}
            />
            <Image
              src="/images/logos/fbc-logo-light.png"
              alt="Friendship Baptist Church"
              width={320}
              height={320}
              className="relative w-1/2 max-w-[240px] object-contain opacity-95 drop-shadow-xl"
            />
          </div>
        )}
        {/* Soft seam blending image into the details panel */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-white/20 md:bg-gradient-to-r md:from-transparent md:to-white/20" />
      </div>

      {/* Details half — white panel, dark centered text, on-brand accents */}
      <div className="relative flex h-3/5 w-full items-center justify-center overflow-y-auto bg-white md:h-full md:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="flex w-full flex-col items-center px-6 py-6 text-center sm:px-12 sm:py-10 md:px-14 lg:px-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-4 py-1.5 text-sm font-semibold text-purple-950 shadow-sm">
            <CalendarDays className="h-4 w-4" />
            {formatPill(event.start_date)}
          </span>

          <h2 className="mt-3 font-heading text-2xl font-bold leading-tight text-purple-900 sm:mt-5 sm:text-4xl lg:text-5xl">
            {event.title}
          </h2>

          <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-gold-400 to-purple-500 sm:mt-4" />

          {event.location && (
            <div className="mt-3 flex items-center justify-center gap-2 text-purple-700 sm:mt-4">
              <MapPin className="h-5 w-5 shrink-0" />
              <span className="font-medium">{event.location}</span>
            </div>
          )}

          {event.description && (
            <p className="mt-3 max-w-xl text-sm text-warm-600 line-clamp-2 sm:mt-4 sm:text-base sm:line-clamp-3">
              {event.description}
            </p>
          )}

          <div className="mt-5 sm:mt-8">
            <CTAButton
              href={`/events#${event.id}`}
              variant="gold"
              size="lg"
              icon={<CalendarDays className="h-5 w-5" />}
            >
              View Event Details
            </CTAButton>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
