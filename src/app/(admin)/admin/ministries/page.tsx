"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormDialog } from "@/components/admin/form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FadeIn } from "@/components/motion/fade-in";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

interface Ministry {
  id: string;
  name: string;
  description: string | null;
  schedule: string | null;
  is_active: boolean;
}

interface MinistryMemberProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
}

interface MinistryMember {
  profile_id: string;
  role: string;
  status: string;
  profiles: MinistryMemberProfile;
}

// ── Page Component ────────────────────────────────────────────────────

export default function MinistryManagementPage() {
  // Data state
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<MinistryMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Create dialog state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSchedule, setFormSchedule] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Edit dialog state
  const [editMinistry, setEditMinistry] = useState<Ministry | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  // Delete dialog state
  const [deleteMinistry, setDeleteMinistry] = useState<Ministry | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────

  const loadMinistries = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ministries");
      const data = await res.json();
      setMinistries(data.ministries ?? []);
    } catch (err) {
      console.error("Failed to load ministries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMinistries();
  }, [loadMinistries]);

  async function loadMembers(ministryId: string) {
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/admin/ministries/${ministryId}/members`);
      if (res.ok) {
        const data = await res.json();
        setExpandedMembers(data.members ?? []);
      } else {
        setExpandedMembers([]);
      }
    } catch (err) {
      console.error("Failed to load ministry members:", err);
      setExpandedMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }

  // ── Computed ───────────────────────────────────────────────────────

  const filteredMinistries = ministries.filter((m) => {
    if (!searchTerm) return true;
    return m.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ── Actions ────────────────────────────────────────────────────────

  function handleToggleExpand(ministryId: string) {
    if (expandedId === ministryId) {
      setExpandedId(null);
      setExpandedMembers([]);
    } else {
      setExpandedId(ministryId);
      loadMembers(ministryId);
    }
  }

  async function handleSaveMinistry(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ministries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          schedule: formSchedule.trim() || undefined,
          is_active: formActive,
        }),
      });
      if (res.ok) {
        setFormName("");
        setFormDescription("");
        setFormSchedule("");
        setFormActive(true);
        setDialogOpen(false);
        await loadMinistries();
      }
    } catch (err) {
      console.error("Failed to save ministry:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleOpenEdit(ministry: Ministry) {
    setEditMinistry(ministry);
    setEditName(ministry.name);
    setEditDescription(ministry.description ?? "");
    setEditSchedule(ministry.schedule ?? "");
    setEditActive(ministry.is_active);
  }

  async function handleSaveEdit() {
    if (!editMinistry || !editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/admin/ministries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editMinistry.id,
          name: editName.trim(),
          description: editDescription.trim() || null,
          schedule: editSchedule.trim() || null,
          is_active: editActive,
        }),
      });
      if (res.ok) {
        setEditMinistry(null);
        await loadMinistries();
      }
    } catch (err) {
      console.error("Failed to update ministry:", err);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteMinistry) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/ministries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteMinistry.id }),
      });
      if (res.ok) {
        if (expandedId === deleteMinistry.id) {
          setExpandedId(null);
          setExpandedMembers([]);
        }
        setDeleteMinistry(null);
        await loadMinistries();
      }
    } catch (err) {
      console.error("Failed to delete ministry:", err);
    } finally {
      setDeleting(false);
    }
  }

  // ── Loading state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Ministries"
        description={`${ministries.length} ministr${ministries.length !== 1 ? "ies" : "y"} — Manage church ministries`}
        action={
          <FormDialog
            title="Add Ministry"
            triggerLabel="Add Ministry"
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          >
            <form className="space-y-4" onSubmit={handleSaveMinistry}>
              <div className="space-y-2">
                <Label htmlFor="ministry_name">Name</Label>
                <Input
                  id="ministry_name"
                  placeholder="Ministry name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ministry_description">Description</Label>
                <Textarea
                  id="ministry_description"
                  placeholder="Describe this ministry..."
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ministry_schedule">Schedule</Label>
                <Input
                  id="ministry_schedule"
                  placeholder="e.g. Meets every Thursday at 7:00 PM"
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-warm-200 p-3 dark:border-warm-700">
                <div>
                  <Label htmlFor="ministry_active" className="text-sm font-medium">
                    Active
                  </Label>
                  <p className="text-xs text-warm-500">
                    Ministry is visible to members
                  </p>
                </div>
                <Switch
                  id="ministry_active"
                  checked={formActive}
                  onCheckedChange={setFormActive}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-600 text-white"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Ministry"}
              </Button>
            </form>
          </FormDialog>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
        <Input
          placeholder="Search ministries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Ministry Table */}
      <FadeIn>
        <div className="rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-warm-50 dark:bg-warm-900">
                <TableHead className="w-10" />
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Description</TableHead>
                <TableHead className="font-medium">Schedule</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMinistries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-warm-400">
                    {searchTerm ? "No ministries match your search" : "No ministries found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMinistries.map((ministry) => {
                  const isExpanded = expandedId === ministry.id;
                  return (
                    <MinistryRow
                      key={ministry.id}
                      ministry={ministry}
                      isExpanded={isExpanded}
                      members={isExpanded ? expandedMembers : []}
                      membersLoading={isExpanded && membersLoading}
                      onToggleExpand={() => handleToggleExpand(ministry.id)}
                      onEdit={() => handleOpenEdit(ministry)}
                      onDelete={() => setDeleteMinistry(ministry)}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </FadeIn>

      {/* ── Edit Ministry Dialog ──────────────────────────────────────── */}
      <Dialog
        open={!!editMinistry}
        onOpenChange={(open) => {
          if (!open) setEditMinistry(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Edit Ministry</DialogTitle>
            <DialogDescription>Update ministry details.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-schedule">Schedule</Label>
              <Input
                id="edit-schedule"
                value={editSchedule}
                onChange={(e) => setEditSchedule(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-warm-200 p-3 dark:border-warm-700">
              <div>
                <Label htmlFor="edit-active" className="text-sm font-medium">
                  Active
                </Label>
                <p className="text-xs text-warm-500">
                  Ministry is visible to members
                </p>
              </div>
              <Switch
                id="edit-active"
                checked={editActive}
                onCheckedChange={setEditActive}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditMinistry(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-700 hover:bg-purple-600 text-white"
                disabled={!editName.trim() || editSaving}
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Ministry Confirmation Dialog ────────────────────────── */}
      <Dialog
        open={!!deleteMinistry}
        onOpenChange={(open) => {
          if (!open) setDeleteMinistry(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Delete Ministry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteMinistry?.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMinistry(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Ministry Row Sub-component ──────────────────────────────────────

interface MinistryRowProps {
  ministry: Ministry;
  isExpanded: boolean;
  members: MinistryMember[];
  membersLoading: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MinistryRow({
  ministry,
  isExpanded,
  members,
  membersLoading,
  onToggleExpand,
  onEdit,
  onDelete,
}: MinistryRowProps) {
  return (
    <>
      {/* Main row */}
      <TableRow
        className="cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
        onClick={onToggleExpand}
      >
        <TableCell className="w-10">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-purple-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-warm-400" />
          )}
        </TableCell>
        <TableCell>
          <span className="font-medium text-warm-900 dark:text-warm-50">
            {ministry.name}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm text-warm-500 line-clamp-1 max-w-xs">
            {ministry.description ?? "—"}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm text-warm-600 dark:text-warm-300">
            {ministry.schedule ?? "—"}
          </span>
        </TableCell>
        <TableCell>
          {ministry.is_active ? (
            <Badge
              variant="outline"
              className="border-0 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
            >
              Active
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-0 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
            >
              Inactive
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Link href={`/admin/ministries/${ministry.id}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-700"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit ministry"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete ministry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded member list */}
      {isExpanded && (
        <TableRow className="bg-purple-50/50 dark:bg-purple-900/10">
          <TableCell colSpan={6} className="p-0">
            <div className="px-6 py-4 space-y-3">
              <h4 className="text-sm font-semibold text-warm-700 dark:text-warm-300">
                Members in {ministry.name}
              </h4>

              {membersLoading ? (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm text-warm-500">Loading members...</span>
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-warm-400 italic py-2">
                  No members in this ministry yet.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member) => {
                    const profile = member.profiles;
                    const initials =
                      (profile.first_name?.[0] ?? "") +
                      (profile.last_name?.[0] ?? "");
                    return (
                      <div
                        key={member.profile_id}
                        className="flex items-center gap-3 rounded-xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 px-4 py-3 shadow-sm"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage
                            src={profile.photo_url ?? undefined}
                            alt={`${profile.first_name} ${profile.last_name}`}
                          />
                          <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-medium dark:bg-purple-900/40 dark:text-purple-300">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-warm-900 dark:text-warm-50 truncate">
                            {profile.first_name} {profile.last_name}
                          </p>
                          {member.role && (
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                              {member.role}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
