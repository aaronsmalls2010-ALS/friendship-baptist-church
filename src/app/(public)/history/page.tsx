"use client";

import { motion } from "framer-motion";
import { PageHero } from "@/components/shared/page-hero";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { CTAButton } from "@/components/shared/cta-button";
import { FadeIn } from "@/components/motion/fade-in";
import { MOCK_TIMELINE } from "@/lib/mock-data";
import { Church, Heart } from "lucide-react";
import { EditableText } from "@/components/cms/editable-text";

// Sort timeline by order
const timeline = [...MOCK_TIMELINE].sort((a, b) => a.order - b.order);

export default function HistoryPage() {
  return (
    <>
      {/* Hero */}
      <PageHero
        title="Our History"
        subtitle="A legacy of faith since 1865"
        overlay="warm"
        breadcrumbs={[
          { label: "About", href: "/about" },
          { label: "Our History" },
        ]}
      />

      {/* Timeline Section */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="font-heading text-fluid-3xl font-bold text-warm-900">
                A Journey Through Time
              </h2>
              <EditableText
                id="history.intro.desc"
                as="p"
                multiline
                className="mt-4 text-fluid-base text-warm-600"
                fallback="From humble gatherings beneath Lowcountry oaks to a thriving congregation, the story of Friendship Baptist Church is a testament to God's faithfulness across generations."
              />
            </div>
          </FadeIn>

          {/* Timeline */}
          <div className="relative mx-auto max-w-5xl">
            {/* Center vertical line — desktop: centered, mobile: left-aligned */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200 md:left-1/2 md:-translate-x-px" />

            {timeline.map((event, index) => {
              const isEven = index % 2 === 0;

              return (
                <div
                  key={event.id}
                  className="relative py-8 md:py-12"
                >
                  {/* Dot on the line */}
                  <div className="absolute left-4 top-8 z-10 -translate-x-1/2 md:left-1/2 md:top-12">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        delay: 0.1,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                      className="h-4 w-4 rounded-full bg-purple-700 ring-4 ring-purple-100"
                    />
                  </div>

                  {/* Content — mobile: always left-aligned with padding; desktop: alternating */}
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: isEven ? -60 : 60,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                    }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      duration: 0.6,
                      delay: 0.15,
                      ease: [0.25, 0.4, 0.25, 1],
                    }}
                    className={`
                      ml-12 md:ml-0 md:w-[calc(50%-2rem)]
                      ${isEven ? "md:mr-auto md:pr-8 md:text-right" : "md:ml-auto md:pl-8 md:text-left"}
                    `}
                  >
                    {/* Year badge */}
                    <span className="inline-block rounded-full bg-purple-700 px-3 py-1 text-sm font-bold text-white">
                      {event.year}
                    </span>

                    {/* Title */}
                    <h3 className="mt-3 font-heading text-xl font-bold text-warm-900 lg:text-2xl">
                      {event.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-warm-600 leading-relaxed">
                      {event.description}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Legacy Section */}
      <section className="section-padding bg-warm-50">
        <div className="container-narrow">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-purple-100 p-4">
                  <Church className="h-8 w-8 text-purple-700" />
                </div>
              </div>

              <h2 className="font-heading text-fluid-3xl font-bold text-warm-900">
                A Living Legacy
              </h2>

              <EditableText
                id="history.legacy.p1"
                as="p"
                multiline
                className="mt-6 text-fluid-base text-warm-600 leading-relaxed"
                fallback="For over 160 years, Friendship Baptist Church has stood as a beacon of hope in Beaufort, South Carolina. Born from the prayers of the formerly enslaved and nurtured by generation after generation of faithful believers, this church is more than a building — it is a living testimony."
              />

              <EditableText
                id="history.legacy.scripture"
                as="p"
                multiline
                className="mt-4 font-scripture text-fluid-lg italic text-purple-800 leading-relaxed"
                fallback="From the Gullah Geechee traditions that echo in our praise to the oak-shaded grounds where the gospel was first spoken in freedom, every brick and every hymn carries the weight of our ancestors' faith."
              />

              <EditableText
                id="history.legacy.p2"
                as="p"
                multiline
                className="mt-4 text-fluid-base text-warm-600 leading-relaxed"
                fallback="Today, under the leadership of Pastor Isiah Smalls, Friendship Baptist continues to press forward — honoring the past while embracing a bold future. The same spirit that gathered beneath the trees in 1865 still burns in this congregation: a spirit of love, resilience, and unwavering devotion to the Lord."
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Scripture Divider */}
      <ScriptureDivider
        text="Remember the days of old; consider the generations long past. Ask your father and he will tell you, your elders, and they will explain to you."
        reference="Deuteronomy 32:7"
      />

      {/* Loved Ones Gone Home CTA */}
      <section className="section-padding bg-warm-50">
        <div className="container-narrow text-center">
          <FadeIn>
            <Heart className="mx-auto mb-4 h-8 w-8 text-purple-400" />
            <h2 className="font-heading text-fluid-2xl font-bold text-warm-900">
              Loved Ones Gone Home
            </h2>
            <p className="mt-3 mx-auto max-w-xl text-warm-500 leading-relaxed">
              Visit our Hall of Angels to honor and remember the cherished members
              of our church family who have gone home to be with the Lord.
            </p>
            <div className="mt-6">
              <CTAButton href="/loved-ones" variant="primary" size="lg" icon={<Heart className="h-5 w-5" />}>
                Hall of Angels
              </CTAButton>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-white">
        <div className="container-narrow">
          <FadeIn>
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:gap-6">
              <CTAButton href="/welcome" variant="primary" size="lg" icon={<Heart className="h-5 w-5" />}>
                Visit Us
              </CTAButton>
              <CTAButton href="/pastor" variant="secondary" size="lg">
                Meet Pastor Smalls
              </CTAButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
