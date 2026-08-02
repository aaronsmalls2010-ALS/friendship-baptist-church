"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  UsersRound,
  Settings2,
  Check,
  X,
  Crown,
  Search,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Group = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  meeting_day?: string | null;
  meeting_time?: string | null;
  location?: string | null;
  leader_id?: string | null;
  leader_name?: string | null;
  capacity?: number | null;
  is_active: boolean;
  is_open: boolean;
  member_count: number;
  pending_count: number;
};

type Member = { id: string; first_name: string; last_name: string; email?: string };
type RosterRow = {
  profile_id: string;
  role: "member" | "leader";
  status: "pending" | "approved";
  profiles: { first_name: string; last_name: string; email?: string } | null;
};

const empty = {
  name: "",
  description: "",
  category: "",
  meeting_day: "",
  meeting_time: "",
  location: "",
  capacity: "",
  is_open: true,
  is_active: true,
};

export default function AdminGroupsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

  const [rosterGroup, setRosterGroup] = useState<Group | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  async function loadGroups() {
    try {
      const res = await fetch("/api/admin/groups");
      if (!res.ok) throw new Error("Failed to load groups");
      const d = await res.json();
      setGroups(d.groups ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
    fetch("/api/admin/members")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMembers(d.members ?? []))
      .catch(() => {});
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...empty });
    setFormOpen(true);
  }
  function openEdit(g: Group) {
    setEditing(g);
    setForm({
      name: g.name ?? "",
      description: g.description ?? "",
      category: g.category ?? "",
      meeting_day: g.meeting_day ?? "",
      meeting_time: g.meeting_time ?? "",
      location: g.location ?? "",
      capacity: g.capacity != null ? String(g.capacity) : "",
      is_open: g.is_open,
      is_active: g.is_active,
    });
    setFormOpen(true);
  }

  async function saveGroup() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/admin/groups/${editing.id}` : "/api/admin/groups";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          capacity: form.capacity === "" ? null : Number(form.capacity),
        }),
      });
      if (res.ok) {
        setFormOpen(false);
        await loadGroups();
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/groups/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteTarget(null);
      await loadGroups();
    }
  }

  async function openRoster(g: Group) {
    setRosterGroup(g);
    setRosterLoading(true);
    setAddQuery("");
    try {
      const res = await fetch(`/api/admin/groups/${g.id}/members`);
      if (res.ok) {
        const d = await res.json();
        setRoster(d.members ?? []);
      }
    } finally {
      setRosterLoading(false);
    }
  }
  async function refreshRoster() {
    if (!rosterGroup) return;
    const res = await fetch(`/api/admin/groups/${rosterGroup.id}/members`);
    if (res.ok) setRoster((await res.json()).members ?? []);
    loadGroups();
  }
  async function rosterAction(method: string, body: Record<string, unknown>) {
    if (!rosterGroup) return;
    await fetch(`/api/admin/groups/${rosterGroup.id}/members`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await refreshRoster();
  }

  const rosterIds = useMemo(() => new Set(roster.map((r) => r.profile_id)), [roster]);
  const addCandidates = useMemo(() => {
    const q = addQuery.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter((m) => !rosterIds.has(m.id))
      .filter((m) => `${m.first_name} ${m.last_name}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [addQuery, members, rosterIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Groups"
        description="Small groups and discipleship — rosters, leaders, and sign-ups."
        action={
          <Button onClick={openCreate} className="bg-purple-700 hover:bg-purple-600 text-white">
            <Plus className="mr-2 h-4 w-4" /> New Group
          </Button>
        }
      />

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <UsersRound className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-lg">No groups yet.</p>
          <p className="text-sm mt-1">Create your first small group to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Card key={g.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-warm-800">{g.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {g.category && <Badge className="bg-warm-100 text-warm-700">{g.category}</Badge>}
                    {!g.is_active && <Badge className="bg-warm-200 text-warm-600">Inactive</Badge>}
                    {!g.is_open && <Badge className="bg-amber-100 text-amber-700">Approval</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-warm-500 shrink-0">
                  <UsersRound className="h-4 w-4" /> {g.member_count}
                  {g.capacity != null && `/${g.capacity}`}
                </div>
              </div>

              <div className="text-sm text-warm-500 space-y-0.5">
                {(g.meeting_day || g.meeting_time) && (
                  <p>{[g.meeting_day, g.meeting_time].filter(Boolean).join(" · ")}</p>
                )}
                {g.location && <p>{g.location}</p>}
                {g.leader_name && <p className="flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-gold-500" />{g.leader_name}</p>}
                {g.pending_count > 0 && (
                  <p className="text-amber-600 font-medium">{g.pending_count} pending request{g.pending_count !== 1 ? "s" : ""}</p>
                )}
              </div>

              <div className="mt-auto flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openRoster(g)}>
                  <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Roster
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(g)} aria-label={`Edit ${g.name}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(g)} aria-label={`Delete ${g.name}`} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Group" : "New Group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-warm-700">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Men's Bible Study" />
            </div>
            <div>
              <label className="text-sm font-medium text-warm-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm"
                placeholder="What is this group about?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-warm-700">Category</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Bible Study" />
              </div>
              <div>
                <label className="text-sm font-medium text-warm-700">Capacity</label>
                <Input type="number" min={0} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Optional" />
              </div>
              <div>
                <label className="text-sm font-medium text-warm-700">Meeting day</label>
                <Input value={form.meeting_day} onChange={(e) => setForm({ ...form, meeting_day: e.target.value })} placeholder="Wednesdays" />
              </div>
              <div>
                <label className="text-sm font-medium text-warm-700">Meeting time</label>
                <Input value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} placeholder="7:00 PM" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-warm-700">Location</label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Fellowship Hall" />
            </div>
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm text-warm-700">
                <input type="checkbox" checked={form.is_open} onChange={(e) => setForm({ ...form, is_open: e.target.checked })} />
                Open to self-signup
              </label>
              <label className="flex items-center gap-2 text-sm text-warm-700">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={saveGroup} disabled={saving || !form.name.trim()} className="bg-purple-700 hover:bg-purple-600 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete group?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-warm-600">
            Delete <span className="font-semibold">{deleteTarget?.name}</span>? Its roster will be removed. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Roster manager */}
      <Dialog open={!!rosterGroup} onOpenChange={(o) => !o && setRosterGroup(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{rosterGroup?.name} — Roster</DialogTitle>
          </DialogHeader>

          {/* Add member */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
            <Input className="pl-9" placeholder="Add a member by name…" value={addQuery} onChange={(e) => setAddQuery(e.target.value)} />
            {addCandidates.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-warm-200 bg-white shadow-lg">
                {addCandidates.map((m) => (
                  <button
                    key={m.id}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-warm-50"
                    onClick={() => { rosterAction("POST", { profile_id: m.id }); setAddQuery(""); }}
                  >
                    <span>{m.first_name} {m.last_name}</span>
                    <Plus className="h-4 w-4 text-purple-600" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1">
            {rosterLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-purple-600" /></div>
            ) : roster.length === 0 ? (
              <p className="text-sm text-warm-400 text-center py-8">No members yet.</p>
            ) : (
              roster.map((r) => (
                <div key={r.profile_id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-warm-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-warm-800 flex items-center gap-1.5">
                      {r.role === "leader" && <Crown className="h-3.5 w-3.5 text-gold-500" />}
                      {r.profiles?.first_name} {r.profiles?.last_name}
                    </p>
                    {r.status === "pending" && <span className="text-xs text-amber-600">Pending request</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {r.status === "pending" && (
                      <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => rosterAction("PATCH", { profile_id: r.profile_id, status: "approved" })} aria-label="Approve">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {r.status === "approved" && (
                      <Button size="sm" variant="ghost" onClick={() => rosterAction("PATCH", { profile_id: r.profile_id, role: r.role === "leader" ? "member" : "leader" })} aria-label="Toggle leader" title={r.role === "leader" ? "Make member" : "Make leader"}>
                        <Crown className={`h-4 w-4 ${r.role === "leader" ? "text-gold-500" : "text-warm-400"}`} />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => rosterAction("DELETE", { profile_id: r.profile_id })} aria-label="Remove">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRosterGroup(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
