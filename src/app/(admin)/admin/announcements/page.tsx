"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { formatDate } from "@/lib/utils";
import type { Announcement } from "@/types";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";

const CATEGORIES = ["church", "youth", "finance", "ministry", "outreach"];

export default function AnnouncementManagementPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  // Delete confirmation dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] =
    useState<Announcement | null>(null);

  // Form field state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formCategory, setFormCategory] = useState("");

  // ── Data fetching ─────────────────────────────────────────────────
  async function loadData() {
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      setAnnouncements(data.announcements ?? []);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ── Form helpers ──────────────────────────────────────────────────
  function resetForm() {
    setFormTitle("");
    setFormBody("");
    setFormStartDate("");
    setFormEndDate("");
    setFormIsPinned(false);
    setFormCategory("");
    setEditingAnnouncement(null);
  }

  function openCreateDialog() {
    resetForm();
    setFormOpen(true);
  }

  function openEditDialog(announcement: Announcement) {
    setEditingAnnouncement(announcement);
    setFormTitle(announcement.title);
    setFormBody(announcement.body);
    setFormStartDate(announcement.start_date);
    setFormEndDate(announcement.end_date ?? "");
    setFormIsPinned(announcement.is_pinned);
    setFormCategory(announcement.category ?? "");
    setFormOpen(true);
  }

  async function handleSave() {
    const payload = {
      title: formTitle,
      body: formBody,
      start_date: formStartDate,
      end_date: formEndDate || undefined,
      is_pinned: formIsPinned,
      category: formCategory || undefined,
    };

    if (editingAnnouncement) {
      const res = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingAnnouncement.id, ...payload }),
      });
      if (res.ok) {
        loadData();
      }
    } else {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        loadData();
      }
    }
    setFormOpen(false);
    resetForm();
  }

  function openDeleteDialog(announcement: Announcement) {
    setDeletingAnnouncement(announcement);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (deletingAnnouncement) {
      const res = await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingAnnouncement.id }),
      });
      if (res.ok) {
        loadData();
      }
    }
    setDeleteOpen(false);
    setDeletingAnnouncement(null);
  }

  // ── Column definitions ────────────────────────────────────────────
  const columns = [
    {
      key: "title",
      label: "Title",
      sortable: true,
    },
    {
      key: "start_date",
      label: "Start Date",
      render: (item: Announcement) => formatDate(item.start_date),
    },
    {
      key: "end_date",
      label: "End Date",
      render: (item: Announcement) =>
        item.end_date ? formatDate(item.end_date) : "—",
    },
    {
      key: "is_pinned",
      label: "Pinned",
      render: (item: Announcement) => (
        <Badge variant={item.is_pinned ? "default" : "secondary"}>
          {item.is_pinned ? "Pinned" : "No"}
        </Badge>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (item: Announcement) =>
        item.category ? (
          <Badge variant="outline" className="capitalize">
            {item.category}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: Announcement) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(item);
            }}
            className="h-8 w-8 p-0 text-warm-500 hover:text-purple-700 hover:bg-purple-50"
            title="Edit announcement"
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
            title="Delete announcement"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Announcements"
        description="Manage church announcements"
        action={
          <Button
            onClick={openCreateDialog}
            className="bg-purple-700 hover:bg-purple-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Button>
        }
      />

      <DataTable
        data={announcements as unknown as Record<string, unknown>[]}
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        searchable
        searchKeys={["title", "body"]}
      />

      {/* Create / Edit Announcement Dialog */}
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
              {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Announcement title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                placeholder="Announcement body"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_pinned"
                checked={formIsPinned}
                onCheckedChange={(checked) => setFormIsPinned(checked === true)}
              />
              <Label htmlFor="is_pinned">Pinned</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <span className="capitalize">{cat}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            >
              {editingAnnouncement ? "Update Announcement" : "Save Announcement"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Delete Announcement
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement?
            </DialogDescription>
          </DialogHeader>
          {deletingAnnouncement && (
            <p className="text-sm text-warm-600">
              <span className="font-medium">{deletingAnnouncement.title}</span>{" "}
              will be permanently removed.
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
