"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Phone, Mail, Globe, Plus, Loader2 } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableText } from "@/components/cms/editable-text";
import type { Business } from "@/types";

export default function BusinessDirectoryPage() {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/public/businesses");
        const data = await res.json();
        setBusinesses(data.businesses ?? []);
      } catch (err) {
        console.error("Failed to load businesses:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const ALL_CATEGORIES = useMemo(
    () => ["All", ...Array.from(new Set(businesses.map((b) => b.category))).sort()],
    [businesses]
  );

  const SUBMIT_CATEGORIES = useMemo(
    () => Array.from(new Set(businesses.map((b) => b.category))).sort(),
    [businesses]
  );

  // Submit form state
  const [formName, setFormName] = useState("");
  const [formOwner, setFormOwner] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const filteredBusinesses = useMemo(() => {
    const approvedBusinesses = businesses.filter((b) => b.is_approved);
    return approvedBusinesses.filter((business) => {
      const matchesSearch =
        !searchTerm ||
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || business.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory, businesses]);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formOwner.trim() || !formDescription.trim()) return;
    setFormSubmitted(true);
  }

  function handleFormReset() {
    setFormName("");
    setFormOwner("");
    setFormDescription("");
    setFormCategory("");
    setFormPhone("");
    setFormEmail("");
    setFormWebsite("");
    setFormSubmitted(false);
  }

  if (loading) {
    return (
      <>
        <PageHero
          title="Business Directory"
          subtitle="Support our church family's businesses and services"
          breadcrumbs={[{ label: "Business Directory" }]}
        />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hero */}
      <PageHero
        title="Business Directory"
        subtitle="Support our church family's businesses and services"
        breadcrumbs={[{ label: "Business Directory" }]}
      />

      {/* Search + Filter */}
      <section className="section-padding">
        <div className="container-wide">
          <FadeIn>
            <div className="mb-8 space-y-4">
              {/* Search */}
              <div className="relative mx-auto max-w-xl">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-400" />
                <Input
                  placeholder="Search businesses by name, owner, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap justify-center gap-2">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-purple-700 text-white shadow-md"
                        : "bg-warm-100 text-warm-700 hover:bg-warm-200 dark:bg-warm-800 dark:text-warm-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Business Cards Grid */}
          {filteredBusinesses.length > 0 ? (
            <SlideUpContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBusinesses.map((business) => (
                <SlideUpItem key={business.id}>
                  <div className="flex h-full flex-col rounded-xl border border-warm-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-card-hover dark:border-warm-800 dark:bg-warm-900">
                    {/* Category Badge */}
                    <Badge className="mb-3 w-fit bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {business.category}
                    </Badge>

                    {/* Name */}
                    <h3 className="font-heading text-lg font-bold text-warm-900 dark:text-warm-50">
                      {business.name}
                    </h3>

                    {/* Owner */}
                    <p className="mt-1 text-sm text-warm-500">
                      Owner: {business.owner_name}
                    </p>

                    {/* Description */}
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-warm-600 line-clamp-3 dark:text-warm-400">
                      {business.description}
                    </p>

                    <Separator className="my-4" />

                    {/* Contact Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-warm-600 dark:text-warm-400">
                      {business.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          {business.phone}
                        </span>
                      )}
                      {business.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          {business.email}
                        </span>
                      )}
                      {business.website && (
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-purple-600 hover:underline dark:text-purple-400"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </SlideUpItem>
              ))}
            </SlideUpContainer>
          ) : (
            <FadeIn>
              <div className="rounded-2xl border border-warm-100 bg-warm-50 py-16 text-center dark:border-warm-800 dark:bg-warm-900">
                <p className="text-lg text-warm-500">
                  No businesses found matching your search.
                </p>
                <p className="mt-2 text-sm text-warm-400">
                  Try adjusting your search term or category filter.
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Submit Your Business */}
      <section className="section-padding bg-warm-50 dark:bg-warm-950">
        <div className="container-narrow">
          <FadeIn>
            <div className="text-center mb-10 lg:mb-14">
              <EditableText
                id="directory.submit.title"
                fallback="List Your Business"
                as="h2"
                className="text-fluid-3xl font-bold text-warm-900 dark:text-warm-50"
              />
              <EditableText
                id="directory.submit.subtitle"
                fallback="Are you a member of Friendship Baptist with a business or service? Let your church family know!"
                as="p"
                className="mt-3 text-fluid-base text-warm-600 dark:text-warm-400 max-w-2xl mx-auto"
              />
              <div className="mt-4 h-1 w-16 rounded-full bg-gradient-purple mx-auto" />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex justify-center">
              <Dialog onOpenChange={(open) => { if (!open) handleFormReset(); }}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="h-5 w-5" />
                    Submit Your Business
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-xl">
                      Submit Your Business
                    </DialogTitle>
                  </DialogHeader>

                  {formSubmitted ? (
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Plus className="h-7 w-7 text-purple-600" />
                      </div>
                      <h3 className="mt-4 font-heading text-lg font-bold text-warm-900 dark:text-warm-50">
                        Submission Received!
                      </h3>
                      <p className="mt-2 text-sm text-warm-600 dark:text-warm-400">
                        Thank you for submitting your business. It will be reviewed and
                        added to the directory shortly.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={handleFormReset}
                      >
                        Submit Another
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      {/* Business Name */}
                      <div className="space-y-2">
                        <Label htmlFor="biz-name">Business Name</Label>
                        <Input
                          id="biz-name"
                          placeholder="Your business name"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          required
                        />
                      </div>

                      {/* Owner Name */}
                      <div className="space-y-2">
                        <Label htmlFor="biz-owner">Owner Name</Label>
                        <Input
                          id="biz-owner"
                          placeholder="Your full name"
                          value={formOwner}
                          onChange={(e) => setFormOwner(e.target.value)}
                          required
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="biz-description">Description</Label>
                        <Textarea
                          id="biz-description"
                          placeholder="Describe your business or services..."
                          rows={3}
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          required
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={formCategory} onValueChange={setFormCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBMIT_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="biz-phone">Phone (optional)</Label>
                        <Input
                          id="biz-phone"
                          type="tel"
                          placeholder="(843) 555-0000"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="biz-email">Email (optional)</Label>
                        <Input
                          id="biz-email"
                          type="email"
                          placeholder="you@business.com"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                        />
                      </div>

                      {/* Website */}
                      <div className="space-y-2">
                        <Label htmlFor="biz-website">Website (optional)</Label>
                        <Input
                          id="biz-website"
                          type="url"
                          placeholder="https://yourbusiness.com"
                          value={formWebsite}
                          onChange={(e) => setFormWebsite(e.target.value)}
                        />
                      </div>

                      {/* Submit */}
                      <Button type="submit" className="w-full" size="lg">
                        Submit Business
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
