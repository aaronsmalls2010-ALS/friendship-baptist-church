"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Phone, Mail, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    async function fetchDirectory() {
      try {
        const res = await fetch("/api/portal/directory");
        if (res.ok) {
          const data = await res.json();
          setProfiles(data.profiles || data || []);
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
        profile.email.toLowerCase().includes(query);

      // Filter by role
      const matchesRole =
        roleFilter === "all" || profile.role === roleFilter;

      // Ministry filter
      const matchesMinistry = ministryFilter === "all";

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
              <Card className="p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white font-bold text-sm">
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
                    <p className="text-sm text-warm-500 flex items-center gap-1.5 mt-1">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </p>
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
    </div>
  );
}
