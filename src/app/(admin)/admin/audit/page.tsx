"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw } from "lucide-react";

interface AuditEvent {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

function actionColor(action: string) {
  if (action.includes("delete") || action.includes("void") || action.includes("archive")) return "destructive";
  if (action.includes("create") || action.includes("signup")) return "default";
  if (action.includes("update") || action.includes("restore") || action.includes("change")) return "secondary";
  if (action.includes("grant") || action.includes("approved")) return "default";
  if (action.includes("revoke") || action.includes("denied")) return "destructive";
  return "outline";
}

function humanizeAction(event: AuditEvent): string {
  const meta = event.metadata ?? {};

  switch (event.action) {
    case "role.grant": return `Granted the "${meta.role}" role`;
    case "role.revoke": return `Revoked the "${meta.role}" role`;
    case "roles.change": return "Updated roles";
    case "member.create": return "Added a new member";
    case "member.approved": return "Approved a member's account";
    case "member.deleted": return "Removed a member";
    case "settings.update": return "Updated church settings";
    case "auth.signup": return "New member registered";
    case "donation.create": return "Recorded a donation";
    case "donation.void": return "Voided a donation";
    case "ministry.membership_action":
      return `${meta.action === "approve" ? "Approved" : "Denied"} a ministry membership`;
    default: {
      const parts = event.action.split(".");
      if (parts.length === 2) {
        const [resource, verb] = parts;
        return `${verb.charAt(0).toUpperCase() + verb.slice(1)} ${resource}`;
      }
      return event.action;
    }
  }
}

const RESOURCE_LABELS: Record<string, string> = {
  member: "Member",
  members: "Member",
  settings: "Settings",
  role: "Role",
  roles: "Role",
  donation: "Donation",
  donations: "Donation",
  ministry: "Ministry",
  auth: "Account",
  user: "User",
  event: "Event",
  events: "Event",
  announcement: "Announcement",
  announcements: "Announcement",
};

function friendlyResource(resourceType: string): string {
  const lower = resourceType.toLowerCase();
  return RESOURCE_LABELS[lower] || resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
}

function summarizeDetails(event: AuditEvent): string | null {
  const meta = event.metadata ?? {};
  const parts: string[] = [];

  if (meta.role) parts.push(`Role: ${meta.role}`);
  if (meta.target_user) parts.push(`Target: ${meta.target_user}`);
  if (meta.target_email) parts.push(`Target: ${meta.target_email}`);
  if (meta.email && !meta.target_email) parts.push(`Email: ${meta.email}`);
  if (meta.amount) parts.push(`Amount: $${meta.amount}`);
  if (meta.fields_changed) {
    const fields = Array.isArray(meta.fields_changed)
      ? meta.fields_changed.join(", ")
      : String(meta.fields_changed);
    parts.push(`Changed: ${fields}`);
  }
  if (meta.reason) parts.push(`Reason: ${meta.reason}`);
  if (meta.ministry_name) parts.push(`Ministry: ${meta.ministry_name}`);

  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filterAction) params.set("action", filterAction);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);

    const res = await fetch(`/api/admin/audit?${params}`);
    if (res.ok) {
      const json = await res.json();
      setEvents(json.events);
      setTotal(json.total);
    }
    setLoading(false);
  }, [page, filterAction, filterFrom, filterTo]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    {
      key: "created_at",
      label: "Time",
      render: (e: AuditEvent) => (
        <span className="text-xs text-warm-500">
          {new Date(e.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (e: AuditEvent) => (
        <Badge variant={actionColor(e.action)} className="text-xs">
          {humanizeAction(e)}
        </Badge>
      ),
    },
    {
      key: "resource_type",
      label: "Resource",
      render: (e: AuditEvent) => (
        <span className="text-sm">{friendlyResource(e.resource_type)}</span>
      ),
    },
    {
      key: "user_id",
      label: "Performed By",
      render: (e: AuditEvent) => (
        <span className="text-xs text-warm-500">
          {e.user_id ? e.user_id.slice(0, 8) + "…" : "System"}
        </span>
      ),
    },
    {
      key: "metadata",
      label: "Details",
      render: (e: AuditEvent) => {
        const details = summarizeDetails(e);
        return details ? (
          <span className="text-xs text-warm-400">{details}</span>
        ) : (
          <span className="text-xs text-warm-300">&mdash;</span>
        );
      },
    },
  ];

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit Log"
        description="Read-only record of all admin actions"
      />

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="filterAction">Action contains</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-warm-400" />
                <Input
                  id="filterAction"
                  className="pl-8 w-48"
                  placeholder="e.g. donation"
                  value={filterAction}
                  onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="filterFrom">From</Label>
              <Input id="filterFrom" type="date" className="w-36"
                value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filterTo">To</Label>
              <Input id="filterTo" type="date" className="w-36"
                value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1); }} />
            </div>
            <Button variant="outline" size="sm" onClick={load} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          <DataTable
            data={events as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
            searchable={false}
            pageSize={50}
          />
          <div className="flex items-center justify-between text-sm text-warm-500">
            <span>{total} total events</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="px-2 py-1">Page {page} of {totalPages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
