"use client";

import { useState } from "react";
import { Heart, Users, Globe } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/shared/page-hero";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { FormSuccess } from "@/components/shared/form-success";
import { EditableText } from "@/components/cms/editable-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const AMOUNT_PRESETS = [25, 50, 100, 250];

const GIVING_TYPES = [
  { value: "tithe", label: "Tithe" },
  { value: "offering", label: "Offering" },
  { value: "building-fund", label: "Building Fund" },
  { value: "mission", label: "Mission" },
  { value: "other", label: "Other" },
];

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
      "Yes, Friendship Baptist Church is a registered 501(c)(3) nonprofit organization. All donations are tax-deductible to the full extent allowed by law. You will receive an annual giving statement for your tax records.",
  },
  {
    question: "How are donations used?",
    answer:
      "Donations support our church operations, pastoral staff, building maintenance, community outreach programs, youth ministry, missions, and benevolence fund. Our finance committee provides regular reports to ensure transparent stewardship of every dollar.",
  },
  {
    question: "Can I set up recurring giving?",
    answer:
      "Yes! You can set up weekly or monthly recurring gifts through our giving form. Recurring giving helps the church plan and budget effectively while making generosity a consistent part of your worship.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept major credit and debit cards, bank transfers, and checks. You may also give in person during Sunday worship services. For large gifts or planned giving, please contact the church office.",
  },
];

export default function GivePage() {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [givingType, setGivingType] = useState("tithe");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const currentAmount = customAmount || (selectedPreset ? String(selectedPreset) : "");

  function handlePresetClick(amount: number) {
    setSelectedPreset(amount);
    setCustomAmount("");
  }

  function handleCustomAmountChange(value: string) {
    setCustomAmount(value);
    if (value) {
      setSelectedPreset(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentAmount || !name.trim()) return;
    setSubmitted(true);
  }

  function handleReset() {
    setSelectedPreset(null);
    setCustomAmount("");
    setGivingType("tithe");
    setIsRecurring(false);
    setFrequency("");
    setName("");
    setEmail("");
    setSubmitted(false);
  }

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

          <FadeIn delay={0.2}>
            {submitted ? (
              <FormSuccess
                message={`Thank you for your generous gift of $${currentAmount}. Your giving helps sustain the work of God's kingdom.`}
                onReset={handleReset}
              />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-2xl rounded-2xl border border-warm-100 bg-white p-6 shadow-sm dark:border-warm-800 dark:bg-warm-900 sm:p-8"
              >
                <div className="space-y-6">
                  {/* Amount Presets */}
                  <div className="space-y-3">
                    <Label>Gift Amount</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {AMOUNT_PRESETS.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => handlePresetClick(amount)}
                          className={`rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                            selectedPreset === amount && !customAmount
                              ? "bg-purple-700 text-white shadow-md"
                              : "bg-warm-100 text-warm-700 hover:bg-warm-200 dark:bg-warm-800 dark:text-warm-300"
                          }`}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                    />
                  </div>

                  {/* Giving Type */}
                  <div className="space-y-3">
                    <Label>Giving Type</Label>
                    <RadioGroup
                      value={givingType}
                      onValueChange={setGivingType}
                      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                    >
                      {GIVING_TYPES.map((type) => (
                        <div key={type.value} className="flex items-center gap-2">
                          <RadioGroupItem
                            value={type.value}
                            id={`giving-${type.value}`}
                          />
                          <Label
                            htmlFor={`giving-${type.value}`}
                            className="cursor-pointer"
                          >
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Recurring */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="recurring"
                        checked={isRecurring}
                        onCheckedChange={setIsRecurring}
                      />
                      <Label htmlFor="recurring" className="cursor-pointer">
                        Make this a recurring gift
                      </Label>
                    </div>
                    {isRecurring && (
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="give-name">Your Name</Label>
                    <Input
                      id="give-name"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="give-email">Email</Label>
                    <Input
                      id="give-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gold-500 text-warm-900 hover:bg-gold-400 font-semibold"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Give Now
                  </Button>
                </div>
              </form>
            )}
          </FadeIn>
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
