"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FadeIn } from "@/components/motion/fade-in";
import { Eye, Loader2 } from "lucide-react";

interface Ministry {
  id: string;
  name: string;
  description: string | null;
  schedule: string | null;
  is_active: boolean;
}

type MinistryRow = {
  id: string;
  name: string;
  description: string;
  schedule: string;
  is_active: boolean;
};

const columns = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (item: MinistryRow) => (
      <span className="font-medium text-warm-900 dark:text-warm-50">
        {item.name}
      </span>
    ),
  },
  {
    key: "description",
    label: "Description",
    render: (item: MinistryRow) => (
      <span className="text-sm text-warm-500 line-clamp-1 max-w-xs">
        {item.description}
      </span>
    ),
  },
  {
    key: "schedule",
    label: "Schedule",
    render: (item: MinistryRow) => (
      <span className="text-sm text-warm-600 dark:text-warm-300">
        {item.schedule}
      </span>
    ),
  },
  {
    key: "is_active",
    label: "Status",
    render: (item: MinistryRow) =>
      item.is_active ? (
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
      ),
  },
  {
    key: "actions",
    label: "View",
    render: (item: MinistryRow) => (
      <Link href={`/admin/ministries/${item.id}`}>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      </Link>
    ),
  },
];

export default function MinistryManagementPage() {
  const [ministries, setMinistries] = useState<MinistryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSchedule, setFormSchedule] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadMinistries = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ministries");
      const data = await res.json();
      const rows: MinistryRow[] = (data.ministries ?? []).map((m: Ministry) => ({
        id: m.id,
        name: m.name,
        description: m.description ?? "",
        schedule: m.schedule ?? "",
        is_active: m.is_active,
      }));
      setMinistries(rows);
    } catch (err) {
      console.error("Failed to load ministries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMinistries(); }, [loadMinistries]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Ministries"
        description="Manage church ministries"
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

      <FadeIn>
        <DataTable
          data={ministries as unknown as Record<string, unknown>[]}
          columns={columns as Parameters<typeof DataTable>[0]["columns"]}
          searchable
          searchKeys={["name"]}
          pageSize={10}
        />
      </FadeIn>
    </div>
  );
}
