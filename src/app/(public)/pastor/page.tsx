"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Users, Heart, Send, Calendar } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { CTAButton } from "@/components/shared/cta-button";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/shared/page-hero";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { FormSuccess } from "@/components/shared/form-success";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditableText } from "@/components/cms/editable-text";
import { EditableImage } from "@/components/cms/editable-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_SERMONS } from "@/lib/mock-data";

const milestones = [
  {
    year: "1967",
    title: "Baptized into the Body of Christ",
    descId: "pastor.timeline.1967",
    description:
      "On August 27, 1967, at the age of 11, Isiah Smalls was baptized and became a member of the Friendship Baptist Church. Even at that early age, he was in the service of the Lord — sweeping, cutting grass, carrying building materials, and caring for the church's 'Praise House' on Sam's Point, following in the footsteps of his father, Dea. Louis Smalls, Chairman of the Trustee Board.",
  },
  {
    year: "1978",
    title: "Education & Career",
    descId: "pastor.timeline.1978",
    description:
      "A 1974 graduate of Beaufort High School, Pastor Smalls graduated cum laude from South Carolina State University in 1978 with a bachelor's degree in business administration and economics. He went on to serve 30 years with the City of Beaufort, including 21 years as Director of Public Works, retiring June 30, 2015.",
  },
  {
    year: "1994",
    title: "Called to Serve as Deacon",
    descId: "pastor.timeline.1994",
    description:
      "Pastor Smalls served as a deacon at Friendship Baptist for 16 years (1994–2010), including six years as Assistant Chairman (2004–2010). During this time, he served as Project and Finance Manager for the most extensive renovation in the church's history — a $375,000 remodeling of the sanctuary and addition of 1,700 square feet of classroom and office space.",
  },
  {
    year: "2010",
    title: "Licensed & Ordained",
    descId: "pastor.timeline.2010",
    description:
      "In September 1991, the Lord revealed a ministry to then-Brother Smalls. For 19 years, God shaped his spiritual growth through trials, tribulations, and revelations — teaching him servitude through patience, steadfastness, boldness, and humbleness. In 2010, he received the confirmation of a higher calling and was licensed on May 30, 2010 and ordained on September 26, 2010.",
  },
  {
    year: "2011",
    title: "Installed as Pastor",
    descId: "pastor.timeline.2011",
    description:
      "On October 10, 2011, the Friendship Baptist Church selected Minister Smalls as their Pastor, with formal installation services held November 20, 2011. Pastor Smalls loves God, God's people, and God's sanctuary. He has served on various ministries throughout his entire life at Friendship: Trustee Ministry (10 years), Sunday School teacher (25 years), and Youth/Adult/Senior Choirs (44+ years combined).",
  },
  {
    year: "Present",
    title: "Pressing Forward",
    descId: "pastor.timeline.present",
    description:
      "Under Pastor Smalls' leadership, the church mortgage was paid off in 2014, the fellowship hall was expanded by nearly 1,000 sq ft ($270,000, debt-free), and five acres of adjacent land were gifted to the church, doubling its property to 10 acres. Through the Covid-19 pandemic, his innovative Parking Lot Services kept the congregation worshiping safely for over 15 months. He continues to unapologetically teach the Word of God, reach out to the lost, and win souls for the Kingdom.",
  },
];

const visionCards = [
  {
    icon: BookOpen,
    title: "Teacher of the Word",
    descId: "pastor.vision.teaching",
    description:
      "Pastor Smalls is a teacher of the Word. He encourages members to be part of Sunday School and Bible Study ministries, where the Word is taught in depth and detail. He has kindled new vigor, vitality, commitment, and spirituality in Word-based worship services at Friendship.",
  },
  {
    icon: Users,
    title: "Vision & Stewardship",
    descId: "pastor.vision.community",
    description:
      "Pastor Smalls reminds Friendship of Proverbs 29:18 — 'Where there is no vision, the people perish.' He constantly directs focus toward the physical and structural needs of the church while caring for God's people spiritually, physically, financially, economically, and socially. He computerized church finances and implemented a culture of transparency.",
  },
  {
    icon: Heart,
    title: "Love & Non-Judgment",
    descId: "pastor.vision.formation",
    description:
      "Pastor Smalls has fostered a culture of non-judgment, friendliness, kindness, forgiveness, and love at Friendship. He eliminated traditions that hindered people from coming to Christ, believing faithfully in the saying: 'Do good, and good will come back to you.' His life philosophy is rooted in Luke 12:48 — 'For unto whomsoever much is given, of him shall be much required.'",
  },
];

const featuredSermons = MOCK_SERMONS.slice(0, 3);

export default function PastorPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    type: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      {/* Hero */}
      <PageHero
        title="Pastor Isiah Smalls"
        subtitle="Shepherd, Teacher, Servant"
        backgroundImage="/images/pastor/pastor-robe.png"
        backgroundPosition="top"
        breadcrumbs={[
          { label: "About", href: "/about" },
          { label: "Pastor Smalls" },
        ]}
      />

      {/* Welcome Message */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeIn direction="left">
              <div>
                <p className="font-scripture italic text-peach-500 text-fluid-lg mb-4">
                  A Word from Our Pastor
                </p>
                <EditableText
                  id="pastor.welcome.quote"
                  as="blockquote"
                  multiline
                  className="font-scripture italic text-fluid-xl text-gold-700 dark:text-gold-400 leading-relaxed mb-6"
                  fallback={`”Like the Prophet Isaiah, when the Lord asked, 'Whom shall I send? And who will go for us?' I answered, 'Here am I. Send me!' God wants us to get back to Eden and start living on top of the world. Do good, and good will come back to you.”`}
                />
                <EditableText
                  id="pastor.welcome.desc"
                  as="p"
                  multiline
                  className="text-warm-600 dark:text-warm-400 mb-4"
                  fallback="Pastor Smalls is the 5th and youngest child of the late Dea. Louis Smalls and the late Susie Porter Smalls. Baptized into the body of Christ at Friendship 58 years ago, he has dedicated his entire life to the service of the Lord, his family, the church, and the community. A cum laude graduate of South Carolina State University and retired Director of Public Works for the City of Beaufort, Pastor Smalls has served Friendship in every capacity — from cutting grass as a boy to leading the congregation as its shepherd."
                />
                <p className="font-heading text-fluid-lg font-bold italic text-purple-700 dark:text-purple-400">
                  &ldquo;To God be the Glory!&rdquo;
                </p>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <div className="relative flex justify-center">
                <div className="aspect-[3/4] w-full max-w-md relative rounded-2xl overflow-hidden shadow-glow-lg">
                  <EditableImage
                    id="pastor.welcome.photo"
                    fallback="/images/pastor/pastor-headshot.jpg"
                    alt="Pastor Isiah Smalls"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gold-400 rounded-2xl -z-10" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* First Lady Marie Smalls */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeIn direction="left" delay={0.1}>
              <div className="relative flex justify-center order-2 lg:order-1">
                <div className="aspect-[3/4] w-full max-w-md relative rounded-2xl overflow-hidden shadow-glow-lg">
                  <EditableImage
                    id="firstlady.photo"
                    fallback="/images/pastor/first-lady.jpg"
                    alt="First Lady Marie Smalls"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-peach-300 rounded-2xl -z-10" />
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <div className="order-1 lg:order-2">
                <p className="font-scripture italic text-peach-500 text-fluid-lg mb-2">
                  Our First Lady
                </p>
                <h2 className="font-heading text-fluid-3xl font-bold text-warm-900 dark:text-warm-50 mb-4">
                  Marie Smalls
                </h2>
                <EditableText
                  id="firstlady.intro"
                  as="p"
                  multiline
                  className="text-warm-600 dark:text-warm-400 leading-relaxed mb-4"
                  fallback="On June 7, 1980, Pastor Smalls married his best friend, childhood sweetheart, and love of his life, First Lady Marie Simmons Smalls. Together, they carry the vision God has placed on Friendship Baptist Church, each one strengthening what the other builds."
                />
                <EditableText
                  id="firstlady.heart"
                  as="p"
                  multiline
                  className="text-warm-600 dark:text-warm-400 leading-relaxed mb-4"
                  fallback="They are the proud parents of four children: Natarcia (Thomas) Bloomfield, Isiah 'Ike' Smalls II, Patrice (Devin) Dash, and Aaron Louis (Janay) Smalls. They are also blessed with 13 grandchildren. Known for her warmth, grace, and genuine love for every person who walks through the doors of the church, First Lady Smalls has a gift for making people feel seen and valued."
                />
                <EditableText
                  id="firstlady.legacy"
                  as="p"
                  multiline
                  className="text-warm-600 dark:text-warm-400 leading-relaxed mb-6"
                  fallback="She and Pastor Smalls share a deep conviction that the church is a family — and they lead it as one. Their partnership is a living example of what it means to serve the Lord together, building each other up and pouring into the congregation with a unified heart. Where he preaches the Word, she nurtures the people. Where he casts the vision, she helps carry it forward. They are, in every sense, a team."
                />
                <EditableText
                  id="firstlady.scripture"
                  as="p"
                  multiline
                  className="font-scripture italic text-fluid-base text-purple-700 dark:text-purple-400"
                  fallback={`"Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up." — Ecclesiastes 4:9–10`}
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Scripture Divider */}
      <ScriptureDivider
        text="I will give you shepherds after my own heart, who will lead you with knowledge and understanding."
        reference="Jeremiah 3:15"
      />

      {/* Biography Timeline */}
      <section className="section-padding">
        <div className="container-narrow">
          <FadeIn>
            <SectionHeading
              title="His Journey"
              subtitle="The path God has laid before Pastor Smalls"
            />
          </FadeIn>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-purple-200 dark:bg-purple-800 md:left-1/2 md:-translate-x-px" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <FadeIn
                  key={milestone.year}
                  direction={index % 2 === 0 ? "left" : "right"}
                  delay={index * 0.1}
                >
                  <div
                    className={`relative flex items-start gap-6 md:gap-12 ${
                      index % 2 === 0
                        ? "md:flex-row"
                        : "md:flex-row-reverse md:text-right"
                    }`}
                  >
                    {/* Content */}
                    <div className="flex-1 pl-16 md:pl-0">
                      <h3 className="font-heading text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">
                        {milestone.title}
                      </h3>
                      <EditableText
                        id={milestone.descId}
                        fallback={milestone.description}
                        as="p"
                        multiline
                        className="text-warm-600 dark:text-warm-400 leading-relaxed"
                      />
                    </div>

                    {/* Year dot — center on desktop, left on mobile */}
                    <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-purple-700 dark:bg-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        {milestone.year.slice(-4)}
                      </div>
                    </div>

                    {/* Spacer for other side on desktop */}
                    <div className="hidden md:block flex-1" />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Philosophy */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-wide">
          <FadeIn>
            <SectionHeading
              title="Vision & Philosophy"
              subtitle="The pillars that guide Pastor Smalls' ministry at Friendship Baptist"
            />
          </FadeIn>

          <SlideUpContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {visionCards.map((card) => (
              <SlideUpItem key={card.title}>
                <div className="bg-white dark:bg-warm-900 rounded-2xl p-8 text-center shadow-sm hover:shadow-card-hover transition-all duration-300 border border-warm-100 dark:border-warm-800 h-full">
                  <div className="w-16 h-16 mx-auto mb-5 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                    <card.icon className="h-8 w-8 text-purple-700 dark:text-purple-400" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-warm-900 dark:text-warm-50 mb-3">
                    {card.title}
                  </h3>
                  <EditableText
                    id={card.descId}
                    fallback={card.description}
                    as="p"
                    multiline
                    className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed"
                  />
                </div>
              </SlideUpItem>
            ))}
          </SlideUpContainer>
        </div>
      </section>

      {/* Contact the Pastor */}
      <section className="section-padding">
        <div className="container-narrow">
          <FadeIn>
            <SectionHeading
              title="Contact Pastor Smalls"
              subtitle="We would love to hear from you. Reach out for prayer, counseling, or any need."
            />
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="max-w-2xl mx-auto">
              {submitted ? (
                <FormSuccess
                  title="Message Sent"
                  message="Thank you for reaching out to Pastor Smalls. Your message has been received and he will respond as soon as possible. You are in our prayers."
                  actionLabel="Back to Home"
                  actionHref="/"
                  onReset={() => {
                    setSubmitted(false);
                    setFormState({
                      name: "",
                      email: "",
                      type: "",
                      message: "",
                    });
                  }}
                />
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-white dark:bg-warm-900 rounded-2xl p-8 shadow-sm border border-warm-100 dark:border-warm-800"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        placeholder="Full name"
                        value={formState.name}
                        onChange={(e) =>
                          setFormState({ ...formState, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@email.com"
                        value={formState.email}
                        onChange={(e) =>
                          setFormState({ ...formState, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Inquiry Type</Label>
                    <Select
                      value={formState.type}
                      onValueChange={(value) =>
                        setFormState({ ...formState, type: value })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select a reason for contacting" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prayer">Prayer Request</SelectItem>
                        <SelectItem value="counseling">Counseling</SelectItem>
                        <SelectItem value="speaking">
                          Speaking Request
                        </SelectItem>
                        <SelectItem value="general">
                          General Inquiry
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Share what's on your heart..."
                      rows={5}
                      value={formState.message}
                      onChange={(e) =>
                        setFormState({ ...formState, message: e.target.value })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-700 hover:bg-purple-600 text-white rounded-xl py-3 h-auto text-base"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Featured Sermons */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-wide">
          <FadeIn>
            <SectionHeading
              title="Featured Sermons"
              subtitle="Recent messages from Pastor Smalls"
            />
          </FadeIn>

          <SlideUpContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {featuredSermons.map((sermon) => (
              <SlideUpItem key={sermon.id}>
                <Link
                  href={`/media?tab=sermons`}
                  className="group block bg-white dark:bg-warm-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-card-hover transition-all duration-300 border border-warm-100 dark:border-warm-800 hover:-translate-y-1 h-full"
                >
                  {/* Top accent bar */}
                  <div className="h-1.5 bg-gradient-purple" />

                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-warm-500 dark:text-warm-400 mb-3">
                      <Calendar className="h-4 w-4" />
                      <time>
                        {new Date(sermon.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-warm-900 dark:text-warm-50 mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                      {sermon.title}
                    </h3>

                    <p className="font-scripture italic text-purple-600 dark:text-purple-400 text-sm mb-4">
                      {sermon.scripture}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {sermon.topics.map((topic) => (
                        <Badge
                          key={topic}
                          variant="secondary"
                          className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Link>
              </SlideUpItem>
            ))}
          </SlideUpContainer>

          <FadeIn delay={0.3}>
            <div className="text-center mt-10">
              <CTAButton href="/media?tab=sermons" variant="primary">
                View All Sermons
              </CTAButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
