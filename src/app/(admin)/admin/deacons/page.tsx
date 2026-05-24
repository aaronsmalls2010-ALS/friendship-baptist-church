"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { MOCK_DEACONS, MOCK_WARDS, MOCK_PROFILES } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { Deacon } from "@/types";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function DeaconManagementPage() {
  const [deacons, setDeacons] = useState<Deacon[]>([...MOCK_DEACONS]);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeacon, setEditingDeacon] = useState<Deacon | null>(null);

  // Delete confirmation dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingDeacon, setDeletingDeacon] = useState<Deacon | null>(null);

  // Form field state
  const [formProfileId, setFormProfileId] = useState("");
  const [formWardId, setFormWardId] = useState("");
  const [formOrdainedDate, setFormOrdainedDate] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  function resetForm() {
    setFormProfileId("");
    setFormWardId("");
    setFormOrdainedDate("");
    setFormTitle("");
    setFormIsActive(true);
    setEditingDeacon(null);
  }

  function openCreateDialog() {
    resetForm();
    setFormOpen(true);
  }

  function openEditDialog(deacon: Deacon) {
    setEditingDeacon(deacon);
    setFormProfileId(deacon.profile_id);
    setFormWardId(deacon.ward_id ?? "");
    setFormOrdainedDate(deacon.ordained_date ?? "");
    setFormTitle(deacon.title ?? "");
    setFormIsActive(deacon.is_active);
    setFormOpen(true);
  }

  function handleSave() {
    const profile = MOCK_PROFILES.find((p) => p.id === formProfileId);
    const ward = MOCK_WARDS.find((w) => w.id === formWardId);

    if (editingDeacon) {
      setDeacons((prev) =>
        prev.map((d) =>
          d.id === editingDeacon.id
            ? {
                ...d,
                profile_id: formProfileId || d.profile_id,
                ward_id: formWardId || undefined,
                ordained_date: formOrdainedDate || undefined,
                title: formTitle || undefined,
                is_active: formIsActive,
                first_name: profile?.first_name ?? d.first_name,
                last_name: profile?.last_name ?? d.last_name,
                phone: profile?.phone ?? d.phone,
                ward_name: ward?.name ?? undefined,
              }
            : d
        )
      );
    } else {
      const newDeacon: Deacon = {
        id: `d${Date.now()}`,
        profile_id: formProfileId,
        ward_id: formWardId || undefined,
        ordained_date: formOrdainedDate || undefined,
        title: formTitle || undefined,
        is_active: formIsActive,
        created_at: new Date().toISOString(),
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        phone: profile?.phone,
        photo_url: profile?.photo_url,
        ward_name: ward?.name,
      };
      setDeacons((prev) => [...prev, newDeacon]);
    }
    setFormOpen(false);
    resetForm();
  }

  function openDeleteDialog(deacon: Deacon) {
    setDeletingDeacon(deacon);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (deletingDeacon) {
      setDeacons((prev) => prev.filter((d) => d.id !== deletingDeacon.id));
    }
    setDeleteOpen(false);
    setDeletingDeacon(null);
  }

  const columns = [
    {
      key: "first_name",
      label: "Name",
      render: (item: Deacon) => (
        <span>
          {item.title && (
            <span className="text-xs text-gold-600 font-medium">{item.title} — </span>
          )}
          {item.first_name} {item.last_name}
        </span>
      ),
    },
    {
      key: "ward_name",
      label: "Ward",
      render: (item: Deacon) => <span>{item.ward_name ?? "—"}</span>,
    },
    {
      key: "phone",
      label: "Phone",
      render: (item: Deacon) => <span>{item.phone ?? "—"}</span>,
    },
    {
      key: "ordained_date",
      label: "Ordained",
      render: (item: Deacon) => (
        <span>{item.ordained_date ? formatDate(item.ordained_date) : "—"}</span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (item: Deacon) => (
        <Badge variant={item.is_active ? "default" : "secondary"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: Deacon) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(item);
            }}
            className="h-8 w-8 p-0 text-warm-500 hover:text-purple-700 hover:bg-purple-50"
            title="Edit deacon"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(item);
            }}
            className="h-8 w-8 p-0 text-warm-500 hover:text-red-600 hover:bg-red-50"
            title="Delete deacon"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Deacons"
        description="Manage deacon assignments"
        action={
          <Button
            onClick={openCreateDialog}
            className="bg-purple-700 hover:bg-purple-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Assign Deacon
          </Button>
        }
      />

      <DataTable
        data={deacons as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
        searchable
        searchKeys={["first_name", "last_name", "ward_name"]}
      />

      {/* Create / Edit Deacon Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editingDeacon ? "Edit Deacon" : "Assign Deacon"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="member">Member</Label>
              <Select value={formProfileId} onValueChange={setFormProfileId}>
                <SelectTrigger id="member">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_PROFILES.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.first_name} {profile.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ward">Ward</Label>
              <Select value={formWardId} onValueChange={setFormWardId}>
                <SelectTrigger id="ward">
                  <SelectValue placeholder="Select a ward" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_WARDS.map((ward) => (
                    <SelectItem key={ward.id} value={ward.id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="e.g. Chairman, Vice Chairman, Emeritus"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordained_date">Ordained Date</Label>
              <Input
                id="ordained_date"
                type="date"
                value={formOrdainedDate}
                onChange={(e) => setFormOrdainedDate(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formIsActive}
                onCheckedChange={(checked) => setFormIsActive(checked === true)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            >
              {editingDeacon ? "Update Deacon" : "Save Deacon"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Remove Deacon
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this deacon assignment?
            </DialogDescription>
          </DialogHeader>
          {deletingDeacon && (
            <p className="text-sm text-warm-600">
              <span className="font-medium">
                {deletingDeacon.title ? `${deletingDeacon.title} ` : ""}
                {deletingDeacon.first_name} {deletingDeacon.last_name}
              </span>{" "}
              will be removed from the deacon board.
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
