"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Target,
  Calendar,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  total_pledged: number;
  total_received: number;
}

type Toast = { message: string; type: "success" | "error" } | null;

interface FormState {
  name: string;
  description: string;
  goal_amount: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  goal_amount: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

function currency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function pct(part: number, whole: number | null): number {
  if (!whole || whole <= 0) return 0;
  return Math.min(100, Math.round((part / whole) * 100));
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/campaigns");
    if (res.ok) {
      const json = await res.json();
      setCampaigns(json.campaigns ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(c: Campaign) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      goal_amount: c.goal_amount != null ? String(c.goal_amount) : "",
      start_date: c.start_date ?? "",
      end_date: c.end_date ?? "",
      is_active: c.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      goal_amount: form.goal_amount === "" ? null : Number(form.goal_amount),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active,
    };

    const res = editing
      ? await fetch(`/api/admin/campaigns/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (res.ok) {
      showToast(editing ? "Campaign updated" : "Campaign created");
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      load();
    } else {
      const json = await res.json().catch(() => ({}));
      showToast(json.error ?? "Failed to save campaign", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/campaigns/${deleteTarget.id}`, {
      method: "DELETE",
    });
    const json = await res.json().catch(() => ({}));
    setDeleteTarget(null);
    if (res.ok) {
      showToast(json.message ?? "Campaign deleted");
      load();
    } else {
      showToast(json.error ?? "Failed to delete campaign", "error");
    }
  }

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
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <AdminPageHeader
        title="Campaigns"
        description="Track fundraising goals, pledges, and gifts received"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-purple-700 hover:bg-purple-600 text-white"
                onClick={openCreate}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">
                  {editing ? "Edit Campaign" : "New Campaign"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="campName">Name *</Label>
                  <Input
                    id="campName"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Building Fund 2026"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campDesc">Description</Label>
                  <Textarea
                    id="campDesc"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="What is this campaign for?"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campGoal">Goal Amount ($)</Label>
                  <Input
                    id="campGoal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.goal_amount}
                    onChange={(e) =>
                      setForm({ ...form, goal_amount: e.target.value })
                    }
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campStart">Start Date</Label>
                    <Input
                      id="campStart"
                      type="date"
                      value={form.start_date}
                      onChange={(e) =>
                        setForm({ ...form, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campEnd">End Date</Label>
                    <Input
                      id="campEnd"
                      type="date"
                      value={form.end_date}
                      onChange={(e) =>
                        setForm({ ...form, end_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-warm-100 dark:border-warm-800 p-3">
                  <div>
                    <Label htmlFor="campActive">Active</Label>
                    <p className="text-xs text-warm-500">
                      Active campaigns appear in the member portal
                    </p>
                  </div>
                  <Switch
                    id="campActive"
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-purple-700 hover:bg-purple-600 text-white"
                >
                  {saving
                    ? "Saving…"
                    : editing
                      ? "Save Changes"
                      : "Create Campaign"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-warm-500">Loading…</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-warm-200 dark:border-warm-800">
          <Target className="mx-auto h-8 w-8 text-warm-400" />
          <p className="mt-2 text-warm-500">No campaigns yet</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create your first campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {campaigns.map((c) => {
            const receivedPct = pct(c.total_received, c.goal_amount);
            const pledgedPct = pct(c.total_pledged, c.goal_amount);
            return (
              <div
                key={c.id}
                className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-900 p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-lg font-semibold text-warm-900 dark:text-warm-50">
                        {c.name}
                      </h3>
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {c.description && (
                      <p className="mt-1 text-sm text-warm-500">
                        {c.description}
                      </p>
                    )}
                    {(c.start_date || c.end_date) && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-warm-400">
                        <Calendar className="h-3 w-3" />
                        {c.start_date ?? "—"} to {c.end_date ?? "—"}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${c.name}`}
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => setDeleteTarget(c)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-warm-600 dark:text-warm-300">
                        Received
                      </span>
                      <span className="font-semibold text-warm-900 dark:text-warm-50">
                        {currency(c.total_received)}
                        {c.goal_amount != null && (
                          <span className="ml-1 font-normal text-warm-400">
                            of {currency(c.goal_amount)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-warm-100 dark:bg-warm-800">
                      <div
                        className="h-full rounded-full bg-purple-600 transition-all"
                        style={{ width: `${receivedPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-warm-600 dark:text-warm-300">
                        Pledged
                      </span>
                      <span className="font-semibold text-warm-900 dark:text-warm-50">
                        {currency(c.total_pledged)}
                        {c.goal_amount != null && (
                          <span className="ml-1 font-normal text-warm-400">
                            of {currency(c.goal_amount)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-warm-100 dark:bg-warm-800">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${pledgedPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete campaign?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently deleted. If it has linked gifts or pledges, it will be deactivated instead.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
