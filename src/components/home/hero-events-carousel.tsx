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
  ArrowRight,
  X,
} from "lucide-react";
import { CHURCH_TZ } from "@/lib/utils";
import type { Event } from "@/types";

// The event card advances every 5 seconds, pausing on hover / focus.
const ROTATE_MS = 5000;

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
  /** The CMS-editable church welcome hero. Always visible; the event card overlays it. */
  welcome: ReactNode;
}

export function HeroEventsCarousel({ welcome }: HeroEventsCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const [events, setEvents] = useState<Event[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Fetch upcoming events on mount
  useEffect(() => {
    let active = true;
    fetch("/api/public/events?window=upcoming")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        if (active) setEvents(Array.isArray(data?.events) ? data.events : []);
      })
      .catch(() => {
        /* silently keep the welcome-only hero */
      });
    return () => {
      active = false;
    };
  }, []);

  const count = events.length;
  const hasCarousel = count > 0;
  const hasMultiple = count > 1;

  // Clamp index if the event list shrinks
  useEffect(() => {
    if (index > count - 1) setIndex(0);
  }, [index, count]);

  const goTo = useCallback(
    (nextIdx: number) => {
      if (count === 0) return;
      setIndex(((nextIdx % count) + count) % count);
    },
    [count]
  );
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  // Auto-advance — disabled when paused, reduced-motion, or only one event
  useEffect(() => {
    if (!hasMultiple || paused || prefersReducedMotion) return;
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => clearTimeout(t);
  }, [hasMultiple, paused, prefersReducedMotion, index, count]);

  // Lock body scroll while the mobile modal is open
  useEffect(() => {
    if (!modalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [modalOpen]);

  // Close the mobile modal on Escape; focus the close button when it opens
  useEffect(() => {
    if (!modalOpen) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const currentEvent = events[index] ?? null;

  // Shared rotating card + controls, reused by the desktop overlay and mobile modal.
  const carousel = currentEvent && (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentEvent.id}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -12 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: "easeInOut" }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}: ${currentEvent.title}`}
          >
            <EventCard event={currentEvent} />
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next — only when there is more than one event */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous event"
              className="absolute left-2 top-[28%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm ring-1 ring-white/25 transition-colors hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next event"
              className="absolute right-2 top-[28%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm ring-1 ring-white/25 transition-colors hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {hasMultiple && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {events.map((ev, i) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to event ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                i === index
                  ? "w-7 bg-gold-300"
                  : "w-2.5 bg-white/60 hover:bg-white/90"
              }`}
            />
          ))}
        </div>
      )}

      {/* Screen-reader live announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Event ${index + 1} of ${count}: ${currentEvent.title}`}
      </div>
    </>
  );

  return (
    <section
      className="group/hero relative min-h-screen overflow-hidden"
      data-has-events={hasCarousel ? "true" : "false"}
    >
      {/* Welcome hero — the default, always-visible layer */}
      {welcome}

      {hasCarousel && currentEvent && (
        <>
          {/* Desktop: floating card, docked top-right and vertically centered */}
          <div
            className="hidden lg:absolute lg:right-6 lg:top-1/2 lg:z-20 lg:block lg:w-[420px] lg:-translate-y-1/2 xl:right-10 xl:w-[460px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label="Upcoming events"
          >
            <p className="mb-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/90 drop-shadow">
              Upcoming Events
            </p>
            {carousel}
          </div>

          {/* Mobile: a pill that brings up the events in a modal */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 text-sm font-semibold text-purple-950 shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:hidden"
            aria-haspopup="dialog"
          >
            <CalendarDays className="h-4 w-4" />
            Upcoming Events
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-950 px-1.5 text-xs font-bold text-gold-300">
              {count}
            </span>
          </button>

          {/* Mobile modal — bottom sheet the visitor can read, then close */}
          <AnimatePresence>
            {modalOpen && (
              <div
                className="fixed inset-0 z-[60] lg:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Upcoming events"
              >
                <motion.div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
                  onClick={() => setModalOpen(false)}
                />
                <motion.div
                  className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-purple-950 shadow-2xl"
                  initial={{ y: prefersReducedMotion ? 0 : "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: prefersReducedMotion ? 0 : "100%" }}
                  transition={{ type: "tween", duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
                >
                  {/* Header — pinned */}
                  <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-300">
                      Upcoming Events
                    </h2>
                    <button
                      ref={closeBtnRef}
                      type="button"
                      onClick={() => setModalOpen(false)}
                      aria-label="Close upcoming events"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {/* Scroll region */}
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
                    {carousel}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </section>
  );
}

/** A single upcoming-event card — image on top, details underneath. */
function EventCard({ event }: { event: Event }) {
  const hasImage = Boolean(event.image_url);
  return (
    <a
      href={`/events#${event.id}`}
      className="group/card block focus-visible:outline-none"
      aria-label={`View details for ${event.title}`}
    >
      {/* Image on top — object-contain so the full flyer/photo is always
          visible (never cropped); a soft matte fills any letterboxing. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-warm-100">
        {hasImage ? (
          <Image
            src={event.image_url as string}
            alt={event.title}
            fill
            className="object-contain transition-transform duration-500 group-hover/card:scale-[1.03]"
            sizes="(min-width: 1024px) 440px, 100vw"
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
              width={200}
              height={200}
              className="relative w-2/5 max-w-[180px] object-contain opacity-95 drop-shadow-xl"
            />
          </div>
        )}
        {/* Date pill overlaps the bottom of the image */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-purple-950 shadow-md">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatPill(event.start_date)}
        </span>
      </div>

      {/* Event information under the image */}
      <div className="p-5">
        <h3 className="font-heading text-lg font-bold leading-snug text-purple-900 line-clamp-2 transition-colors group-hover/card:text-purple-700">
          {event.title}
        </h3>

        {event.location && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-purple-700">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1 font-medium">{event.location}</span>
          </div>
        )}

        {event.description && (
          <p className="mt-2 text-sm text-warm-600 line-clamp-2">
            {event.description}
          </p>
        )}

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 transition-colors group-hover/card:text-gold-700">
          View Event Details
          <ArrowRight className="h-4 w-4 transition-transform group-hover/card:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
}
