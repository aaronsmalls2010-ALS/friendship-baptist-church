"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_ROLES } from "@/lib/auth/roles";
import { CheckCircle, XCircle, UserPlus, UserMinus } from "lucide-react";

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  user_roles: { role: string }[];
}

type Toast = { message: string; type: "success" | "error" } | null;
type Row = Record<string, unknown>;

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800",
  pastor:      "bg-indigo-100 text-indigo-800",
  admin:       "bg-blue-100 text-blue-800",
  finance:     "bg-emerald-100 text-emerald-800",
  minister:    "bg-amber-100 text-amber-800",
  musician:    "bg-yellow-100 text-yellow-800",
  deacon:      "bg-orange-100 text-orange-800",
  member:      "bg-warm-100 text-warm-700",
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [pendingRole, setPendingRole] = useState<Record<string, string>>({});

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers((await res.json()).users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeRole(userId: string, role: string, action: "grant" | "revoke") {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, role, action }),
    });
    if (res.ok) {
      showToast(`Role ${action === "grant" ? "granted" : "revoked"}`);
      load();
    } else {
      const json = await res.json();
      showToast(json.error ?? "Failed", "error");
    }
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: Row) => {
        const u = row as unknown as AdminUser;
        return <span className="font-medium">{u.first_name} {u.last_name}</span>;
      },
    },
    {
      key: "email",
      label: "Email",
      render: (row: Row) => <span className="text-sm text-warm-500">{(row as unknown as AdminUser).email}</span>,
    },
    {
      key: "roles",
      label: "Roles",
      render: (row: Row) => {
        const u = row as unknown as AdminUser;
        const roles = u.user_roles?.map((r) => r.role) ?? [u.role];
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
              <span key={r} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[r] ?? "bg-warm-100 text-warm-700"}`}>
                {r}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "grant",
      label: "Grant Role",
      render: (row: Row) => {
        const u = row as unknown as AdminUser;
        const currentRoles = u.user_roles?.map((r) => r.role) ?? [];
        const available = (ALL_ROLES as readonly string[]).filter((r) => !currentRoles.includes(r));
        return (
          <div className="flex items-center gap-1">
            <Select value={pendingRole[u.id] ?? ""} onValueChange={(v) => setPendingRole((p) => ({ ...p, [u.id]: v }))}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {available.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={!pendingRole[u.id]}
              onClick={() => { if (pendingRole[u.id]) changeRole(u.id, pendingRole[u.id], "grant"); }}
              aria-label="Grant role">
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
    {
      key: "revoke",
      label: "Revoke Role",
      render: (row: Row) => {
        const u = row as unknown as AdminUser;
        const roles = u.user_roles?.map((r) => r.role) ?? [];
        return (
          <div className="flex flex-wrap gap-1">
            {roles.filter((r) => r !== "member").map((r) => (
              <Button key={r} size="sm" variant="ghost"
                className="h-6 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                onClick={() => changeRole(u.id, r, "revoke")}
                aria-label={`Revoke ${r}`}>
                <UserMinus className="h-3 w-3 mr-1" />{r}
              </Button>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div role="alert"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <AdminPageHeader
        title="User Management"
        description="Manage member roles across the church"
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        Role changes take effect immediately. Users will need to sign out and back in for their session to reflect the new roles.
      </div>

      {loading ? (
        <div className="text-center py-12 text-warm-500">Loading…</div>
      ) : (
        <DataTable
          data={users as unknown as Record<string, unknown>[]}
          columns={columns as Parameters<typeof DataTable>[0]["columns"]}
          searchable
          searchKeys={["first_name", "last_name", "email"]}
        />
      )}
    </div>
  );
}
