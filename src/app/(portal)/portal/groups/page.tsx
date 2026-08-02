"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  UsersRound,
  MapPin,
  Clock,
  CalendarDays,
  Check,
  Hourglass,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/fade-in";

type Group = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  meeting_day?: string | null;
  meeting_time?: string | null;
  location?: string | null;
  leader_name?: string | null;
  member_count: number;
  capacity?: number | null;
  is_open: boolean;
  my_status: "approved" | "pending" | null;
};

export default function PortalGroupsPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/portal/groups");
      if (res.ok) {
        const d = await res.json();
        setGroups(d.groups ?? []);
      }
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function join(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/portal/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: id }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  async function leave(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/portal/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: id }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  const myGroups = groups.filter((g) => g.my_status);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  function GroupCard({ group }: { group: Group }) {
    const full =
      group.capacity != null && group.member_count >= group.capacity;
    return (
      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-warm-800">{group.name}</p>
            {group.category && (
              <Badge className="bg-warm-100 text-warm-700 mt-1">
                {group.category}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-warm-500 shrink-0">
            <UsersRound className="h-4 w-4" />
            {group.member_count}
            {group.capacity != null && `/${group.capacity}`}
          </div>
        </div>

        {group.description && (
          <p className="text-sm text-warm-600 line-clamp-3">{group.description}</p>
        )}

        <div className="space-y-1 text-sm text-warm-500">
          {(group.meeting_day || group.meeting_time) && (
            <p className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {[group.meeting_day, group.meeting_time].filter(Boolean).join(" · ")}
            </p>
          )}
          {group.location && (
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {group.location}
            </p>
          )}
          {group.leader_name && (
            <p className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 opacity-0" />
              Led by {group.leader_name}
            </p>
          )}
        </div>

        <div className="mt-auto pt-2">
          {group.my_status === "approved" ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={busy === group.id}
              onClick={() => leave(group.id)}
            >
              {busy === group.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4 text-emerald-600" /> Joined — Leave
                </>
              )}
            </Button>
          ) : group.my_status === "pending" ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={busy === group.id}
              onClick={() => leave(group.id)}
            >
              {busy === group.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Hourglass className="mr-2 h-4 w-4 text-amber-600" /> Request pending — Cancel
                </>
              )}
            </Button>
          ) : (
            <Button
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
              disabled={busy === group.id || full}
              onClick={() => join(group.id)}
            >
              {busy === group.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : full ? (
                "Group full"
              ) : group.is_open ? (
                "Join Group"
              ) : (
                "Request to Join"
              )}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FadeIn direction="up">
        <div>
          <h1 className="font-heading font-bold text-fluid-2xl text-warm-800">
            Find a Group
          </h1>
          <p className="text-warm-500 mt-1">
            Connect and grow with others in a small group.
          </p>
        </div>
      </FadeIn>

      {myGroups.length > 0 && (
        <FadeIn direction="up" delay={0.05}>
          <div className="space-y-3">
            <h2 className="font-heading font-semibold text-lg text-warm-800">
              My Groups
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGroups.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      <FadeIn direction="up" delay={0.1}>
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-lg text-warm-800">
            All Groups
          </h2>
          {groups.length === 0 ? (
            <div className="text-center py-12 text-warm-400">
              <UsersRound className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-lg">No groups yet.</p>
              <p className="text-sm mt-1">Check back soon — new groups are on the way.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
