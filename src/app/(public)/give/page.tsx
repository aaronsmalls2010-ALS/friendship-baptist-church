import { Heart, Users, Globe } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/shared/page-hero";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { EditableText } from "@/components/cms/editable-text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { isStripeConfigured } from "@/lib/stripe/client";
import { GiveForm } from "./give-form";

const WHY_WE_GIVE = [
  {
    icon: Heart,
    title: "Honor God",
    description:
      "Giving is an act of worship and obedience. We give because God first gave to us, and our generosity reflects His love in our lives.",
  },
  {
    icon: Users,
    title: "Support Our Church Family",
    description:
      "Your gifts sustain our ministries, maintain our church home, and ensure that Friendship Baptist can continue to serve our members and community.",
  },
  {
    icon: Globe,
    title: "Reach Our Community",
    description:
      "Through your generosity, we fund outreach programs, support families in need, and spread the Gospel throughout Beaufort and beyond.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Is my donation tax-deductible?",
    answer:
      "Yes, Friendship Baptist Church is a registered 501(c)(3) nonprofit organization. All donations are tax-deductible to the full extent allowed by law. You will receive a receipt by email, and an annual giving statement is available in your member portal.",
  },
  {
    question: "How are donations used?",
    answer:
      "Donations support our church operations, pastoral staff, building maintenance, community outreach programs, youth ministry, missions, and benevolence fund. Our finance committee provides regular reports to ensure transparent stewardship of every dollar.",
  },
  {
    question: "Can I set up recurring giving?",
    answer:
      "Online giving currently supports one-time gifts. To arrange recurring weekly or monthly giving, please contact the church office and we will be glad to help you set it up.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "You can give securely online by credit or debit card, or in person during Sunday worship. For bank transfers, checks, or planned giving, please contact the church office.",
  },
];

export default function GivePage() {
  const stripeConfigured = isStripeConfigured();

  return (
    <>
      {/* Hero */}
      <PageHero
        title={<EditableText id="give.hero.title" fallback="Give" as="span" />}
        subtitle={<EditableText id="give.hero.subtitle" fallback="Every generous act of giving is from above" as="span" />}
        overlay="warm"
        breadcrumbs={[{ label: "Give" }]}
      />

      {/* Giving Form */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-narrow">
          <FadeIn>
            <SectionHeading
              title={<EditableText id="give.form.heading" fallback="Support Our Ministry" as="span" />}
              subtitle={<EditableText id="give.form.subtitle" fallback="Your generosity makes a difference in the lives of our church family and community" as="span" />}
            />
          </FadeIn>

          <GiveForm stripeConfigured={stripeConfigured} />
        </div>
      </section>

      {/* Scripture Divider */}
      <ScriptureDivider
        text={<EditableText id="give.scripture.text" fallback="Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." as="span" multiline />}
        reference={<EditableText id="give.scripture.reference" fallback="2 Corinthians 9:7" as="span" />}
        variant="gold"
      />

      {/* Why We Give */}
      <section className="section-padding">
        <div className="container-wide">
          <FadeIn>
            <SectionHeading
              title={<EditableText id="give.why.heading" fallback="Why We Give" as="span" />}
              subtitle={<EditableText id="give.why.subtitle" fallback="Giving is a cornerstone of our faith and an expression of gratitude" as="span" />}
            />
          </FadeIn>

          <SlideUpContainer className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {WHY_WE_GIVE.map((item, index) => {
              const Icon = item.icon;
              return (
                <SlideUpItem key={item.title}>
                  <div className="flex flex-col items-center rounded-2xl border border-warm-100 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-card-hover dark:border-warm-800 dark:bg-warm-900">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-100 dark:bg-gold-900/30">
                      <Icon className="h-8 w-8 text-gold-600 dark:text-gold-400" />
                    </div>
                    <h3 className="mt-5 font-heading text-xl font-bold text-warm-900 dark:text-warm-50">
                      <EditableText id={`give.why.title${index + 1}`} fallback={item.title} as="span" />
                    </h3>
                    <EditableText id={`give.why.p${index + 1}`} fallback={item.description} as="p" className="mt-3 leading-relaxed text-warm-600 dark:text-warm-400" multiline />
                  </div>
                </SlideUpItem>
              );
            })}
          </SlideUpContainer>
        </div>
      </section>

      {/* Giving FAQ */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-narrow">
          <FadeIn>
            <SectionHeading
              title={<EditableText id="give.faq.heading" fallback="Giving FAQ" as="span" />}
              subtitle={<EditableText id="give.faq.subtitle" fallback="Common questions about giving at Friendship Baptist" as="span" />}
            />
          </FadeIn>

          <FadeIn delay={0.2}>
            <Accordion
              type="single"
              collapsible
              className="mx-auto max-w-2xl rounded-2xl border border-warm-100 bg-white px-6 dark:border-warm-800 dark:bg-warm-900"
            >
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left font-heading text-warm-900 dark:text-warm-50">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-warm-600 dark:text-warm-400">
                    <EditableText id={`give.faq.q${index + 1}`} fallback={item.answer} as="p" multiline />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
