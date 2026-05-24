"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FadeIn } from "@/components/motion/fade-in";
import type { Ward, Profile, Deacon } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  UserPlus,
  X,
  Users,
  Search,
  Loader2,
} from "lucide-react";

/**
 * NOTE: Ward/member assignments use `ward_id` on the profile object.
 * When Supabase is connected, both this Wards page and the Members page
 * read/write to the same `profiles` table (profiles.ward_id column).
 * Assigning a member to a ward here or from the Members admin page will
 * update the same underlying data, keeping both views in sync.
 */

// ── Helpers ──────────────────────────────────────────────────────────

function getDeaconsForWard(wardId: string, allWards: Ward[], deacons: Deacon[]): Deacon[] {
  const ward = allWards.find((w) => w.id === wardId);
  return deacons.filter((d) => {
    if (d.ward_id === wardId) return true;
    if (d.ward_name && ward) return d.ward_name.includes(ward.name);
    return false;
  });
}

function formatDeaconName(d: Deacon): string {
  const prefix = d.title ? `${d.title} ` : "";
  return `${prefix}${d.first_name} ${d.last_name}`;
}

function getDeaconDisplayForWard(wardId: string, allWards: Ward[], deacons: Deacon[]): string {
  const matched = getDeaconsForWard(wardId, allWards, deacons);
  if (matched.length === 0) return "Unassigned";
  return matched.map(formatDeaconName).join(", ");
}

// ── Page Component ───────────────────────────────────────────────────

export default function WardManagementPage() {
  // Data state
  const [wards, setWards] = useState<Ward[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [deacons, setDeacons] = useState<Deacon[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [expandedWardId, setExpandedWardId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog state for assign member
  const [assignDialogWardId, setAssignDialogWardId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  // Dialog state for edit ward
  const [editDialogWard, setEditDialogWard] = useState<Ward | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Dialog state for delete ward
  const [deleteDialogWard, setDeleteDialogWard] = useState<Ward | null>(null);

  // Dialog state for assign deacon
  const [deaconDialogWardId, setDeaconDialogWardId] = useState<string | null>(null);
  const [selectedDeaconId, setSelectedDeaconId] = useState<string>("");

  // Dialog state for create ward
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");

  // ── Data fetching ─────────────────────────────────────────────────
  async function loadData() {
    try {
      const [wardsRes, membersRes, deaconsRes] = await Promise.all([
        fetch("/api/admin/wards"),
        fetch("/api/admin/members"),
        fetch("/api/admin/deacons"),
      ]);

      if (wardsRes.ok) {
        const data = await wardsRes.json();
        setWards(data.wards ?? []);
      }
      if (membersRes.ok) {
        const data = await membersRes.json();
        setProfiles(data.members ?? []);
      }
      if (deaconsRes.ok) {
        const data = await deaconsRes.json();
        setDeacons(data.deacons ?? []);
      }
    } catch (err) {
      console.error("Failed to load wards data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ── Computed data ──────────────────────────────────────────────────

  function getMembersForWard(wardId: string): Profile[] {
    return profiles.filter((p) => p.ward_id === wardId);
  }

  function getUnassignedProfiles(): Profile[] {
    return profiles.filter((p) => !p.ward_id);
  }

  const filteredWards = wards.filter((w) => {
    if (!searchTerm) return true;
    return w.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ── Actions ────────────────────────────────────────────────────────

  function handleToggleExpand(wardId: string) {
    setExpandedWardId((prev) => (prev === wardId ? null : wardId));
  }

  async function handleAssignMember() {
    if (!assignDialogWardId || !selectedProfileId) return;
    // Update profile ward_id via the members API
    const res = await fetch("/api/admin/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedProfileId, ward_id: assignDialogWardId }),
    });
    if (res.ok) {
      loadData();
    }
    setAssignDialogWardId(null);
    setSelectedProfileId("");
  }

  async function handleRemoveMember(profileId: string) {
    const res = await fetch("/api/admin/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: profileId, ward_id: null }),
    });
    if (res.ok) {
      loadData();
    }
  }

  function handleOpenEdit(ward: Ward) {
    setEditDialogWard(ward);
    setEditName(ward.name);
    setEditDescription(ward.description ?? "");
  }

  async function handleSaveEdit() {
    if (!editDialogWard) return;
    const res = await fetch("/api/admin/wards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editDialogWard.id,
        name: editName,
        description: editDescription,
      }),
    });
    if (res.ok) {
      loadData();
    }
    setEditDialogWard(null);
  }

  async function handleDeleteWard() {
    if (!deleteDialogWard) return;
    const res = await fetch("/api/admin/wards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteDialogWard.id }),
    });
    if (res.ok) {
      loadData();
    }
    if (expandedWardId === deleteDialogWard.id) setExpandedWardId(null);
    setDeleteDialogWard(null);
  }

  async function handleAssignDeacon() {
    if (!deaconDialogWardId || !selectedDeaconId) return;
    const res = await fetch("/api/admin/wards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deaconDialogWardId, deacon_id: selectedDeaconId }),
    });
    if (res.ok) {
      loadData();
    }
    setDeaconDialogWardId(null);
    setSelectedDeaconId("");
  }

  async function handleCreateWard() {
    if (!createName.trim()) return;
    const res = await fetch("/api/admin/wards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
      }),
    });
    if (res.ok) {
      loadData();
    }
    setCreateName("");
    setCreateDescription("");
    setCreateDialogOpen(false);
  }

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Wards"
        description={`${wards.length} ward${wards.length !== 1 ? "s" : ""} — Manage ward assignments`}
        action={
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-purple-700 hover:bg-purple-600 text-white"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create Ward
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
        <Input
          placeholder="Search wards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Ward Table */}
      <FadeIn>
        <div className="rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-warm-50 dark:bg-warm-900">
                <TableHead className="w-10" />
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Description</TableHead>
                <TableHead className="font-medium">Deacon(s)</TableHead>
                <TableHead className="font-medium">Families</TableHead>
                <TableHead className="font-medium">Members</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-warm-400">
                    {searchTerm ? "No wards match your search" : "No wards found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredWards.map((ward) => {
                  const isExpanded = expandedWardId === ward.id;
                  const members = getMembersForWard(ward.id);
                  return (
                    <WardRow
                      key={ward.id}
                      ward={ward}
                      allWards={wards}
                      isExpanded={isExpanded}
                      members={members}
                      deacons={deacons}
                      onToggleExpand={() => handleToggleExpand(ward.id)}
                      onEdit={() => handleOpenEdit(ward)}
                      onDelete={() => setDeleteDialogWard(ward)}
                      onAssignMember={() => {
                        setAssignDialogWardId(ward.id);
                        setSelectedProfileId("");
                      }}
                      onRemoveMember={handleRemoveMember}
                      onChangeDeacon={() => {
                        setDeaconDialogWardId(ward.id);
                        setSelectedDeaconId(ward.deacon_id ?? "");
                      }}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </FadeIn>

      {/* ── Create Ward Dialog ──────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Create Ward</DialogTitle>
            <DialogDescription>Add a new ward to the church.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateWard();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                placeholder="Ward name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-desc">Description</Label>
              <Textarea
                id="create-desc"
                placeholder="Ward description"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
              disabled={!createName.trim()}
            >
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Assign Member Dialog ────────────────────────────────────── */}
      <Dialog
        open={!!assignDialogWardId}
        onOpenChange={(open) => {
          if (!open) {
            setAssignDialogWardId(null);
            setSelectedProfileId("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Assign Member</DialogTitle>
            <DialogDescription>
              Select a member to assign to{" "}
              {wards.find((w) => w.id === assignDialogWardId)?.name ?? "this ward"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member..." />
              </SelectTrigger>
              <SelectContent>
                {getUnassignedProfiles().length === 0 ? (
                  <div className="px-3 py-2 text-sm text-warm-400">
                    No unassigned members
                  </div>
                ) : (
                  getUnassignedProfiles().map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAssignDialogWardId(null);
                  setSelectedProfileId("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignMember}
                className="bg-purple-700 hover:bg-purple-600 text-white"
                disabled={!selectedProfileId}
              >
                Assign
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Ward Dialog ────────────────────────────────────────── */}
      <Dialog
        open={!!editDialogWard}
        onOpenChange={(open) => {
          if (!open) setEditDialogWard(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Edit Ward</DialogTitle>
            <DialogDescription>Update the ward name and description.</DialogDescription>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditDialogWard(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-700 hover:bg-purple-600 text-white"
                disabled={!editName.trim()}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Ward Confirmation Dialog ─────────────────────────── */}
      <Dialog
        open={!!deleteDialogWard}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogWard(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Delete Ward</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteDialogWard?.name}</span>? All
              members will be unassigned. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogWard(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWard}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Deacon Dialog ─────────────────────────────────────── */}
      <Dialog
        open={!!deaconDialogWardId}
        onOpenChange={(open) => {
          if (!open) {
            setDeaconDialogWardId(null);
            setSelectedDeaconId("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Assign Deacon</DialogTitle>
            <DialogDescription>
              Select a deacon for{" "}
              {wards.find((w) => w.id === deaconDialogWardId)?.name ?? "this ward"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedDeaconId} onValueChange={setSelectedDeaconId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a deacon..." />
              </SelectTrigger>
              <SelectContent>
                {deacons.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {formatDeaconName(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeaconDialogWardId(null);
                  setSelectedDeaconId("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignDeacon}
                className="bg-purple-700 hover:bg-purple-600 text-white"
                disabled={!selectedDeaconId}
              >
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Ward Row Sub-component ───────────────────────────────────────────

interface WardRowProps {
  ward: Ward;
  allWards: Ward[];
  isExpanded: boolean;
  members: Profile[];
  deacons: Deacon[];
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssignMember: () => void;
  onRemoveMember: (profileId: string) => void;
  onChangeDeacon: () => void;
}

function WardRow({
  ward,
  allWards,
  isExpanded,
  members,
  deacons,
  onToggleExpand,
  onEdit,
  onDelete,
  onAssignMember,
  onRemoveMember,
  onChangeDeacon,
}: WardRowProps) {
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
            {ward.name}
          </span>
        </TableCell>
        <TableCell className="text-warm-600 dark:text-warm-400">
          {ward.description ?? "—"}
        </TableCell>
        <TableCell>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChangeDeacon();
            }}
            className="text-left hover:underline text-purple-700 dark:text-purple-400 text-sm"
            title="Change deacon assignment"
          >
            {getDeaconDisplayForWard(ward.id, allWards, deacons)}
          </button>
        </TableCell>
        <TableCell>{ward.families_count ?? 0}</TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0"
          >
            <Users className="h-3 w-3 mr-1" />
            {members.length}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-700"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit ward"
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
              title="Delete ward"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded detail row */}
      {isExpanded && (
        <TableRow className="bg-purple-50/50 dark:bg-purple-900/10">
          <TableCell colSpan={7} className="p-0">
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-warm-700 dark:text-warm-300">
                  Members in {ward.name}
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300"
                  onClick={onAssignMember}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Assign Member
                </Button>
              </div>

              {members.length === 0 ? (
                <p className="text-sm text-warm-400 italic py-2">
                  No members assigned to this ward yet.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 px-4 py-3 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-50">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-warm-500">{member.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 shrink-0"
                        onClick={() => onRemoveMember(member.id)}
                        title={`Remove ${member.first_name} from ward`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
