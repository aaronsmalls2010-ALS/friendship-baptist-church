"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";

interface DonationType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

type Toast = { message: string; type: "success" | "error" } | null;

export default function DonationTypesPage() {
  const [types, setTypes] = useState<DonationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/donation-types");
    if (res.ok) {
      const json = await res.json();
      setTypes(json.types);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/donation-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
    });
    setSaving(false);
    if (res.ok) {
      showToast("Donation type created");
      setNewName(""); setNewDesc(""); setDialogOpen(false);
      load();
    } else {
      const json = await res.json();
      showToast(json.error ?? "Failed to create type", "error");
    }
  }

  async function toggleActive(type: DonationType) {
    const res = await fetch(`/api/admin/donation-types/${type.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !type.is_active }),
    });
    if (res.ok) {
      showToast(type.is_active ? "Type deactivated" : "Type activated");
      load();
    } else {
      showToast("Failed to update type", "error");
    }
  }

  const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "slug", label: "Slug", render: (t: DonationType) => (
      <span className="font-mono text-xs text-warm-500">{t.slug}</span>
    )},
    { key: "description", label: "Description", render: (t: DonationType) => (
      <span className="text-sm text-warm-500">{t.description ?? "—"}</span>
    )},
    { key: "sort_order", label: "Order", sortable: true },
    { key: "is_active", label: "Status", render: (t: DonationType) => (
      <div className="flex items-center gap-2">
        <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)}
          aria-label={`Toggle ${t.name}`} />
        <Badge variant={t.is_active ? "default" : "secondary"}>
          {t.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div
          role="alert"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success"
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <AdminPageHeader
        title="Donation Types"
        description="Manage the categories available for recording gifts"
        action={
          <FormDialog
            title="New Donation Type"
            triggerLabel="Add Type"
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          >
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="typeName">Name *</Label>
                <Input id="typeName" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Benevolence" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="typeDesc">Description</Label>
                <Textarea id="typeDesc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional description" rows={3} />
              </div>
              <Button type="submit" disabled={saving}
                className="w-full bg-purple-700 hover:bg-purple-600 text-white">
                {saving ? "Creating…" : "Create Type"}
              </Button>
            </form>
          </FormDialog>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-warm-500">Loading…</div>
      ) : (
        <DataTable
          data={types as unknown as Record<string, unknown>[]}
          columns={columns as Parameters<typeof DataTable>[0]["columns"]}
          searchable
          searchKeys={["name", "slug"]}
        />
      )}
    </div>
  );
}
