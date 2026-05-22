"use client";

import { Phone, Mail, Users } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { CTAButton } from "@/components/shared/cta-button";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { MOCK_DEACONS, MOCK_WARDS } from "@/lib/mock-data";
import { EditableText } from "@/components/cms/editable-text";

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

function getDeaconNameForWard(deaconId: string): string {
  const deacon = MOCK_DEACONS.find((d) => d.id === deaconId);
  return deacon ? `${deacon.first_name} ${deacon.last_name}` : "Unassigned";
}

export default function DeaconsPage() {
  return (
    <>
      <PageHero
        title="Our Deacons"
        subtitle="Faithful servants leading our church family with love and devotion"
        breadcrumbs={[
          { label: "About", href: "/about" },
          { label: "Deacons" },
        ]}
      />

      {/* ── Our Deacons Grid ────────────────────────────────────────── */}
      <section className="section-padding">
        <div className="container-wide">
          <FadeIn>
            <div className="text-center mb-10 lg:mb-14">
              <EditableText
                id="deacons.grid.title"
                fallback="Our Deacons"
                as="h2"
                className="text-fluid-3xl font-bold text-warm-900 dark:text-warm-50"
              />
              <EditableText
                id="deacons.grid.subtitle"
                fallback="Meet the servant leaders who shepherd our church family"
                as="p"
                className="mt-3 text-fluid-base text-warm-600 dark:text-warm-400 max-w-2xl mx-auto"
              />
              <div className="mt-4 h-1 w-16 rounded-full bg-gradient-purple mx-auto" />
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_DEACONS.map((deacon, index) => (
              <FadeIn key={deacon.id} delay={index * 0.1}>
                <div className="bg-white rounded-xl shadow-sm hover:shadow-card-hover transition-all duration-300 border border-warm-100 p-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-purple-700">
                        {getInitials(deacon.first_name, deacon.last_name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-warm-900">
                        {deacon.first_name} {deacon.last_name}
                      </h3>
                      {deacon.ward_name && (
                        <Badge className="mt-1 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                          {deacon.ward_name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-warm-600 text-sm leading-relaxed mb-4">
                    {deacon.bio}
                  </p>

                  {/* Contact */}
                  <div className="space-y-2 pt-4 border-t border-warm-100">
                    {deacon.phone && (
                      <a
                        href={`tel:${deacon.phone}`}
                        className="flex items-center gap-2 text-sm text-warm-600 hover:text-purple-700 transition-colors"
                      >
                        <Phone className="h-4 w-4 text-purple-500" />
                        {deacon.phone}
                      </a>
                    )}
                    {deacon.email && (
                      <a
                        href={`mailto:${deacon.email}`}
                        className="flex items-center gap-2 text-sm text-warm-600 hover:text-purple-700 transition-colors"
                      >
                        <Mail className="h-4 w-4 text-purple-500" />
                        {deacon.email}
                      </a>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ward Assignments ─────────────────────────────────────────── */}
      <section className="section-padding bg-warm-50">
        <div className="container-wide">
          <FadeIn>
            <div className="text-center mb-10 lg:mb-14">
              <EditableText
                id="deacons.wards.title"
                fallback="Ward Assignments"
                as="h2"
                className="text-fluid-3xl font-bold text-warm-900 dark:text-warm-50"
              />
              <EditableText
                id="deacons.wards.subtitle"
                fallback="Each deacon shepherds families in their assigned ward"
                as="p"
                className="mt-3 text-fluid-base text-warm-600 dark:text-warm-400 max-w-2xl mx-auto"
              />
              <div className="mt-4 h-1 w-16 rounded-full bg-gradient-purple mx-auto" />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-warm-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-purple-50 hover:bg-purple-50">
                    <TableHead className="font-heading font-semibold text-purple-900">
                      Ward
                    </TableHead>
                    <TableHead className="font-heading font-semibold text-purple-900">
                      Deacon
                    </TableHead>
                    <TableHead className="font-heading font-semibold text-purple-900 text-center">
                      Families
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_WARDS.map((ward) => (
                    <TableRow key={ward.id}>
                      <TableCell className="font-medium text-warm-900">
                        {ward.name}
                      </TableCell>
                      <TableCell className="text-warm-600">
                        Deacon {ward.deacon_id ? getDeaconNameForWard(ward.deacon_id) : "Unassigned"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-warm-600">
                          <Users className="h-4 w-4 text-purple-500" />
                          {ward.families_count}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── The Role of Deacons ──────────────────────────────────────── */}
      <section className="section-padding">
        <div className="container-narrow">
          <FadeIn>
            <div className="text-center mb-10 lg:mb-14">
              <EditableText
                id="deacons.role.title"
                fallback="The Role of Deacons"
                as="h2"
                className="text-fluid-3xl font-bold text-warm-900 dark:text-warm-50"
              />
              <EditableText
                id="deacons.role.subtitle"
                fallback="Servants of Christ, stewards of the church"
                as="p"
                className="mt-3 text-fluid-base text-warm-600 dark:text-warm-400 max-w-2xl mx-auto"
              />
              <div className="mt-4 h-1 w-16 rounded-full bg-gradient-purple mx-auto" />
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="space-y-5 text-warm-600 leading-relaxed">
              <EditableText
                id="deacons.role.desc1"
                fallback="At Friendship Baptist Church, our deacons are ordained servant leaders called by God to assist the pastor in the spiritual and practical care of the congregation. They are men of faith, character, and compassion who have devoted their lives to building up the body of Christ through prayer, service, and visitation."
                as="p"
                multiline
              />
              <EditableText
                id="deacons.role.desc2"
                fallback="Each deacon is assigned a ward—a group of church families within the Beaufort community. They visit the sick, comfort the bereaved, pray with families during times of crisis, and celebrate with them in times of joy. Their ministry extends beyond the walls of the sanctuary into the homes and hearts of our members."
                as="p"
                multiline
              />
              <EditableText
                id="deacons.role.desc3"
                fallback="Our deacons also serve alongside the pastor in administering the sacraments of Communion and Baptism, leading devotional services, and ensuring the church operates with integrity and love. They are pillars of our congregation and examples of what it means to live a life of humble service."
                as="p"
                multiline
              />
            </div>
          </FadeIn>

          {/* Scripture Quote */}
          <FadeIn delay={0.3}>
            <blockquote className="mt-10 rounded-xl bg-purple-50 border-l-4 border-purple-600 p-6 lg:p-8">
              <EditableText
                id="deacons.scripture.text"
                fallback={"“In the same way, deacons are to be worthy of respect, sincere, not indulging in much wine, and not pursuing dishonest gain. They must keep hold of the deep truths of the faith with a clear conscience.”"}
                as="p"
                className="font-scripture text-fluid-lg italic text-purple-900 leading-relaxed"
                multiline
              />
              <EditableText
                id="deacons.scripture.reference"
                fallback={"— 1 Timothy 3:8-9"}
                as="p"
                className="mt-4 text-sm font-medium tracking-wide uppercase text-purple-600"
              />
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="section-padding bg-warm-50">
        <div className="container-narrow text-center">
          <FadeIn>
            <EditableText
              id="deacons.cta.title"
              fallback="Need Prayer?"
              as="h2"
              className="font-heading text-fluid-2xl font-bold text-warm-900 mb-3"
            />
            <EditableText
              id="deacons.cta.desc"
              fallback="Our deacons and church family are here to support you. Submit a prayer request and let us stand with you in faith."
              as="p"
              className="text-warm-600 mb-8 max-w-lg mx-auto"
            />
            <CTAButton href="/prayer" variant="primary">
              Submit a Prayer Request
            </CTAButton>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
