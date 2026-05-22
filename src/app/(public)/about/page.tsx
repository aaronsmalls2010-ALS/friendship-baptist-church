"use client";

import Image from "next/image";
import { Target, Heart, Eye } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { CTAButton } from "@/components/shared/cta-button";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/shared/page-hero";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const missionCards = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "To proclaim the Gospel of Jesus Christ through preaching, teaching, and service, nurturing believers in faith and reaching the lost with the transforming love of God. We exist to glorify God, equip the saints, and serve our community with compassion rooted in the Scriptures.",
  },
  {
    icon: Heart,
    title: "Our Values",
    description:
      "We are guided by love for God and neighbor, faithfulness to Biblical truth, unity in the body of Christ, and service to the least of these. We honor the traditions passed down by our ancestors while embracing the work God is doing in this present season.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    description:
      "To be a spirit-filled, community-centered church that raises up disciples, strengthens families, and transforms our Lowcountry community through the power of the Holy Spirit. We envision a church where every member is growing, serving, and walking in purpose.",
  },
];

const beliefs = [
  {
    id: "bible",
    title: "The Bible",
    content:
      "We believe the Bible is the inspired, infallible, and authoritative Word of God. It is the foundation of our faith and practice, given by the Holy Spirit to guide, correct, and equip believers for every good work. The Scriptures are sufficient for all matters of doctrine and daily living.",
  },
  {
    id: "god",
    title: "God",
    content:
      "We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit. God is the Creator of all things, sovereign over all creation, infinite in wisdom, holy in nature, and perfect in love. He is worthy of all worship, honor, and praise.",
  },
  {
    id: "jesus",
    title: "Jesus Christ",
    content:
      "We believe that Jesus Christ is the Son of God, born of a virgin, fully God and fully man. He lived a sinless life, died on the cross as the atoning sacrifice for our sins, rose bodily from the grave on the third day, and ascended to the right hand of the Father where He intercedes for us.",
  },
  {
    id: "salvation",
    title: "Salvation",
    content:
      "We believe that salvation is a gift of God received through faith in Jesus Christ alone. It is not earned by works but by the grace of God. All who repent of their sins and confess Jesus as Lord are forgiven, born again by the Holy Spirit, and made new creatures in Christ.",
  },
  {
    id: "church",
    title: "The Church",
    content:
      "We believe the Church is the body of Christ, composed of all who have placed their faith in Him. The local church is an assembly of baptized believers, organized for worship, fellowship, discipleship, and mission. We practice baptism by immersion and observe the Lord&apos;s Supper as ordinances given by Christ.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <PageHero
        title="About Our Church"
        subtitle="A family of faith, rooted in love and the Lowcountry, serving God and community for generations."
        breadcrumbs={[{ label: "About" }]}
      />

      {/* Our Story */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeIn direction="left">
              <div>
                <p className="font-scripture italic text-peach-500 text-fluid-lg mb-2">
                  Our Story
                </p>
                <h2 className="text-fluid-3xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-6">
                  A Church Born of Freedom and Faith
                </h2>
                <div className="space-y-4 text-warm-600 dark:text-warm-400 leading-relaxed">
                  <p>
                    The Friendship Baptist Church was born in the soil of
                    emancipation, when newly freed men and women of the
                    Lowcountry gathered beneath moss-draped oaks to worship a God
                    who had carried them through the unimaginable. From those
                    sacred gatherings rose a congregation rooted in faith, bound
                    by fellowship, and anchored in the rich Gullah Geechee
                    heritage of Beaufort, South Carolina.
                  </p>
                  <p>
                    Through generations of faithfulness, our church has stood as
                    a pillar in the community — a place where the weary find
                    rest, the lost find direction, and families find belonging.
                    From our humble beginnings to the sanctuary we worship in
                    today, every chapter of our story has been written by the
                    hand of God.
                  </p>
                  <p>
                    We carry the prayers of our ancestors in our hearts, and we
                    walk forward with the same faith that built this house of
                    worship — believing that the best is yet to come.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <div className="relative">
                <div className="aspect-[4/5] relative rounded-2xl overflow-hidden shadow-glow-lg">
                  <Image
                    src="/images/church/exterior.png"
                    alt="The Friendship Baptist Church exterior"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gold-400 rounded-2xl -z-10" />
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-purple-200 dark:bg-purple-800 rounded-xl -z-10" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-wide">
          <FadeIn>
            <SectionHeading
              title="Mission & Vision"
              subtitle="Guided by God's Word, driven by love, committed to community"
            />
          </FadeIn>

          <SlideUpContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {missionCards.map((card) => (
              <SlideUpItem key={card.title}>
                <div className="bg-white dark:bg-warm-900 rounded-2xl p-8 text-center shadow-sm hover:shadow-card-hover transition-all duration-300 border border-warm-100 dark:border-warm-800 h-full">
                  <div className="w-16 h-16 mx-auto mb-5 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                    <card.icon className="h-8 w-8 text-purple-700 dark:text-purple-400" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-warm-900 dark:text-warm-50 mb-3">
                    {card.title}
                  </h3>
                  <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </SlideUpItem>
            ))}
          </SlideUpContainer>
        </div>
      </section>

      {/* What We Believe */}
      <section className="section-padding">
        <div className="container-narrow">
          <FadeIn>
            <SectionHeading
              title="What We Believe"
              subtitle="The foundational truths that shape our faith and fellowship"
            />
          </FadeIn>

          <FadeIn delay={0.2}>
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="bible"
            >
              {beliefs.map((belief) => (
                <AccordionItem
                  key={belief.id}
                  value={belief.id}
                  className="border-warm-200 dark:border-warm-800"
                >
                  <AccordionTrigger className="text-left font-heading text-lg font-semibold text-warm-900 dark:text-warm-50 hover:text-purple-700 dark:hover:text-purple-400 hover:no-underline">
                    {belief.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-warm-600 dark:text-warm-400 leading-relaxed text-base">
                    {belief.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </section>

      {/* Our Community */}
      <section className="section-padding bg-warm-100 dark:bg-warm-900">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn>
              <p className="font-scripture italic text-peach-600 dark:text-peach-400 text-fluid-lg mb-3">
                Rooted in the Lowcountry
              </p>
              <h2 className="text-fluid-3xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-8">
                Our Gullah Geechee Heritage
              </h2>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="space-y-5 text-warm-700 dark:text-warm-300 text-fluid-base leading-relaxed">
                <p>
                  The Friendship Baptist Church is woven into the fabric of the
                  Gullah Geechee Lowcountry — a culture born of resilience,
                  shaped by the tides and the marshgrass, and sustained by an
                  unshakable faith in God. Our people have been keepers of the
                  land, the language, and the traditions that connect us to our
                  African roots and to one another.
                </p>
                <p>
                  Here in Beaufort, where the salt air carries the songs of our
                  grandmothers and the Spanish moss drapes the oaks like prayer
                  shawls, our church has stood as a gathering place — not just
                  for worship, but for celebration, for healing, for community.
                  We are a people who believe that when we sit together at the
                  table, when we sing together in the sanctuary, and when we
                  serve together in the neighborhood, we are doing the work that
                  God has called us to do.
                </p>
                <p>
                  This is more than a church. This is home. And everyone who
                  walks through our doors becomes family.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Scripture Divider */}
      <ScriptureDivider
        text="And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together."
        reference="Hebrews 10:24-25"
      />

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-wide">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-fluid-3xl font-heading font-bold text-warm-900 dark:text-warm-50 mb-4">
                Learn More About Us
              </h2>
              <p className="text-warm-600 dark:text-warm-400 mb-8">
                Discover the heart behind our church, meet our pastor, and
                explore the rich history that has shaped who we are today.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <CTAButton href="/pastor" variant="primary">
                  Meet Pastor Smalls
                </CTAButton>
                <CTAButton href="/history" variant="secondary">
                  Our History
                </CTAButton>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
