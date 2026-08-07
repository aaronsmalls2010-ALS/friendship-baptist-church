"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Loader2, CalendarDays } from "lucide-react";
import { CTAButton } from "@/components/shared/cta-button";
import { PageHero } from "@/components/shared/page-hero";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { EditableText } from "@/components/cms/editable-text";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { EventsCalendar } from "@/components/events/events-calendar";
import type { Occurrence } from "@/lib/events/calendar";
import type { Event, Ministry } from "@/types";

export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [birthdayEvents, setBirthdayEvents] = useState<Event[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [eventsRes, ministriesRes, birthdaysRes] = await Promise.all([
          fetch("/api/public/events"),
          fetch("/api/public/ministries"),
          fetch("/api/public/birthdays"),
        ]);
        const eventsData = await eventsRes.json();
        const ministriesData = await ministriesRes.json();
        const birthdaysData = await birthdaysRes.json();
        setEvents(eventsData.events ?? []);
        setMinistries(ministriesData.ministries ?? []);

        // Convert birthday data into Event objects for the current and next
        // year so both the 120-day list window and calendar navigation across
        // a year boundary still show birthdays.
        const currentYear = new Date().getFullYear();
        const bdays: Event[] = (birthdaysData.birthdays ?? []).flatMap(
          (p: {
            id: string;
            first_name: string;
            last_name: string;
            date_of_birth: string;
          }) => {
            const dob = new Date(p.date_of_birth + "T12:00:00");
            return [currentYear, currentYear + 1].map((yr) => {
              const bdayDate = new Date(
                yr,
                dob.getMonth(),
                dob.getDate(),
                12,
                0,
                0
              );
              return {
                id: `bday-${p.id}-${yr}`,
                title: `🎂 ${p.first_name} ${p.last_name}'s Birthday`,
                description: `Happy Birthday to ${p.first_name} ${p.last_name}! Wishing you many blessings.`,
                start_date: bdayDate.toISOString(),
                location: "",
                rsvp_enabled: false,
                is_published: true,
                created_at: new Date().toISOString(),
              } as Event;
            });
          }
        );
        setBirthdayEvents(bdays);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Public RSVP flows through the contact form (no member session here).
  const featuredCta = (event: Occurrence) =>
    event.rsvp_enabled ? (
      <a
        href={`/contact?subject=${encodeURIComponent(`RSVP: ${event.title}`)}`}
      >
        <Button className="bg-purple-700 hover:bg-purple-600 text-white px-8 py-3 text-base rounded-xl">
          RSVP Now
        </Button>
      </a>
    ) : null;

  const cardCta = (event: Occurrence) =>
    event.rsvp_enabled ? (
      <a href={`/contact?subject=${encodeURIComponent(`RSVP: ${event.title}`)}`}>
        <Button
          variant="ghost"
          className="self-start -ml-2 text-purple-700 hover:text-purple-800 hover:bg-purple-50 gap-1.5 text-sm font-medium p-2 h-auto"
        >
          RSVP
          <ArrowRight className="h-4 w-4" />
        </Button>
      </a>
    ) : null;

  return (
    <>
      <PageHero
        title={<EditableText id="events.hero.title" fallback="Events & Happenings" as="span" />}
        subtitle={<EditableText id="events.hero.subtitle" fallback="Join us for worship, fellowship, and community" as="span" />}
        breadcrumbs={[{ label: "Events" }]}
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <EventsCalendar
          events={events}
          birthdayEvents={birthdayEvents}
          ministries={ministries}
          recurrenceHorizonDays={90}
          featuredCta={featuredCta}
          cardCta={cardCta}
          upcomingHeading={<EditableText id="events.upcoming.heading" fallback="Upcoming Events" as="span" />}
          upcomingSubtitle={<EditableText id="events.upcoming.subtitle" fallback="Mark your calendar and join us" as="span" />}
          pastHeading={<EditableText id="events.past.heading" fallback="Past Events" as="span" />}
          pastSubtitle={<EditableText id="events.past.subtitle" fallback="A look back at recent gatherings" as="span" />}
          middleSlot={
            <ScriptureDivider
              text={<EditableText id="events.scripture.text" fallback="For where two or three gather in my name, there am I with them." as="span" multiline />}
              reference={<EditableText id="events.scripture.reference" fallback="Matthew 18:20" as="span" />}
            />
          }
        />
      )}

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-narrow text-center">
          <FadeIn>
            <h2 className="text-fluid-2xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-4">
              <EditableText id="events.cta.heading" fallback="Never Miss a Gathering" as="span" />
            </h2>
            <p className="text-warm-600 dark:text-warm-400 text-lg mb-8 max-w-xl mx-auto">
              <EditableText id="events.cta.description" fallback="Stay connected with everything happening at Friendship Baptist Church." as="span" multiline />
            </p>
            <CTAButton
              href="/contact"
              icon={<CalendarDays className="h-5 w-5" />}
            >
              Get in Touch
            </CTAButton>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
