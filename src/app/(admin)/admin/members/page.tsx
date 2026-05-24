"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { formatDate } from "@/lib/utils";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";
import type { UserRole, Ward, Deacon } from "@/types";

// ── Types ────────────────────────────────────────────────────────────
interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  photo_url?: string;
  created_at: string;
  ward_id?: string;
}

// ── Constants ────────────────────────────────────────────────────────
const ROLE_LABELS: Record<UserRole, string> = {
  member: "Member",
  deacon: "Deacon",
  minister: "Minister",
  musician: "Musician",
  admin: "Admin",
  super_admin: "Super Admin",
};

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  member:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  deacon:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  minister:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  musician:
    "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  admin: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  super_admin:
    "bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-200",
};

const ALL_ROLES: UserRole[] = [
  "member",
  "deacon",
  "minister",
  "musician",
  "admin",
  "super_admin",
];

const PAGE_SIZE = 10;

/**
 * NOTE: Ward and deacon assignments are stored on the profile via `ward_id`.
 * When Supabase is connected, both this Members page and the Wards page
 * read/write to the same `profiles` table (profiles.ward_id column).
 * This ensures ward assignment stays in sync across both admin views.
 */

// ── Page Component ───────────────────────────────────────────────────
export default function MemberManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [deacons, setDeacons] = useState<Deacon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Edit member dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editWardId, setEditWardId] = useState("");
  const [editDeaconId, setEditDeaconId] = useState("");

  // ── Fetch data from API ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [membersRes, wardsRes, deaconsRes] = await Promise.all([
        fetch("/api/admin/members"),
        fetch("/api/admin/wards"),
        fetch("/api/admin/deacons"),
      ]);

      if (!membersRes.ok) {
        const data = await membersRes.json();
        throw new Error(data.error || "Failed to fetch members");
      }
      const membersData = await membersRes.json();
      setMembers(membersData.members);

      if (wardsRes.ok) {
        const wardsData = await wardsRes.json();
        setWards(wardsData.wards ?? []);
      }

      if (deaconsRes.ok) {
        const deaconsData = await deaconsRes.json();
        setDeacons(deaconsData.deacons ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Auto-dismiss toast ───────────────────────────────────────────
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── Change role ──────────────────────────────────────────────────
  async function handleRoleChange(memberId: string, newRole: UserRole) {
    setUpdatingId(memberId);
    setToast(null);

    try {
      const res = await fetch(`/api/admin/members/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ type: "error", message: data.error || "Failed to update role" });
        return;
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );

      const member = members.find((m) => m.id === memberId);
      setToast({
        type: "success",
        message: `${member?.first_name} ${member?.last_name} is now ${ROLE_LABELS[newRole]}.`,
      });
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Ward/Deacon helpers ──────────────────────────────────────────
  function getWardForMember(memberId: string): Ward | undefined {
    const member = members.find((m) => m.id === memberId);
    if (member?.ward_id) {
      return wards.find((w) => w.id === member.ward_id);
    }
    return undefined;
  }

  function getDeaconForMember(memberId: string): Deacon | undefined {
    const ward = getWardForMember(memberId);
    if (!ward) return undefined;
    return deacons.find((d) => d.ward_id === ward.id);
  }

  // ── Edit member ward/deacon ──────────────────────────────────────
  function openEditMemberDialog(member: Member) {
    setEditingMember(member);
    setEditWardId(member.ward_id ?? "");
    // Find deacon for current ward
    const ward = member.ward_id
      ? wards.find((w) => w.id === member.ward_id)
      : undefined;
    const deacon = ward
      ? deacons.find((d) => d.ward_id === ward.id)
      : undefined;
    setEditDeaconId(deacon?.id ?? "");
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingMember) return;

    // Normalize sentinel value to empty for "unassigned"
    const wardValue = editWardId === "__none__" ? "" : editWardId;

    // Update via API
    const res = await fetch("/api/admin/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingMember.id, ward_id: wardValue || null }),
    });

    if (res.ok) {
      // Update local state
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? { ...m, ward_id: wardValue || undefined }
            : m
        )
      );

      setToast({
        type: "success",
        message: `${editingMember.first_name} ${editingMember.last_name} ward assignment updated.`,
      });
    } else {
      setToast({ type: "error", message: "Failed to update ward assignment." });
    }

    setEditOpen(false);
    setEditingMember(null);
  }

  // When ward changes in edit dialog, auto-select the deacon for that ward
  function handleEditWardChange(wardId: string) {
    setEditWardId(wardId);
    if (wardId && wardId !== "__none__") {
      const deacon = deacons.find((d) => d.ward_id === wardId);
      setEditDeaconId(deacon?.id ?? "");
    } else {
      setEditDeaconId("");
    }
  }

  // ── Delete member ────────────────────────────────────────────────
  async function handleDeleteMember(member: Member) {
    if (!confirm(`Are you sure you want to remove ${member.first_name} ${member.last_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id }),
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        setToast({
          type: "success",
          message: `${member.first_name} ${member.last_name} has been removed.`,
        });
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Failed to delete member." });
      }
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    }
  }

  // ── Filter + paginate ────────────────────────────────────────────
  const filtered = members.filter((m) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      m.first_name.toLowerCase().includes(term) ||
      m.last_name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.role.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Members"
          description="Manage church membership"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-warm-500">Loading members...</span>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Members"
          description="Manage church membership"
        />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <p className="text-warm-700 font-medium mb-2">
            Could not load members
          </p>
          <p className="text-warm-500 text-sm mb-4">{error}</p>
          <Button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Members"
        description={`${members.length} registered member${members.length !== 1 ? "s" : ""}`}
      />

      {/* Toast notification */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
          <Input
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          title="Refresh member list"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <FadeIn>
        <div className="rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-warm-50 dark:bg-warm-900">
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Role</TableHead>
                <TableHead className="font-medium">Ward</TableHead>
                <TableHead className="font-medium">Deacon</TableHead>
                <TableHead className="font-medium">Phone</TableHead>
                <TableHead className="font-medium">Member Since</TableHead>
                <TableHead className="font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-warm-400"
                  >
                    {search ? "No members match your search" : "No members found"}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((member) => {
                  const ward = getWardForMember(member.id);
                  const deacon = getDeaconForMember(member.id);

                  return (
                    <TableRow key={member.id}>
                      {/* Name */}
                      <TableCell>
                        <span className="font-medium text-warm-900 dark:text-warm-50">
                          {member.first_name} {member.last_name}
                        </span>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-warm-600 dark:text-warm-400">
                        {member.email}
                      </TableCell>

                      {/* Role — inline editable */}
                      <TableCell>
                        {updatingId === member.id ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            <span className="text-sm text-warm-500">
                              Updating...
                            </span>
                          </div>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              handleRoleChange(member.id, value as UserRole)
                            }
                          >
                            <SelectTrigger className="w-[145px] h-8 border-0 bg-transparent hover:bg-warm-50 dark:hover:bg-warm-800 focus:ring-1 focus:ring-purple-500 p-0 pl-1">
                              <Badge
                                variant="outline"
                                className={`border-0 cursor-pointer ${
                                  ROLE_BADGE_COLORS[member.role] ?? ""
                                }`}
                              >
                                {ROLE_LABELS[member.role] ?? member.role}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  <span className="flex items-center gap-2">
                                    <span
                                      className={`inline-block h-2 w-2 rounded-full ${
                                        ROLE_BADGE_COLORS[r]
                                          ?.split(" ")[0]
                                          ?.replace("text-", "bg-") ??
                                        "bg-warm-300"
                                      }`}
                                    />
                                    {ROLE_LABELS[r]}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>

                      {/* Ward */}
                      <TableCell>
                        {ward ? (
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0"
                          >
                            {ward.name}
                          </Badge>
                        ) : (
                          <span className="text-warm-400 text-sm">Unassigned</span>
                        )}
                      </TableCell>

                      {/* Deacon */}
                      <TableCell>
                        {deacon ? (
                          <span className="text-sm text-warm-700 dark:text-warm-300">
                            {deacon.title ? `${deacon.title} ` : ""}
                            {deacon.first_name} {deacon.last_name}
                          </span>
                        ) : (
                          <span className="text-warm-400 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-warm-600 dark:text-warm-400">
                        {member.phone || "—"}
                      </TableCell>

                      {/* Member Since */}
                      <TableCell>
                        <span className="text-sm text-warm-500">
                          {formatDate(member.created_at)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditMemberDialog(member)}
                            className="h-8 w-8 p-0 text-warm-500 hover:text-purple-700 hover:bg-purple-50"
                            title="Edit ward/deacon assignment"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMember(member)}
                            className="h-8 w-8 p-0 text-warm-400 hover:text-red-600 hover:bg-red-50"
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </FadeIn>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-warm-500">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Edit Ward/Deacon Assignment Dialog ──────────────────────── */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingMember(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Edit Ward Assignment
            </DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4">
              <p className="text-sm text-warm-600">
                Assign <span className="font-medium">{editingMember.first_name} {editingMember.last_name}</span> to a ward and deacon.
              </p>

              <div className="space-y-2">
                <Label htmlFor="edit-ward">Ward</Label>
                <Select value={editWardId} onValueChange={handleEditWardChange}>
                  <SelectTrigger id="edit-ward">
                    <SelectValue placeholder="Select a ward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-warm-400">Unassigned</span>
                    </SelectItem>
                    {wards.map((ward) => (
                      <SelectItem key={ward.id} value={ward.id}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-deacon">Deacon</Label>
                <Select value={editDeaconId} onValueChange={setEditDeaconId}>
                  <SelectTrigger id="edit-deacon">
                    <SelectValue placeholder="Auto-assigned by ward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-warm-400">None</span>
                    </SelectItem>
                    {deacons.filter((d) => d.is_active).map((deacon) => (
                      <SelectItem key={deacon.id} value={deacon.id}>
                        {deacon.title ? `${deacon.title} ` : ""}
                        {deacon.first_name} {deacon.last_name}
                        {deacon.ward_name ? ` (${deacon.ward_name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-warm-400">
                  Deacon is auto-selected when ward changes. Override manually if needed.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-purple-700 hover:bg-purple-600 text-white"
                >
                  Save Assignment
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
