"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import type { UserRole } from "@/types";

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
}

// ── Constants ────────────────────────────────────────────────────────
const ROLE_LABELS: Record<UserRole, string> = {
  member: "Member",
  deacon: "Deacon",
  minister: "Minister",
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
  admin: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  super_admin:
    "bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-200",
};

const ALL_ROLES: UserRole[] = [
  "member",
  "deacon",
  "minister",
  "admin",
  "super_admin",
];

const PAGE_SIZE = 10;

// ── Page Component ───────────────────────────────────────────────────
export default function MemberManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Fetch members from Supabase ──────────────────────────────────
  const fetchMembers = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/admin/members");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch members");
      }
      const data = await res.json();
      setMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

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
              fetchMembers();
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
            fetchMembers();
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
                <TableHead className="font-medium">Phone</TableHead>
                <TableHead className="font-medium">Member Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-warm-400"
                  >
                    {search ? "No members match your search" : "No members found"}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((member) => (
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
                  </TableRow>
                ))
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
    </div>
  );
}
