"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import {
  Phone,
  Mail,
  Clock,
  Users,
  ChevronLeft,
  User,
} from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { FadeIn } from "@/components/motion/fade-in";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { EditableImage } from "@/components/cms/editable-image";
import { EditableText } from "@/components/cms/editable-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MOCK_MINISTRIES, MOCK_MINISTRY_MEMBERS } from "@/lib/mock-data";

// ─── Ministry Detail Data ──────────────────────────────────────────
interface Officer {
  name: string;
  title: string;
  role: "president" | "vice_president" | "secretary";
  phone: string;
  email: string;
}

interface MinistryDetail {
  history: string;
  purpose: string;
  scripture: string;
  scripture_ref: string;
  officers: Officer[];
  members: string[];
}

const MINISTRY_DETAILS: Record<string, MinistryDetail> = {
  m1: {
    history:
      "The Usher Board of Friendship Baptist Church was established in the early years of the congregation, rooted in the belief that welcoming guests into God's house is a sacred calling. For generations, ushers have stood at the doors of our sanctuary with warm smiles and helping hands, guiding visitors and members alike to their seats and ensuring a reverent, orderly worship experience. The Usher Board continues to uphold the traditions of hospitality and service that have defined Friendship Baptist for over a century.",
    purpose:
      "The Usher Board serves as the first point of contact for all who enter the doors of Friendship Baptist Church. Our mission is to create a welcoming, spirit-filled atmosphere where every person feels the love of Christ from the moment they arrive. We assist with seating, distribute programs, collect offerings, and maintain order during worship services.",
    scripture:
      "I was glad when they said unto me, Let us go into the house of the Lord.",
    scripture_ref: "Psalm 122:1",
    officers: [
      { name: "Martha Washington", title: "President", role: "president", phone: "(843) 555-0201", email: "martha.washington@email.com" },
      { name: "James Singleton", title: "Vice President", role: "vice_president", phone: "(843) 555-0202", email: "james.singleton@email.com" },
      { name: "Gloria Campbell", title: "Secretary", role: "secretary", phone: "(843) 555-0207", email: "gloria.campbell@email.com" },
    ],
    members: ["Martha Washington", "James Singleton", "Gloria Campbell", "Robert Davis", "Shirley Holmes", "Dexter Brown", "Annie Richardson"],
  },
  m2: {
    history:
      "The Choir of Friendship Baptist Church has been lifting voices in praise since the earliest days of the congregation. Born out of the rich tradition of African American sacred music, the choir has carried the sound of worship through hymns, spirituals, anthems, and contemporary gospel. From humble beginnings singing a cappella under oak trees to leading worship in our sanctuary every Sunday, the choir has always been the heartbeat of our praise. Over the decades, the choir has performed at community events, revivals, and church anniversaries, blessing everyone who hears them.",
    purpose:
      "The Friendship Baptist Choir exists to glorify God through the ministry of music. We lead the congregation in worship, minister through song at funerals and special occasions, and carry on the rich legacy of African American sacred music. Our rehearsals are a time of fellowship, spiritual growth, and musical development.",
    scripture:
      "O come, let us sing unto the Lord: let us make a joyful noise to the rock of our salvation.",
    scripture_ref: "Psalm 95:1",
    officers: [
      { name: "James Singleton", title: "President", role: "president", phone: "(843) 555-0202", email: "james.singleton@email.com" },
      { name: "Mae Robinson", title: "Vice President", role: "vice_president", phone: "(843) 555-0204", email: "mae.robinson@email.com" },
      { name: "Dorothy Williams", title: "Secretary", role: "secretary", phone: "(843) 555-0210", email: "dorothy.williams@email.com" },
    ],
    members: ["James Singleton", "Mae Robinson", "Dorothy Williams", "Alma Reed", "Sandra Mitchell", "Tony Freeman", "Brenda Collins", "Charles Washington"],
  },
  m3: {
    history:
      "The Youth Ministry at Friendship Baptist Church was founded to ensure that the next generation would be grounded in faith, fellowship, and service. What began as a small Sunday afternoon Bible study for teenagers has grown into a vibrant ministry that touches the lives of young people ages 12 to 18. Over the years, the Youth Ministry has organized community service projects, back-to-school rallies, summer camps, and youth retreats that have helped our young people discover their purpose in Christ.",
    purpose:
      "Our Youth Ministry nurtures the next generation of believers through Bible study, fellowship, community service, and wholesome activities. We provide a safe, loving environment where young people can grow in their faith, develop leadership skills, and build lifelong friendships rooted in Christ. We believe every young person has a God-given purpose and we are committed to helping them discover it.",
    scripture:
      "Train up a child in the way he should go: and when he is old, he will not depart from it.",
    scripture_ref: "Proverbs 22:6",
    officers: [
      { name: "Crystal Young", title: "President", role: "president", phone: "(843) 555-0203", email: "crystal.young@email.com" },
      { name: "Michael Thompson", title: "Vice President", role: "vice_president", phone: "(843) 555-0211", email: "michael.thompson@email.com" },
      { name: "Jasmine Carter", title: "Secretary", role: "secretary", phone: "(843) 555-0212", email: "jasmine.carter@email.com" },
    ],
    members: ["Crystal Young", "Michael Thompson", "Jasmine Carter", "David Mitchell", "Keisha Williams", "Marcus Johnson"],
  },
  m4: {
    history:
      "The Missionary Society has been a cornerstone of Friendship Baptist Church's outreach efforts for many decades. Inspired by the Great Commission, the society was established to extend the love of Christ beyond the church walls and into the Beaufort community and beyond. From feeding the hungry and clothing the needy to supporting global mission partnerships, the Missionary Society has remained faithful to its calling. Members have organized food drives, visited nursing homes, supported disaster relief efforts, and sent care packages to missionaries around the world.",
    purpose:
      "The Missionary Society extends the love of Christ through local outreach, community support, and global mission partnerships. We are driven by the Great Commission to spread the Gospel and meet the physical and spiritual needs of those around us. Through food pantries, community events, and mission trips, we serve as the hands and feet of Jesus in the Lowcountry and beyond.",
    scripture:
      "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.",
    scripture_ref: "Matthew 28:19",
    officers: [
      { name: "Mae Robinson", title: "President", role: "president", phone: "(843) 555-0204", email: "mae.robinson@email.com" },
      { name: "Patricia Grant", title: "Vice President", role: "vice_president", phone: "(843) 555-0205", email: "patricia.grant@email.com" },
      { name: "Helen Miller", title: "Secretary", role: "secretary", phone: "(843) 555-0213", email: "helen.miller@email.com" },
    ],
    members: ["Mae Robinson", "Patricia Grant", "Helen Miller", "Ruth Adams", "Bertha Jackson", "Willie Mae Brown", "Cora Lee Jenkins"],
  },
  m5: {
    history:
      "The Deaconess Board of Friendship Baptist Church has a long and honored history of service and compassion. Established to work alongside the deacons, the Deaconess Board has been a pillar of spiritual care in our congregation for generations. These devoted women have visited the sick, comforted the bereaved, prepared communion, and provided spiritual guidance to families in times of need. Their quiet strength and unwavering faith have been a source of inspiration to all who know them.",
    purpose:
      "The Deaconess Board serves alongside the deacons to provide spiritual guidance, compassionate care, and practical support to the members of Friendship Baptist Church. We visit the sick and homebound, prepare communion elements, assist with baptisms, and support families during times of loss and transition. Our ministry is one of love, prayer, and faithful service.",
    scripture:
      "She opens her arms to the poor and extends her hands to the needy.",
    scripture_ref: "Proverbs 31:20",
    officers: [
      { name: "Patricia Grant", title: "President", role: "president", phone: "(843) 555-0205", email: "patricia.grant@email.com" },
      { name: "Katie Calloway", title: "Vice President", role: "vice_president", phone: "(843) 555-0214", email: "katie.calloway@email.com" },
      { name: "Alma Reed", title: "Secretary", role: "secretary", phone: "(843) 555-0215", email: "alma.reed@email.com" },
    ],
    members: ["Patricia Grant", "Katie Calloway", "Alma Reed", "Bessie Monroe", "Edna Frazier", "Rosa Bennett"],
  },
  m6: {
    history:
      "Sunday School at Friendship Baptist Church has been a foundation of spiritual education since the church's earliest days. What began as simple Bible lessons taught under the trees has evolved into a comprehensive program offering classes for every age group. For generations, Sunday School teachers have faithfully opened God's Word to children, youth, and adults, helping them build a strong foundation of faith. Many of our current church leaders trace their spiritual roots back to the lessons they learned in Sunday School.",
    purpose:
      "Sunday School offers Bible-based teaching for all ages, meeting every Sunday before morning worship. Our classes are designed to deepen understanding of God's Word, strengthen faith foundations, and equip believers for daily Christian living. From our youngest learners to our seasoned saints, Sunday School provides a place for everyone to grow in knowledge and love of the Lord.",
    scripture:
      "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.",
    scripture_ref: "2 Timothy 2:15",
    officers: [
      { name: "Henry Baker", title: "Superintendent", role: "president", phone: "(843) 555-0206", email: "henry.baker@email.com" },
      { name: "William Harris", title: "Vice Superintendent", role: "vice_president", phone: "(843) 555-0208", email: "william.harris@email.com" },
      { name: "Sandra Mitchell", title: "Secretary", role: "secretary", phone: "(843) 555-0216", email: "sandra.mitchell@email.com" },
    ],
    members: ["Henry Baker", "William Harris", "Sandra Mitchell", "Barbara Jenkins", "Thomas Green", "Evelyn Carter", "Joseph Freeman"],
  },
};

// ─── Page Component ────────────────────────────────────────────────
export default function MinistryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);

  const ministry = MOCK_MINISTRIES.find((m) => m.id === id);
  const details = MINISTRY_DETAILS[id];

  if (!ministry || !details) {
    notFound();
  }

  // Get members from mock data
  const ministryMembers = MOCK_MINISTRY_MEMBERS.filter(
    (mm) => mm.ministry_id === id && mm.status === "approved"
  );

  const roleLabel = (role: Officer["role"]) => {
    switch (role) {
      case "president":
        return "President";
      case "vice_president":
        return "Vice President";
      case "secretary":
        return "Secretary";
    }
  };

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <PageHero
        title={
          <EditableText
            id={`ministry.${id}.hero.title`}
            fallback={ministry.name}
            as="span"
          />
        }
        subtitle={
          <EditableText
            id={`ministry.${id}.hero.subtitle`}
            fallback={ministry.description}
            as="span"
          />
        }
        breadcrumbs={[
          { label: "Ministries", href: "/ministries" },
          { label: ministry.name },
        ]}
      />

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <section className="section-padding">
        <div className="container-wide">
          {/* Back link */}
          <FadeIn>
            <Link
              href="/ministries"
              className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:text-purple-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              All Ministries
            </Link>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* ── Left Column (main content) ─────────────────────────── */}
            <div className="lg:col-span-2 space-y-12">
              {/* Group Picture */}
              <FadeIn>
                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-warm-100 shadow-sm border border-warm-200">
                  <EditableImage
                    id={`ministry.${id}.group-photo`}
                    fallback="/images/placeholder-ministry.jpg"
                    alt={`${ministry.name} group photo`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                  />
                </div>
              </FadeIn>

              {/* Introduction & Purpose */}
              <FadeIn delay={0.1}>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-warm-900 mb-4">
                    <EditableText
                      id={`ministry.${id}.purpose.heading`}
                      fallback="Introduction & Purpose"
                      as="span"
                    />
                  </h2>
                  <div className="prose prose-warm max-w-none">
                    <p className="text-warm-700 leading-relaxed">
                      <EditableText
                        id={`ministry.${id}.purpose.body`}
                        fallback={details.purpose}
                        as="span"
                        multiline
                      />
                    </p>
                  </div>
                </div>
              </FadeIn>

              {/* Scripture Divider */}
              <ScriptureDivider
                text={
                  <EditableText
                    id={`ministry.${id}.scripture.text`}
                    fallback={details.scripture}
                    as="span"
                    multiline
                  />
                }
                reference={
                  <EditableText
                    id={`ministry.${id}.scripture.ref`}
                    fallback={details.scripture_ref}
                    as="span"
                  />
                }
              />

              {/* Brief History */}
              <FadeIn delay={0.15}>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-warm-900 mb-4">
                    <EditableText
                      id={`ministry.${id}.history.heading`}
                      fallback="Brief History"
                      as="span"
                    />
                  </h2>
                  <div className="prose prose-warm max-w-none">
                    <p className="text-warm-700 leading-relaxed">
                      <EditableText
                        id={`ministry.${id}.history.body`}
                        fallback={details.history}
                        as="span"
                        multiline
                      />
                    </p>
                  </div>
                </div>
              </FadeIn>

              {/* ── Officer Contact Cards ────────────────────────────── */}
              <FadeIn delay={0.2}>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-warm-900 mb-6">
                    Ministry Officers
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {details.officers.map((officer) => (
                      <Card
                        key={officer.role}
                        className="cursor-pointer hover:shadow-card-hover transition-all duration-300 border-warm-200 hover:border-purple-300"
                        onClick={() => setSelectedOfficer(officer)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                              <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-semibold text-warm-900">
                                {officer.name}
                              </CardTitle>
                              <Badge className="mt-1 bg-purple-100 text-purple-700 border-purple-200 text-[10px]">
                                {officer.title}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-1.5 text-xs text-warm-600">
                            <p className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-purple-400" />
                              {officer.phone}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-purple-400" />
                              {officer.email}
                            </p>
                          </div>
                          <p className="mt-2 text-[10px] text-warm-400 italic">
                            Click to enlarge
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </FadeIn>

              {/* ── Officer Dialog ─────────────────────────────────────── */}
              <Dialog
                open={selectedOfficer !== null}
                onOpenChange={(open) => {
                  if (!open) setSelectedOfficer(null);
                }}
              >
                <DialogContent className="sm:max-w-md">
                  {selectedOfficer && (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <span className="block text-lg">{selectedOfficer.name}</span>
                            <Badge className="mt-1 bg-purple-100 text-purple-700 border-purple-200 text-xs">
                              {selectedOfficer.title}
                            </Badge>
                          </div>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="rounded-xl bg-warm-50 p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-purple-500" />
                            <div>
                              <p className="text-xs text-warm-500">Phone</p>
                              <a
                                href={`tel:${selectedOfficer.phone}`}
                                className="text-sm font-medium text-warm-900 hover:text-purple-700 transition-colors"
                              >
                                {selectedOfficer.phone}
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-purple-500" />
                            <div>
                              <p className="text-xs text-warm-500">Email</p>
                              <a
                                href={`mailto:${selectedOfficer.email}`}
                                className="text-sm font-medium text-warm-900 hover:text-purple-700 transition-colors"
                              >
                                {selectedOfficer.email}
                              </a>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-warm-500 text-center">
                          {roleLabel(selectedOfficer.role)} of the {ministry.name}
                        </p>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>

              {/* ── Members List ───────────────────────────────────────── */}
              <FadeIn delay={0.25}>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-warm-900 mb-4">
                    Members
                  </h2>
                  {details.members.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {details.members.map((member) => (
                        <div
                          key={member}
                          className="flex items-center gap-3 rounded-lg bg-warm-50 px-4 py-3 border border-warm-100"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-warm-800">
                            {member}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-warm-500 text-sm">
                      Member information coming soon.
                    </p>
                  )}
                </div>
              </FadeIn>
            </div>

            {/* ── Right Sidebar ──────────────────────────────────────── */}
            <aside className="space-y-6">
              {/* Schedule */}
              {ministry.schedule && (
                <FadeIn direction="left" delay={0.1}>
                  <Card className="border-warm-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-warm-900">
                        <Clock className="h-4 w-4 text-purple-500" />
                        Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-warm-700">{ministry.schedule}</p>
                    </CardContent>
                  </Card>
                </FadeIn>
              )}

              {/* Officers Quick View */}
              <FadeIn direction="left" delay={0.2}>
                <Card className="border-warm-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-warm-900">
                      <Users className="h-4 w-4 text-purple-500" />
                      Officers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {details.officers.map((officer) => (
                        <button
                          key={officer.role}
                          onClick={() => setSelectedOfficer(officer)}
                          className="w-full text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors">
                              <User className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-warm-900 group-hover:text-purple-700 transition-colors">
                                {officer.name}
                              </p>
                              <p className="text-xs text-warm-500">
                                {officer.title}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Member Count */}
              <FadeIn direction="left" delay={0.3}>
                <Card className="border-warm-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-warm-900">
                      <Users className="h-4 w-4 text-purple-500" />
                      Membership
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-700">
                      {details.members.length}
                    </p>
                    <p className="text-sm text-warm-500 mt-1">Active Members</p>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Back to Ministries */}
              <FadeIn direction="left" delay={0.35}>
                <Link
                  href="/ministries"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-purple-700 hover:bg-purple-600 text-white py-3 px-4 text-sm font-medium transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  All Ministries
                </Link>
              </FadeIn>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
