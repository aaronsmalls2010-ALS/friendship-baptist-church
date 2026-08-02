"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Download,
  Tags as TagsIcon,
  Plus,
  X,
  Archive,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserRole, Ward, Deacon } from "@/types";

// ── Types ────────────────────────────────────────────────────────────
interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  roles?: UserRole[];
  photo_url?: string;
  created_at: string;
  ward_id?: string;
  is_approved?: boolean;
  status?: string;
  membership_type?: string;
  membership_date?: string;
  how_joined?: string;
  marital_status?: string;
  occupation?: string;
  families?: { id: string; name: string }[];
  ministries?: { id: string; name: string }[];
  tags?: { id: string; name: string; color?: string | null }[];
}

interface FamilyOption {
  id: string;
  name: string;
}

interface MinistryOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
  color?: string | null;
  member_count?: number;
}

// ── Constants ────────────────────────────────────────────────────────
const ROLE_LABELS: Record<UserRole, string> = {
  member: "Member",
  deacon: "Deacon",
  minister: "Minister",
  musician: "Musician",
  finance: "Finance",
  pastor: "Pastor",
  admin: "Admin",
  super_admin: "Super Admin",
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  member:      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  deacon:      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  minister:    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  musician:    "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  finance:     "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  pastor:      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  admin:       "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  super_admin: "bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-200",
};

const ALL_ROLES: UserRole[] = [
  "member",
  "deacon",
  "minister",
  "musician",
  "finance",
  "pastor",
  "admin",
  "super_admin",
] as UserRole[];

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
  const [allFamilies, setAllFamilies] = useState<FamilyOption[]>([]);
  const [allMinistries, setAllMinistries] = useState<MinistryOption[]>([]);
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [page, setPage] = useState(0);

  // Bulk selection + actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // Manage-tags dialog
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [creatingTag, setCreatingTag] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Delete confirmation dialog
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<Member | null>(null);

  // Tracks which member is currently being approved (disables its button)
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Edit member dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editWardId, setEditWardId] = useState("");
  const [editFamilyIds, setEditFamilyIds] = useState<string[]>([]);
  const [editMinistryIds, setEditMinistryIds] = useState<string[]>([]);
  const [editMembership, setEditMembership] = useState({
    membership_type: "",
    membership_date: "",
    how_joined: "",
    marital_status: "",
    occupation: "",
  });

  // Roles dialog state
  const [rolesOpen, setRolesOpen] = useState(false);
  const [rolesMember, setRolesMember] = useState<Member | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  // ── Fetch data from API ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [membersRes, wardsRes, deaconsRes, familiesRes, ministriesRes, tagsRes] = await Promise.all([
        fetch("/api/admin/members"),
        fetch("/api/admin/wards"),
        fetch("/api/admin/deacons"),
        fetch("/api/admin/families"),
        fetch("/api/admin/ministries"),
        fetch("/api/admin/tags"),
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

      if (familiesRes.ok) {
        const familiesData = await familiesRes.json();
        setAllFamilies(
          (familiesData.families ?? []).map((f: FamilyOption) => ({
            id: f.id,
            name: f.name,
          }))
        );
      }

      if (ministriesRes.ok) {
        // The ministries LIST is fetched once to populate the edit dialog's
        // dropdown. Each member's actual ministry memberships now arrive on the
        // member objects from /api/admin/members (no per-ministry N+1 fetch).
        const ministriesData = await ministriesRes.json();
        setAllMinistries(
          (ministriesData.ministries ?? []).map((m: MinistryOption) => ({
            id: m.id,
            name: m.name,
          }))
        );
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAllTags(tagsData.tags ?? []);
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

  // ── Manage roles (multi) ─────────────────────────────────────────
  function memberRoles(m: Member): UserRole[] {
    return m.roles && m.roles.length ? m.roles : [m.role];
  }

  function openRolesDialog(member: Member) {
    setRolesMember(member);
    setSelectedRoles(memberRoles(member));
    setRolesOpen(true);
  }

  function toggleRole(role: UserRole, checked: boolean) {
    setSelectedRoles((prev) => {
      if (checked) return prev.includes(role) ? prev : [...prev, role];
      // "member" is the baseline and can't be removed
      if (role === "member") return prev;
      return prev.filter((r) => r !== role);
    });
  }

  async function handleSaveRoles() {
    if (!rolesMember) return;
    setSavingRoles(true);
    setToast(null);

    // Everyone keeps "member" as the baseline.
    const desired = Array.from(new Set<UserRole>(["member", ...selectedRoles]));

    try {
      const res = await fetch(`/api/admin/members/${rolesMember.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: desired }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({ type: "error", message: data.error || "Failed to update roles" });
        return;
      }

      const newRoles: UserRole[] = data.roles ?? desired;
      const newPrimary: UserRole = data.primaryRole ?? newRoles[0];
      setMembers((prev) =>
        prev.map((m) =>
          m.id === rolesMember.id
            ? { ...m, roles: newRoles, role: newPrimary }
            : m
        )
      );
      setToast({
        type: "success",
        message: `Updated roles for ${rolesMember.first_name} ${rolesMember.last_name}.`,
      });
      setRolesOpen(false);
      setRolesMember(null);
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSavingRoles(false);
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
    setEditFamilyIds((member.families ?? []).map((f) => f.id));
    setEditMinistryIds((member.ministries ?? []).map((m) => m.id));
    setEditMembership({
      membership_type: member.membership_type ?? "",
      membership_date: member.membership_date ?? "",
      how_joined: member.how_joined ?? "",
      marital_status: member.marital_status ?? "",
      occupation: member.occupation ?? "",
    });
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingMember) return;

    const wardValue = editWardId === "__none__" ? "" : editWardId;
    const currentMinistryIds = (editingMember.ministries ?? []).map((m) => m.id);

    // Update ward + families in parallel
    const [wardRes, famRes] = await Promise.all([
      fetch("/api/admin/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMember.id,
          ward_id: wardValue || null,
          membership_type: editMembership.membership_type || "member",
          membership_date: editMembership.membership_date || null,
          how_joined: editMembership.how_joined || null,
          marital_status: editMembership.marital_status || null,
          occupation: editMembership.occupation || null,
        }),
      }),
      fetch(`/api/admin/members/${editingMember.id}/families`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_ids: editFamilyIds }),
      }),
    ]);

    // Handle ministry changes — add new, remove old
    const toAdd = editMinistryIds.filter((id) => !currentMinistryIds.includes(id));
    const toRemove = currentMinistryIds.filter((id) => !editMinistryIds.includes(id));

    // Add member to new ministries
    await Promise.all(
      toAdd.map((ministryId) =>
        fetch(`/api/admin/ministries/${ministryId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_id: editingMember.id }),
        })
      )
    );

    // Remove member from old ministries
    for (const ministryId of toRemove) {
      try {
        const mRes = await fetch(`/api/admin/ministries/${ministryId}/members`);
        if (mRes.ok) {
          const mData = await mRes.json();
          const record = (mData.members ?? []).find(
            (m: { profile_id: string }) => m.profile_id === editingMember.id
          );
          if (record) {
            await fetch(`/api/admin/ministries/${ministryId}/members`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ member_id: record.id, action: "remove" }),
            });
          }
        }
      } catch { /* non-fatal */ }
    }

    if (wardRes.ok && famRes.ok) {
      const newFamilies = allFamilies.filter((f) => editFamilyIds.includes(f.id));
      const newMinistries = allMinistries.filter((m) => editMinistryIds.includes(m.id));
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? { ...m, ward_id: wardValue || undefined, families: newFamilies, ministries: newMinistries }
            : m
        )
      );
      setToast({
        type: "success",
        message: `${editingMember.first_name} ${editingMember.last_name} updated.`,
      });
    } else {
      setToast({ type: "error", message: "Failed to update member." });
    }

    setEditOpen(false);
    setEditingMember(null);
  }

  // A member's deacon(s) are derived from their ward — see the read-only
  // display in the edit dialog. Ward selection just updates editWardId.
  function handleEditWardChange(wardId: string) {
    setEditWardId(wardId);
  }

  // Deacon(s) of a given ward, derived from deacons.ward_id (may be multiple).
  function getDeaconsForWardId(wardId: string): Deacon[] {
    if (!wardId || wardId === "__none__") return [];
    return deacons.filter((d) => d.ward_id === wardId);
  }

  // ── Delete member ────────────────────────────────────────────────
  async function handleDeleteMember(member: Member) {
    setConfirmDeleteMember(member);
  }

  async function doDeleteMember(member: Member) {
    setConfirmDeleteMember(null);
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

  // ── Approve pending member ───────────────────────────────────────
  async function handleApprove(member: Member) {
    setApprovingId(member.id);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/members/${member.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setToast({ type: "error", message: data.error || "Failed to approve member." });
        return;
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, is_approved: true } : m))
      );
      setToast({
        type: "success",
        message: `${member.first_name} ${member.last_name} has been approved.`,
      });
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setApprovingId(null);
    }
  }

  // ── Bulk selection helpers ───────────────────────────────────────
  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function toggleSelectAll(rows: Member[], checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const m of rows) {
        if (checked) next.add(m.id);
        else next.delete(m.id);
      }
      return next;
    });
  }

  // ── CSV export (respects the active search + status + tag filters) ──
  function csvCell(value: string): string {
    // Guard against CSV injection and quote-escape.
    const v = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${v.replace(/"/g, '""')}"`;
  }

  function exportCSV(rows: Member[]) {
    const headers = ["Name", "Email", "Phone", "Role", "Status", "Ward", "Tags"];
    const lines = [headers.map(csvCell).join(",")];
    for (const m of rows) {
      const ward = getWardForMember(m.id);
      const status = (m as unknown as { status?: string }).status ?? "active";
      const tagNames = (m.tags ?? []).map((t) => t.name).join("; ");
      const primaryRole = ROLE_LABELS[m.role] ?? m.role;
      lines.push(
        [
          `${m.first_name} ${m.last_name}`.trim(),
          m.email ?? "",
          m.phone ?? "",
          primaryRole,
          status,
          ward?.name ?? "",
          tagNames,
        ]
          .map((c) => csvCell(String(c)))
          .join(",")
      );
    }

    // Prepend BOM so Excel reads UTF-8 correctly.
    const blob = new Blob(["﻿" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ type: "success", message: `Exported ${rows.length} member${rows.length !== 1 ? "s" : ""} to CSV.` });
  }

  // ── Bulk actions ─────────────────────────────────────────────────
  async function runBulk(action: string, value?: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkBusy(true);
    setToast(null);
    try {
      const res = await fetch("/api/admin/members/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: "error", message: data.error || "Bulk action failed." });
        return;
      }
      const labels: Record<string, string> = {
        archive: "Archived",
        set_status: "Updated status for",
        add_tag: "Tagged",
        remove_tag: "Untagged",
      };
      setToast({
        type: "success",
        message: `${labels[action] ?? "Updated"} ${data.count ?? ids.length} member${(data.count ?? ids.length) !== 1 ? "s" : ""}.`,
      });
      clearSelection();
      await fetchData();
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setBulkBusy(false);
    }
  }

  // ── Tag management ───────────────────────────────────────────────
  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) return;
    setCreatingTag(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: newTagColor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: "error", message: data.error || "Failed to create tag." });
        return;
      }
      setAllTags((prev) =>
        [...prev, data.tag].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewTagName("");
      setToast({ type: "success", message: `Tag "${data.tag.name}" created.` });
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setCreatingTag(false);
    }
  }

  async function handleDeleteTag(tag: TagOption) {
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: "error", message: data.error || "Failed to delete tag." });
        return;
      }
      setAllTags((prev) => prev.filter((t) => t.id !== tag.id));
      // Drop the tag from any loaded member rows + clear it from the filter.
      setMembers((prev) =>
        prev.map((m) => ({ ...m, tags: (m.tags ?? []).filter((t) => t.id !== tag.id) }))
      );
      if (tagFilter === tag.id) setTagFilter("all");
      setToast({ type: "success", message: `Tag "${tag.name}" deleted.` });
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    }
  }

  // Members awaiting approval (newest first, following the list order).
  const pendingMembers = members.filter((m) => m.is_approved === false);

  // ── Filter + paginate ────────────────────────────────────────────
  const filtered = members.filter((m) => {
    // Status filter — exclude deceased by default; show all when filter = "all"
    const status = (m as unknown as { status?: string }).status ?? "active";
    if (statusFilter === "all" && status === "deceased") return false;
    if (statusFilter !== "all" && status !== statusFilter) return false;

    // Tag filter
    if (tagFilter !== "all" && !(m.tags ?? []).some((t) => t.id === tagFilter)) return false;

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
        action={
          <Link href="/admin/members/import">
            <Button variant="outline" size="sm">Import CSV</Button>
          </Link>
        }
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

      {/* Pending approval queue */}
      {pendingMembers.length > 0 && (
        <FadeIn>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-900/10">
            <div className="flex items-center gap-2 border-b border-amber-200 px-4 py-3 dark:border-amber-900/40">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Pending approval
              </h2>
              <Badge
                variant="outline"
                className="border-0 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
              >
                {pendingMembers.length}
              </Badge>
            </div>
            <ul className="divide-y divide-amber-100 dark:divide-amber-900/30">
              {pendingMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={member.photo_url}
                        alt={`${member.first_name} ${member.last_name}`}
                      />
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                        {member.first_name?.[0]}
                        {member.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-warm-900 dark:text-warm-50">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="truncate text-xs text-warm-500">{member.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(member)}
                    disabled={approvingId === member.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {approvingId === member.id ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                        Approve
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      )}

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
          <Input
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="visitor">Visitor</SelectItem>
            <SelectItem value="deceased">Deceased</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={(v) => { setTagFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All tags" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {allTags.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCSV(filtered)}
          title="Export the filtered members to CSV"
          className="gap-1.5"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTagsDialogOpen(true)}
          title="Create or delete tags"
          className="gap-1.5"
        >
          <TagsIcon className="h-4 w-4" />
          Manage tags
        </Button>
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

      {/* Bulk actions bar — visible when one or more members are selected */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-purple-200 bg-purple-50/70 px-4 py-3 dark:border-purple-900/40 dark:bg-purple-900/10">
          <span className="text-sm font-medium text-purple-900 dark:text-purple-200">
            {selectedIds.size} selected
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={bulkBusy}
            onClick={() => runBulk("archive")}
            className="h-9 gap-1.5 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300"
            title="Archive selected members"
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>

          <Select
            value=""
            disabled={bulkBusy}
            onValueChange={(v) => runBulk("set_status", v)}
          >
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Set status…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="visitor">Visitor</SelectItem>
              <SelectItem value="deceased">Deceased</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value=""
            disabled={bulkBusy || allTags.length === 0}
            onValueChange={(v) => runBulk("add_tag", v)}
          >
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Add tag…" /></SelectTrigger>
            <SelectContent>
              {allTags.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value=""
            disabled={bulkBusy || allTags.length === 0}
            onValueChange={(v) => runBulk("remove_tag", v)}
          >
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Remove tag…" /></SelectTrigger>
            <SelectContent>
              {allTags.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {bulkBusy && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            disabled={bulkBusy}
            className="ml-auto h-9 gap-1.5 text-warm-500"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <FadeIn>
        <div className="rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-warm-50 dark:bg-warm-900">
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Select all filtered members"
                    checked={filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id))}
                    onCheckedChange={(v) => toggleSelectAll(filtered, v === true)}
                  />
                </TableHead>
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
                    colSpan={9}
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
                    <TableRow key={member.id} data-state={selectedIds.has(member.id) ? "selected" : undefined}>
                      {/* Select */}
                      <TableCell className="w-10">
                        <Checkbox
                          aria-label={`Select ${member.first_name} ${member.last_name}`}
                          checked={selectedIds.has(member.id)}
                          onCheckedChange={(v) => toggleSelect(member.id, v === true)}
                        />
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={member.photo_url} alt={`${member.first_name} ${member.last_name}`} />
                            <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                              {member.first_name?.[0]}{member.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-warm-900 dark:text-warm-50">
                            {member.first_name} {member.last_name}
                          </span>
                        </div>
                        {member.families && member.families.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {member.families.map((f) => (
                              <Badge
                                key={f.id}
                                variant="outline"
                                className="border-0 bg-warm-100 text-warm-600 dark:bg-warm-800 dark:text-warm-300 text-[10px] px-1.5 py-0"
                              >
                                {f.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {member.tags && member.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {member.tags.map((t) => (
                              <span
                                key={t.id}
                                className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium ${
                                  t.color ? "" : "bg-warm-100 text-warm-600 dark:bg-warm-800 dark:text-warm-300"
                                }`}
                                style={
                                  t.color
                                    ? { backgroundColor: `${t.color}22`, color: t.color }
                                    : undefined
                                }
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-warm-600 dark:text-warm-400">
                        {member.email}
                      </TableCell>

                      {/* Roles — multi, editable via dialog */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => openRolesDialog(member)}
                          className="group flex flex-wrap items-center gap-1 rounded-md p-1 -m-1 text-left hover:bg-warm-50 dark:hover:bg-warm-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          title="Manage roles"
                        >
                          {memberRoles(member).map((r) => (
                            <Badge
                              key={r}
                              variant="outline"
                              className={`border-0 ${ROLE_BADGE_COLORS[r] ?? ""}`}
                            >
                              {ROLE_LABELS[r] ?? r}
                            </Badge>
                          ))}
                          <Pencil className="h-3 w-3 text-warm-400 opacity-0 group-hover:opacity-100" />
                        </button>
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
              Edit Member
            </DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4">
              <p className="text-sm text-warm-600">
                Update ward, deacon, family, and ministry assignments for{" "}
                <span className="font-medium">{editingMember.first_name} {editingMember.last_name}</span>.
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
                <Label>Deacon(s)</Label>
                {(() => {
                  const wardDeacons = getDeaconsForWardId(editWardId);
                  return (
                    <p className="text-sm text-warm-700 dark:text-warm-200">
                      {wardDeacons.length > 0
                        ? wardDeacons
                            .map(
                              (d) =>
                                `${d.title ? `${d.title} ` : ""}${d.first_name} ${d.last_name}`
                            )
                            .join(", ")
                        : "None"}
                    </p>
                  );
                })()}
                <p className="text-xs text-warm-400">
                  Derived from the member&apos;s ward. Assign deacons on the Deacons page.
                </p>
              </div>

              {/* Families */}
              <div className="space-y-2">
                <Label>Families</Label>
                {allFamilies.length === 0 ? (
                  <p className="text-xs text-warm-400">
                    No families yet. Create them on the Families page.
                  </p>
                ) : (
                  <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-warm-200 dark:border-warm-800 p-2">
                    {allFamilies.map((f) => {
                      const checked = editFamilyIds.includes(f.id);
                      return (
                        <label
                          key={f.id}
                          htmlFor={`fam-${f.id}`}
                          className="flex items-center gap-3 rounded-md px-2 py-1.5 cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-800"
                        >
                          <Checkbox
                            id={`fam-${f.id}`}
                            checked={checked}
                            onCheckedChange={(v) =>
                              setEditFamilyIds((prev) =>
                                v === true
                                  ? [...new Set([...prev, f.id])]
                                  : prev.filter((x) => x !== f.id)
                              )
                            }
                          />
                          <span className="text-sm text-warm-700 dark:text-warm-200">
                            {f.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ministries */}
              <div className="space-y-2">
                <Label>Ministries</Label>
                {allMinistries.length === 0 ? (
                  <p className="text-xs text-warm-400">
                    No ministries yet. Create them on the Ministries page.
                  </p>
                ) : (
                  <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-warm-200 dark:border-warm-800 p-2">
                    {allMinistries.map((m) => {
                      const checked = editMinistryIds.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          htmlFor={`min-${m.id}`}
                          className="flex items-center gap-3 rounded-md px-2 py-1.5 cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-800"
                        >
                          <Checkbox
                            id={`min-${m.id}`}
                            checked={checked}
                            onCheckedChange={(v) =>
                              setEditMinistryIds((prev) =>
                                v === true
                                  ? [...new Set([...prev, m.id])]
                                  : prev.filter((x) => x !== m.id)
                              )
                            }
                          />
                          <span className="text-sm text-warm-700 dark:text-warm-200">
                            {m.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Membership details */}
              <div className="space-y-3 rounded-lg border border-warm-200 dark:border-warm-800 p-3">
                <Label className="text-xs uppercase tracking-wide text-warm-500">
                  Membership
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-mtype" className="text-xs">Type</Label>
                    <Select
                      value={editMembership.membership_type || "member"}
                      onValueChange={(v) => setEditMembership((s) => ({ ...s, membership_type: v }))}
                    >
                      <SelectTrigger id="edit-mtype"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="regular_attender">Regular Attender</SelectItem>
                        <SelectItem value="visitor">Visitor</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-hjoined" className="text-xs">How joined</Label>
                    <Select
                      value={editMembership.how_joined || "__none__"}
                      onValueChange={(v) => setEditMembership((s) => ({ ...s, how_joined: v === "__none__" ? "" : v }))}
                    >
                      <SelectTrigger id="edit-hjoined"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__"><span className="text-warm-400">—</span></SelectItem>
                        <SelectItem value="baptism">Baptism</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="statement">Statement of Faith</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-mdate" className="text-xs">Member since</Label>
                    <Input
                      id="edit-mdate"
                      type="date"
                      value={editMembership.membership_date}
                      onChange={(e) => setEditMembership((s) => ({ ...s, membership_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-marital" className="text-xs">Marital status</Label>
                    <Select
                      value={editMembership.marital_status || "__none__"}
                      onValueChange={(v) => setEditMembership((s) => ({ ...s, marital_status: v === "__none__" ? "" : v }))}
                    >
                      <SelectTrigger id="edit-marital"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__"><span className="text-warm-400">—</span></SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-occ" className="text-xs">Occupation</Label>
                  <Input
                    id="edit-occ"
                    value={editMembership.occupation}
                    onChange={(e) => setEditMembership((s) => ({ ...s, occupation: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-purple-700 hover:bg-purple-600 text-white"
                >
                  Save
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Manage Roles Dialog ─────────────────────────────────────── */}
      <Dialog
        open={rolesOpen}
        onOpenChange={(open) => {
          setRolesOpen(open);
          if (!open) setRolesMember(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Manage Roles
            </DialogTitle>
          </DialogHeader>
          {rolesMember && (
            <div className="space-y-4">
              <p className="text-sm text-warm-600">
                Assign one or more roles to{" "}
                <span className="font-medium">
                  {rolesMember.first_name} {rolesMember.last_name}
                </span>
                .
              </p>

              <div className="space-y-2">
                {ALL_ROLES.map((r) => {
                  const checked = selectedRoles.includes(r);
                  return (
                    <label
                      key={r}
                      htmlFor={`role-${r}`}
                      className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                        checked
                          ? "border-purple-300 bg-purple-50/60 dark:border-purple-700 dark:bg-purple-900/20"
                          : "border-warm-200 dark:border-warm-800 hover:bg-warm-50 dark:hover:bg-warm-800"
                      } ${r === "member" ? "opacity-90" : ""}`}
                    >
                      <Checkbox
                        id={`role-${r}`}
                        checked={checked}
                        disabled={r === "member"}
                        onCheckedChange={(v) => toggleRole(r, v === true)}
                      />
                      <Badge
                        variant="outline"
                        className={`border-0 ${ROLE_BADGE_COLORS[r] ?? ""}`}
                      >
                        {ROLE_LABELS[r]}
                      </Badge>
                      {r === "member" && (
                        <span className="ml-auto text-xs text-warm-400">
                          baseline
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <p className="text-xs text-warm-400">
                Admin-level roles can be granted by Pastor, Admin, or Super Admin.
              </p>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRolesOpen(false)}
                  disabled={savingRoles}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRoles}
                  disabled={savingRoles}
                  className="bg-purple-700 hover:bg-purple-600 text-white"
                >
                  {savingRoles ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Roles"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDeleteMember} onOpenChange={(o) => { if (!o) setConfirmDeleteMember(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-warm-600 dark:text-warm-400">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-warm-900 dark:text-warm-100">
              {confirmDeleteMember?.first_name} {confirmDeleteMember?.last_name}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteMember(null)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => confirmDeleteMember && doDeleteMember(confirmDeleteMember)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manage Tags Dialog ──────────────────────────────────────── */}
      <Dialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Manage Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Create tag */}
            <div className="space-y-2">
              <Label htmlFor="new-tag">Create a tag</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Tag color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-warm-200 dark:border-warm-800 bg-transparent p-0.5"
                />
                <Input
                  id="new-tag"
                  placeholder="Tag name (e.g. Choir, New Convert)"
                  value={newTagName}
                  maxLength={100}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !creatingTag && newTagName.trim()) {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                />
                <Button
                  onClick={handleCreateTag}
                  disabled={creatingTag || !newTagName.trim()}
                  className="shrink-0 bg-purple-700 hover:bg-purple-600 text-white"
                >
                  {creatingTag ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Existing tags */}
            <div className="space-y-2">
              <Label>Existing tags</Label>
              {allTags.length === 0 ? (
                <p className="text-xs text-warm-400">No tags yet. Create one above.</p>
              ) : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-warm-200 dark:border-warm-800 p-2">
                  {allTags.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-warm-50 dark:hover:bg-warm-800"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                          style={{ backgroundColor: t.color ?? "#94a3b8" }}
                        />
                        <span className="truncate text-sm text-warm-700 dark:text-warm-200">
                          {t.name}
                        </span>
                        <span className="text-xs text-warm-400">
                          {t.member_count ?? 0}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTag(t)}
                        className="h-8 w-8 shrink-0 p-0 text-warm-400 hover:text-red-600 hover:bg-red-50"
                        title={`Delete tag "${t.name}"`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-warm-400">
                Deleting a tag removes it from every member.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTagsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
