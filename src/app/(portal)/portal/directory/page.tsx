"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Phone, Mail, MapPin, Loader2, Church } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import type { UserRole } from "@/types";

const roleBadgeStyles: Record<UserRole, string> = {
  admin: "bg-gold-500 text-white",
  deacon: "bg-purple-600 text-white",
  minister: "bg-peach-500 text-white",
  musician: "bg-teal-500 text-white",
  finance: "bg-emerald-500 text-white",
  pastor: "bg-indigo-500 text-white",
  member: "bg-warm-200 text-warm-700",
  super_admin: "bg-gold-500 text-white",
};

const roleOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "member", label: "Member" },
  { value: "deacon", label: "Deacon" },
  { value: "minister", label: "Minister" },
  { value: "admin", label: "Admin" },
];

export default function ChurchDirectoryPage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    async function fetchDirectory() {
      try {
        const res = await fetch("/api/portal/directory");
        if (res.ok) {
          const data = await res.json();
          setProfiles(data.directory || data.profiles || data || []);
          if (data.ministries) {
            setMinistries(data.ministries);
          }
        }
      } catch (error) {
        console.error("Failed to fetch directory:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDirectory();
  }, []);

  const filteredMembers = useMemo(() => {
    return profiles.filter((profile) => {
      // Search by name or email
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        `${profile.first_name} ${profile.last_name}`
          .toLowerCase()
          .includes(query) ||
        (profile.email || "").toLowerCase().includes(query);

      // Filter by role
      const matchesRole =
        roleFilter === "all" || profile.role === roleFilter;

      // Ministry filter — check if profile has ministry_members for this ministry
      const matchesMinistry =
        ministryFilter === "all" ||
        (Array.isArray(profile.ministries) &&
          profile.ministries.some((m: { ministry_id?: string; name?: string }) =>
            m.ministry_id === ministryFilter
          ));

      return matchesSearch && matchesRole && matchesMinistry;
    });
  }, [profiles, searchQuery, roleFilter, ministryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn direction="up">
        <div>
          <h1 className="font-heading font-bold text-fluid-2xl text-warm-800">
            Church Directory
          </h1>
          <p className="text-warm-500 mt-1">
            {profiles.length} members in our church family
          </p>
        </div>
      </FadeIn>

      {/* Search + Filters */}
      <FadeIn direction="up" delay={0.1}>
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={ministryFilter} onValueChange={setMinistryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Ministry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ministries</SelectItem>
                {ministries.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </FadeIn>

      {/* Count */}
      <p className="text-sm text-warm-500">
        Showing {filteredMembers.length} of {profiles.length} members
      </p>

      {/* Member Grid */}
      <SlideUpContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((profile) => {
          const memberInitials = `${profile.first_name[0]}${profile.last_name[0]}`;
          const badgeStyle =
            roleBadgeStyles[profile.role as UserRole] || roleBadgeStyles.member;

          return (
            <SlideUpItem key={profile.id}>
              <Card
                role="button"
                tabIndex={0}
                aria-label={`View ${profile.first_name} ${profile.last_name}'s profile`}
                onClick={() => setSelected(profile)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(profile);
                  }
                }}
                className="p-5 cursor-pointer hover:shadow-card-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                <div className="flex items-start gap-3">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={`${profile.first_name} ${profile.last_name}`}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = "none";
                        if (el.nextElementSibling instanceof HTMLElement) el.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div className={`h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white font-bold text-sm${profile.photo_url ? " hidden" : ""}`} style={{ display: profile.photo_url ? "none" : "flex" }}>
                    {memberInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-warm-800">
                        {profile.first_name} {profile.last_name}
                      </p>
                      <Badge className={`${badgeStyle} capitalize text-[10px]`}>
                        {profile.role}
                      </Badge>
                    </div>
                    {profile.phone && (
                      <p className="text-sm text-warm-500 flex items-center gap-1.5 mt-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {profile.phone}
                      </p>
                    )}
                    {profile.email && (
                      <p className="text-sm text-warm-500 flex items-center gap-1.5 mt-1">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{profile.email}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </SlideUpItem>
          );
        })}
      </SlideUpContainer>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 text-warm-400">
          <p className="text-lg">No members found matching your filters.</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Member profile detail */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">
                  {selected.first_name} {selected.last_name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center text-center pt-2">
                {selected.photo_url ? (
                  <img
                    src={selected.photo_url}
                    alt={`${selected.first_name} ${selected.last_name}`}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-700 text-white font-bold text-2xl">
                    {selected.first_name?.[0]}
                    {selected.last_name?.[0]}
                  </div>
                )}
                <h2 className="mt-4 font-heading font-bold text-xl text-warm-800">
                  {selected.first_name} {selected.last_name}
                </h2>
                <Badge
                  className={`${roleBadgeStyles[selected.role as UserRole] || roleBadgeStyles.member} capitalize mt-2`}
                >
                  {selected.role}
                </Badge>
              </div>

              <div className="mt-4 space-y-2 border-t border-warm-100 pt-4">
                {selected.phone && (
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-warm-700 hover:bg-warm-50 transition-colors"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-purple-600" />
                    {selected.phone}
                  </a>
                )}
                {selected.email && (
                  <a
                    href={`mailto:${selected.email}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-warm-700 hover:bg-warm-50 transition-colors"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-purple-600" />
                    <span className="truncate">{selected.email}</span>
                  </a>
                )}
                {(() => {
                  const line = [
                    selected.address,
                    [selected.city, selected.state].filter(Boolean).join(", "),
                    selected.zip,
                  ]
                    .filter(Boolean)
                    .join(" ")
                    .trim();
                  return line ? (
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-warm-700">
                      <MapPin className="h-4 w-4 shrink-0 text-purple-600" />
                      <span>{line}</span>
                    </div>
                  ) : null;
                })()}
                {!selected.phone && !selected.email && (
                  <p className="px-3 py-2.5 text-sm text-warm-400">
                    This member has chosen to keep their contact details private.
                  </p>
                )}
              </div>

              {Array.isArray(selected.ministries) && selected.ministries.length > 0 && (
                <div className="mt-2 border-t border-warm-100 pt-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-warm-500 mb-2">
                    <Church className="h-3.5 w-3.5" /> Ministries
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.ministries.map(
                      (m: { ministry_id?: string; name?: string }, i: number) => (
                        <Badge
                          key={m.ministry_id || i}
                          className="bg-warm-100 text-warm-700"
                        >
                          {m.name}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
