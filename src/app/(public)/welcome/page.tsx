"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DoorOpen,
  Music,
  Users,
  ArrowRight,
  MapPin,
  Clock,
  Check,
} from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { CTAButton } from "@/components/shared/cta-button";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/shared/page-hero";
import { FormSuccess } from "@/components/shared/form-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EditableText } from "@/components/cms/editable-text";
import { EditableImage } from "@/components/cms/editable-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHURCH_INFO } from "@/lib/constants";

const steps = [
  {
    step: 1,
    icon: DoorOpen,
    title: "Arrive & Be Welcomed",
    descId: "welcome.expect.step1",
    description:
      "Our ushers and greeters will welcome you with a warm smile the moment you walk through the door. We want you to feel at home from your very first step inside.",
  },
  {
    step: 2,
    icon: Music,
    title: "Worship Together",
    descId: "welcome.expect.step2",
    description:
      "Experience spirit-filled worship and Biblical preaching that speaks to the heart. Our services are rooted in the rich tradition of African American sacred worship.",
  },
  {
    step: 3,
    icon: Users,
    title: "Fellowship",
    descId: "welcome.expect.step3",
    description:
      "After service, stay and connect with our church family. Enjoy conversation, refreshments, and the genuine warmth that makes Friendship Baptist special.",
  },
  {
    step: 4,
    icon: ArrowRight,
    title: "Next Steps",
    descId: "welcome.expect.step4",
    description:
      "Discover ways to get connected and grow in your faith — from Sunday School and Bible Study to ministries and volunteer opportunities.",
  },
];

const whatToKnow = [
  "Casual dress is welcome — come as you are",
  "Children's ministry is available during worship",
  "Ample parking on site and along the street",
  "Our facility is wheelchair accessible",
];

const hearAboutOptions = [
  "Friend/Family",
  "Online Search",
  "Social Media",
  "Drive By",
  "Other",
];

const interestOptions = [
  "Sunday Worship",
  "Bible Study",
  "Youth Programs",
  "Choir",
  "Volunteering",
  "Prayer Ministry",
];

export default function WelcomePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hearAbout, setHearAbout] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    setSubmitted(true);
  }

  function handleReset() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setHearAbout("");
    setInterests([]);
    setSubmitted(false);
  }

  const fullAddress = `${CHURCH_INFO.address.street}, ${CHURCH_INFO.address.city}, ${CHURCH_INFO.address.state} ${CHURCH_INFO.address.zip}`;

  return (
    <>
      {/* Hero */}
      <PageHero
        title="Welcome to Friendship Baptist"
        subtitle="You have a home here"
        overlay="warm"
        breadcrumbs={[{ label: "Welcome" }]}
      />

      {/* What to Expect */}
      <section className="section-padding">
        <div className="container-wide">
          <FadeIn>
            <SectionHeading
              title="Your First Visit"
              subtitle="Here's what you can expect when you walk through our doors"
            />
          </FadeIn>

          <SlideUpContainer className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {steps.map((s) => (
              <SlideUpItem key={s.step}>
                <div className="flex h-full gap-4 rounded-2xl border border-warm-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-card-hover dark:border-warm-800 dark:bg-warm-900">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white">
                    <span className="font-heading text-lg font-bold">
                      {s.step}
                    </span>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <s.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-heading text-lg font-bold text-warm-900 dark:text-warm-50">
                        {s.title}
                      </h3>
                    </div>
                    <EditableText
                      id={s.descId}
                      fallback={s.description}
                      as="p"
                      className="text-sm leading-relaxed text-warm-600 dark:text-warm-400"
                    />
                  </div>
                </div>
              </SlideUpItem>
            ))}
          </SlideUpContainer>
        </div>
      </section>

      {/* Plan Your Visit */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-wide">
          <FadeIn>
            <SectionHeading
              title="Plan Your Visit"
              subtitle="Everything you need to know before you come"
            />
          </FadeIn>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Left: Service times + location */}
            <FadeIn direction="left">
              <div className="space-y-8">
                {/* Service Times */}
                <div>
                  <h3 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-warm-900 dark:text-warm-50">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Service Times
                  </h3>
                  <div className="space-y-3">
                    {CHURCH_INFO.serviceTimes.map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center justify-between rounded-xl border border-warm-100 bg-white px-5 py-4 dark:border-warm-800 dark:bg-warm-900"
                      >
                        <div>
                          <p className="font-semibold text-warm-900 dark:text-warm-50">
                            {service.name}
                          </p>
                          <p className="text-sm text-warm-500">{service.day}</p>
                        </div>
                        <span className="font-heading text-lg font-bold text-purple-700 dark:text-purple-400">
                          {service.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-warm-900 dark:text-warm-50">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    Location
                  </h3>
                  <div className="rounded-xl border border-warm-100 bg-white px-5 py-4 dark:border-warm-800 dark:bg-warm-900">
                    <p className="font-semibold text-warm-900 dark:text-warm-50">
                      {CHURCH_INFO.name}
                    </p>
                    <p className="mt-1 text-warm-600 dark:text-warm-400">
                      {fullAddress}
                    </p>
                    <EditableText
                      id="welcome.visit.p1"
                      as="p"
                      className="mt-2 text-sm text-warm-500"
                      fallback="Located on Friendship Lane in Beaufort. Look for our steeple — you can't miss it!"
                    />
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Right: What to Know */}
            <FadeIn direction="right" delay={0.2}>
              <div>
                <h3 className="mb-4 font-heading text-xl font-bold text-warm-900 dark:text-warm-50">
                  What to Know
                </h3>
                <div className="space-y-4">
                  {whatToKnow.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-xl border border-warm-100 bg-white px-5 py-4 dark:border-warm-800 dark:bg-warm-900"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                        <Check className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                      </div>
                      <p className="text-warm-700 dark:text-warm-300">{item}</p>
                    </div>
                  ))}
                </div>

                {/* Quick info */}
                <div className="mt-8 rounded-xl bg-purple-50 p-5 dark:bg-purple-950/30">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Have questions before your visit?
                  </p>
                  <p className="mt-1 text-sm text-purple-600 dark:text-purple-400">
                    Call us at{" "}
                    <span className="font-semibold">{CHURCH_INFO.phone}</span>{" "}
                    or email{" "}
                    <span className="font-semibold">{CHURCH_INFO.email}</span>
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Connect Card */}
      <section className="section-padding">
        <div className="container-narrow">
          <FadeIn>
            <SectionHeading
              title="Let Us Know You're Coming"
              subtitle="Fill out a connect card so our welcome team can greet you personally"
            />
          </FadeIn>

          <FadeIn delay={0.2}>
            {submitted ? (
              <FormSuccess
                message="We can't wait to meet you! Someone from our welcome team will be in touch."
                onReset={handleReset}
              />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-2xl rounded-2xl border border-warm-100 bg-white p-6 shadow-sm dark:border-warm-800 dark:bg-warm-900 sm:p-8"
              >
                <div className="space-y-5">
                  {/* Name row */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="welcome-first">First Name</Label>
                      <Input
                        id="welcome-first"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="welcome-last">Last Name</Label>
                      <Input
                        id="welcome-last"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="welcome-email">Email</Label>
                    <Input
                      id="welcome-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="welcome-phone">Phone (optional)</Label>
                    <Input
                      id="welcome-phone"
                      type="tel"
                      placeholder="(843) 555-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* How did you hear */}
                  <div className="space-y-2">
                    <Label>How did you hear about us?</Label>
                    <Select value={hearAbout} onValueChange={setHearAbout}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {hearAboutOptions.map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt.toLowerCase().replace(/\//g, "-")}
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Interests */}
                  <div className="space-y-3">
                    <Label>I&apos;m interested in...</Label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {interestOptions.map((interest) => (
                        <div
                          key={interest}
                          className="flex items-center gap-2.5"
                        >
                          <Checkbox
                            id={`interest-${interest}`}
                            checked={interests.includes(interest)}
                            onCheckedChange={() => toggleInterest(interest)}
                          />
                          <Label
                            htmlFor={`interest-${interest}`}
                            className="cursor-pointer font-normal"
                          >
                            {interest}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <Button type="submit" className="w-full" size="lg">
                    Send Connect Card
                  </Button>
                </div>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      {/* Pastor's Welcome */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-wide">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <FadeIn direction="left">
              <div className="relative mx-auto max-w-sm">
                <div className="aspect-[3/4] relative overflow-hidden rounded-2xl shadow-lg">
                  <EditableImage
                    id="welcome.pastor.photo"
                    fallback="/images/pastor/pastor-suit.png"
                    alt="Pastor Isiah Smalls"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                </div>
                <div className="absolute -bottom-3 -right-3 h-20 w-20 rounded-2xl bg-gold-400 -z-10" />
                <div className="absolute -top-3 -left-3 h-14 w-14 rounded-xl bg-purple-200 dark:bg-purple-800 -z-10" />
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <div>
                <p className="font-scripture italic text-peach-500 text-fluid-lg mb-2">
                  A Word from Our Pastor
                </p>
                <h2 className="text-fluid-3xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-6">
                  You Are Welcome Here
                </h2>
                <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                  <EditableText
                    id="welcome.pastor.p1"
                    as="p"
                    multiline
                    fallback="On behalf of the entire Friendship Baptist Church family, I want you to know that you are welcome here — just as you are. Whether you have been walking with the Lord for decades or are taking your very first steps of faith, there is a place for you at our table."
                  />
                  <EditableText
                    id="welcome.pastor.p2"
                    as="p"
                    multiline
                    fallback="Our doors are open, our hearts are ready, and our arms are wide. Come experience the warmth of a congregation that truly loves like family. We believe that God has led you to this moment, and we cannot wait to meet you."
                  />
                  <p className="font-semibold text-warm-800 dark:text-warm-200">
                    &mdash; {CHURCH_INFO.pastor}
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-wide">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-fluid-3xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-4">
                Ready to Connect?
              </h2>
              <p className="mb-8 text-warm-600 dark:text-warm-400">
                We would love to hear from you. Reach out with any questions, or
                check out what&apos;s happening at the church.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <CTAButton href="/contact" variant="primary">
                  Contact Us
                </CTAButton>
                <CTAButton href="/events" variant="secondary">
                  View Events
                </CTAButton>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
