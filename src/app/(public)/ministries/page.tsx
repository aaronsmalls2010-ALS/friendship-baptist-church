"use client";

import { useState } from "react";
import {
  Users,
  Music,
  Sparkles,
  Globe,
  Heart,
  BookOpen,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { FadeIn } from "@/components/motion/fade-in";
import { CTAButton } from "@/components/shared/cta-button";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/shared/page-hero";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { FormSuccess } from "@/components/shared/form-success";
import { EditableText } from "@/components/cms/editable-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_MINISTRIES } from "@/lib/mock-data";
import type { LucideIcon } from "lucide-react";

const MINISTRY_ICONS: Record<string, LucideIcon> = {
  "Usher Board": Users,
  Choir: Music,
  "Youth Ministry": Sparkles,
  "Missionary Society": Globe,
  "Deaconess Board": Heart,
  "Sunday School": BookOpen,
};

const MINISTRY_COLORS: Record<string, string> = {
  "Usher Board": "bg-purple-50 text-purple-600",
  Choir: "bg-peach-50 text-peach-600",
  "Youth Ministry": "bg-gold-50 text-gold-700",
  "Missionary Society": "bg-purple-50 text-purple-600",
  "Deaconess Board": "bg-peach-50 text-peach-600",
  "Sunday School": "bg-gold-50 text-gold-700",
};

export default function MinistriesPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ministry, setMinistry] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function handleReset() {
    setName("");
    setEmail("");
    setMinistry("");
    setMessage("");
    setSubmitted(false);
  }

  return (
    <>
      <PageHero
        title={<EditableText id="ministries.hero.title" fallback="Our Ministries" as="span" />}
        subtitle={<EditableText id="ministries.hero.subtitle" fallback="Find your place of service in the body of Christ" as="span" />}
        breadcrumbs={[{ label: "Ministries" }]}
      />

      {/* ── Ministry Grid ────────────────────────────────────────────── */}
      <section className="section-padding">
        <div className="container-wide">
          <FadeIn>
            <SectionHeading
              title={<EditableText id="ministries.grid.heading" fallback="Serving Together" as="span" />}
              subtitle={<EditableText id="ministries.grid.subtitle" fallback="Every ministry is an opportunity to use your God-given gifts" as="span" />}
            />
          </FadeIn>

          <SlideUpContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_MINISTRIES.map((min) => {
              const Icon = MINISTRY_ICONS[min.name] || Users;
              const colorClass =
                MINISTRY_COLORS[min.name] || "bg-purple-50 text-purple-600";

              return (
                <SlideUpItem key={min.id}>
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-card-hover transition-all duration-300 border border-warm-100 overflow-hidden flex flex-col h-full">
                    {/* Icon Header */}
                    <div
                      className={`px-6 pt-6 pb-4 ${colorClass.split(" ")[0]}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/70`}
                      >
                        <Icon className={`h-6 w-6 ${colorClass.split(" ")[1]}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-6 pt-2 flex flex-col flex-1">
                      <h3 className="font-heading text-lg font-semibold text-warm-900 mb-2">
                        {min.name}
                      </h3>
                      <p className="text-warm-600 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                        {min.description}
                      </p>

                      {/* Schedule */}
                      {min.schedule && (
                        <p className="flex items-center gap-1.5 text-xs text-warm-500 mb-4">
                          <Clock className="h-3.5 w-3.5 text-purple-400" />
                          {min.schedule}
                        </p>
                      )}

                      {/* Learn More */}
                      <Link
                        href={`/ministries/${min.id}`}
                        className="self-start -ml-2 text-purple-700 hover:text-purple-800 hover:bg-purple-50 gap-1.5 text-sm font-medium p-2 h-auto inline-flex items-center rounded-md"
                      >
                        Learn More
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </SlideUpItem>
              );
            })}
          </SlideUpContainer>
        </div>
      </section>

      {/* ── Scripture Divider ────────────────────────────────────────── */}
      <ScriptureDivider
        text={<EditableText id="ministries.scripture.text" fallback="For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do." as="span" multiline />}
        reference={<EditableText id="ministries.scripture.reference" fallback="Ephesians 2:10" as="span" />}
      />

      {/* ── Join a Ministry Form ─────────────────────────────────────── */}
      <section className="section-padding bg-warm-50">
        <div className="container-narrow">
          <FadeIn>
            <SectionHeading
              title={<EditableText id="ministries.join.heading" fallback="Get Involved" as="span" />}
              subtitle={<EditableText id="ministries.join.subtitle" fallback="Ready to serve? Let us know which ministry interests you" as="span" />}
            />
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-warm-100 p-6 lg:p-8">
              {submitted ? (
                <FormSuccess
                  title="Thank You!"
                  message="We received your interest and a ministry leader will be in touch with you soon. We are excited to serve alongside you!"
                  onReset={handleReset}
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ministry">Ministry of Interest</Label>
                    <Select value={ministry} onValueChange={setMinistry}>
                      <SelectTrigger id="ministry">
                        <SelectValue placeholder="Select a ministry" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_MINISTRIES.map((min) => (
                          <SelectItem key={min.id} value={min.name}>
                            {min.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Message{" "}
                      <span className="text-warm-400 font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your experience or how you'd like to serve..."
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-700 hover:bg-purple-600 text-white"
                    size="lg"
                  >
                    Submit Interest
                  </Button>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
