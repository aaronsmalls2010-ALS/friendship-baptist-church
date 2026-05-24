"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Video, Heart, Users, BookOpen } from "lucide-react";
import { CTAButton } from "@/components/shared/cta-button";
import { SectionHeading } from "@/components/shared/section-heading";
import { ScriptureRotator } from "@/components/brand/scripture-rotator";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { CHURCH_INFO } from "@/lib/constants";
import { EditableText } from "@/components/cms/editable-text";
import { EditableImage } from "@/components/cms/editable-image";
import { useSiteSettings } from "@/contexts/site-settings-context";

export default function HomePage() {
  const { watchLiveEnabled } = useSiteSettings();

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <EditableImage
            id="home.hero.bg"
            fallback="/images/church/cross.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute inset-0 bg-purple-950/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 container-wide text-center text-white pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="font-scripture italic text-gold-300 text-fluid-lg mb-4">
              <EditableText id="home.hero.welcome" fallback="Welcome to" as="span" />
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-fluid-hero font-heading font-bold leading-tight mb-4"
          >
            <EditableText id="home.hero.title1" fallback="The Friendship" as="span" />
            <br />
            <span className="text-gradient-warm bg-clip-text text-transparent bg-gradient-to-r from-peach-300 to-gold-300">
              <EditableText id="home.hero.title2" fallback="Baptist Church" as="span" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="font-scripture italic text-gold-300 text-fluid-xl mb-2"
          >
            <EditableText id="home.hero.tagline" fallback="The Church That Christ Built" as="span" />
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-white/70 text-fluid-base mb-10 max-w-2xl mx-auto"
          >
            Led by {CHURCH_INFO.pastor}, serving the Beaufort, SC community with
            love, faith, and fellowship in the Lowcountry Gullah Geechee
            tradition.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            {watchLiveEnabled && (
              <CTAButton href="/media?tab=live" variant="gold" size="lg" icon={<Video className="h-5 w-5" />}>
                Watch Live
              </CTAButton>
            )}
            <CTAButton href="/give" variant="outline" size="lg" icon={<Heart className="h-5 w-5" />}>
              Give
            </CTAButton>
            <CTAButton href="/welcome" variant="outline" size="lg" icon={<Users className="h-5 w-5" />}>
              I&apos;m New Here
            </CTAButton>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-white/60 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Service Times */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-wide">
          <FadeIn>
            <SectionHeading
              title="Join Us for Worship"
              subtitle="All are welcome at Friendship Baptist Church"
            />
          </FadeIn>

          <SlideUpContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {CHURCH_INFO.serviceTimes.map((service) => (
              <SlideUpItem key={service.name}>
                <div className="bg-white dark:bg-warm-900 rounded-xl p-6 text-center shadow-sm hover:shadow-card-hover transition-shadow border border-warm-100 dark:border-warm-800">
                  <div className="w-12 h-12 mx-auto mb-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-warm-900 dark:text-warm-50">
                    {service.name}
                  </h3>
                  <p className="text-purple-700 dark:text-purple-400 font-medium mt-1">
                    {service.day}
                  </p>
                  <p className="text-fluid-xl font-bold text-warm-900 dark:text-warm-50 mt-1">
                    {service.time}
                  </p>
                </div>
              </SlideUpItem>
            ))}
          </SlideUpContainer>
        </div>
      </section>

      {/* Scripture */}
      <section className="py-16 bg-purple-700 dark:bg-purple-900">
        <div className="container-narrow">
          <ScriptureRotator className="text-white [&_.scripture-text]:text-white/90 [&_p:last-child]:text-gold-300" />
        </div>
      </section>

      {/* Pastor Welcome */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeIn direction="left">
              <div className="relative">
                <div className="aspect-[3/4] relative rounded-2xl overflow-hidden shadow-glow-lg">
                  <EditableImage
                    id="home.pastor.photo"
                    fallback="/images/pastor/pastor-robe.png"
                    alt="Pastor Isiah Smalls"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gold-400 rounded-2xl -z-10" />
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <div>
                <p className="font-scripture italic text-peach-500 text-fluid-lg mb-2">
                  A Word from Our Pastor
                </p>
                <h2 className="text-fluid-3xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-6">
                  {CHURCH_INFO.pastor}
                </h2>
                <div className="space-y-4 text-warm-600 dark:text-warm-400">
                  <EditableText
                    id="home.pastor.p1"
                    as="p"
                    multiline
                    fallback="Welcome to The Friendship Baptist Church, where we believe that true fellowship begins with love, grows through faith, and endures by the grace of God."
                  />
                  <EditableText
                    id="home.pastor.p2"
                    as="p"
                    multiline
                    fallback="Rooted in the rich Lowcountry Gullah Geechee tradition, our church family has been a beacon of hope and worship for generations. Whether you're a lifelong member or visiting for the first time, you have a home here."
                  />
                  <EditableText
                    id="home.pastor.p3"
                    as="p"
                    multiline
                    fallback="Come as you are, and leave transformed by the power of God's love."
                  />
                </div>
                <div className="mt-8">
                  <CTAButton href="/pastor" variant="primary">
                    Meet Pastor Smalls
                  </CTAButton>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-wide">
          <FadeIn>
            <SectionHeading
              title="Get Connected"
              subtitle="There are many ways to be part of our church family"
            />
          </FadeIn>

          <SlideUpContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Ministries",
                descId: "home.connect.ministries.desc",
                desc: "Find your place of service and grow in your calling",
                href: "/ministries",
                icon: Users,
              },
              {
                title: "Events",
                descId: "home.connect.events.desc",
                desc: "Join us for fellowship, worship, and community gatherings",
                href: "/events",
                icon: BookOpen,
              },
              {
                title: "Prayer",
                descId: "home.connect.prayer.desc",
                desc: "Share your prayer requests and let us lift you up",
                href: "/prayer",
                icon: Heart,
              },
              {
                title: "Media",
                descId: "home.connect.media.desc",
                desc: "Watch sermons, listen to worship music, and be blessed",
                href: "/media",
                icon: Video,
              },
            ].map((item) => (
              <SlideUpItem key={item.title}>
                <a
                  href={item.href}
                  className="group block bg-white dark:bg-warm-900 rounded-xl p-6 shadow-sm hover:shadow-card-hover transition-all duration-300 border border-warm-100 dark:border-warm-800 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 mb-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <item.icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-warm-900 dark:text-warm-50 mb-2">
                    {item.title}
                  </h3>
                  <EditableText
                    id={item.descId}
                    fallback={item.desc}
                    as="p"
                    className="text-sm text-warm-600 dark:text-warm-400"
                  />
                </a>
              </SlideUpItem>
            ))}
          </SlideUpContainer>
        </div>
      </section>
    </>
  );
}
