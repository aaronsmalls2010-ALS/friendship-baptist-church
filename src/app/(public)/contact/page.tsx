"use client";

import { useState } from "react";
import { PageHero } from "@/components/shared/page-hero";
import { FadeIn } from "@/components/motion/fade-in";
import { FormSuccess } from "@/components/shared/form-success";
import { CHURCH_INFO } from "@/lib/constants";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Building2, Send } from "lucide-react";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  type: string;
  message: string;
}

const initialFormState: ContactForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  type: "",
  message: "",
};

const inquiryTypes = [
  "General Inquiry",
  "Prayer Request",
  "Membership Information",
  "Speaking Request",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(initialFormState);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm(initialFormState);
    setSubmitted(false);
  };

  const fullAddress = `${CHURCH_INFO.address.street}, ${CHURCH_INFO.address.city}, ${CHURCH_INFO.address.state} ${CHURCH_INFO.address.zip}`;

  return (
    <>
      {/* Hero */}
      <PageHero
        title="Contact Us"
        subtitle="We'd love to hear from you"
        breadcrumbs={[{ label: "Contact" }]}
      />

      {/* Main Content */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            {/* LEFT — Contact Form */}
            <FadeIn direction="left">
              <Card className="shadow-card-hover">
                <CardHeader>
                  <CardTitle className="font-heading text-fluid-2xl font-bold text-warm-900">
                    Send Us a Message
                  </CardTitle>
                  <p className="text-sm text-warm-500">
                    Fill out the form below and we&apos;ll get back to you as
                    soon as possible.
                  </p>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <FormSuccess
                      title="Message Sent!"
                      message="Thank you for reaching out to Friendship Baptist Church. We will respond to your message within 1-2 business days."
                      onReset={handleReset}
                    />
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Your full name"
                          value={form.name}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      {/* Email + Phone row */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="(843) 555-0000"
                            value={form.phone}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="What is this regarding?"
                          value={form.subject}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      {/* Inquiry Type */}
                      <div className="space-y-2">
                        <Label>Inquiry Type</Label>
                        <Select
                          value={form.type}
                          onValueChange={(value) =>
                            setForm((prev) => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {inquiryTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="How can we help you?"
                          rows={5}
                          value={form.message}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      {/* Submit */}
                      <Button
                        type="submit"
                        className="w-full bg-purple-700 text-white hover:bg-purple-600"
                        size="lg"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </FadeIn>

            {/* RIGHT — Church Info Cards */}
            <FadeIn direction="right" delay={0.15}>
              <div className="space-y-5">
                {/* Address */}
                <Card className="shadow-card-hover">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                      <MapPin className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-warm-900">
                        Church Address
                      </h3>
                      <p className="mt-1 text-sm text-warm-600">
                        {CHURCH_INFO.address.street}
                        <br />
                        {CHURCH_INFO.address.city},{" "}
                        {CHURCH_INFO.address.state}{" "}
                        {CHURCH_INFO.address.zip}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Phone */}
                <Card className="shadow-card-hover">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                      <Phone className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-warm-900">
                        Phone
                      </h3>
                      <p className="mt-1 text-sm text-warm-600">
                        {CHURCH_INFO.phone}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Email */}
                <Card className="shadow-card-hover">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                      <Mail className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-warm-900">
                        Email
                      </h3>
                      <p className="mt-1 text-sm text-warm-600">
                        {CHURCH_INFO.email}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Service Times */}
                <Card className="shadow-card-hover">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                      <Clock className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-warm-900">
                        Service Times
                      </h3>
                      <ul className="mt-1 space-y-1 text-sm text-warm-600">
                        {CHURCH_INFO.serviceTimes.map((service) => (
                          <li key={service.name}>
                            <span className="font-medium text-warm-800">
                              {service.name}
                            </span>{" "}
                            — {service.day} at {service.time}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Office Hours */}
                <Card className="shadow-card-hover">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                      <Building2 className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-warm-900">
                        Office Hours
                      </h3>
                      <p className="mt-1 text-sm text-warm-600">
                        Monday &ndash; Friday: 9:00 AM &ndash; 3:00 PM
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Map Placeholder */}
                <div className="flex h-48 items-center justify-center rounded-xl bg-warm-100">
                  <div className="text-center">
                    <MapPin className="mx-auto h-8 w-8 text-warm-400" />
                    <p className="mt-2 text-sm font-medium text-warm-500">
                      Map Coming Soon
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
